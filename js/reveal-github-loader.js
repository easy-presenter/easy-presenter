(function() {
  var IndexFileLine, PresentationComposer, PresentationTrack,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  IndexFileLine = (function() {
    IndexFileLine.nameRegexp = new RegExp('\\[(.*)\\]');

    IndexFileLine.pathRegexp = new RegExp('\\((.*)\\)');

    function IndexFileLine(line1) {
      this.line = line1;
      this.parentPath = bind(this.parentPath, this);
      this.isRoot = bind(this.isRoot, this);
      this.depth = bind(this.depth, this);
      this.path = bind(this.path, this);
      this.name = bind(this.name, this);
      this.isDirectory = bind(this.isDirectory, this);
    }

    IndexFileLine.prototype.isDirectory = function() {
      return this.path().slice(-3) !== '.md';
    };

    IndexFileLine.prototype.name = function() {
      var res;
      res = this.line.match(IndexFileLine.nameRegexp);
      if (!res || res.length < 2) {
        return this.line;
      }
      return res[1];
    };

    IndexFileLine.prototype.path = function() {
      var res;
      res = this.line.match(IndexFileLine.pathRegexp);
      if (!res || res.length < 2) {
        return this.line;
      }
      return res[1];
    };

    IndexFileLine.prototype.depth = function() {
      return this.path().split('/').length - 2;
    };

    IndexFileLine.prototype.isRoot = function() {
      return this.depth() === 0;
    };

    IndexFileLine.prototype.parentPath = function() {
      if (this.path.indexOf('/') === -1) {
        return '/';
      }
      return this.path().split('/').pop().join('/');
    };

    return IndexFileLine;

  })();

  PresentationTrack = (function() {
    PresentationTrack.sectionCounter = 0;

    function PresentationTrack(loader, indexFileLine) {
      this.loader = loader;
      this.indexFileLine = indexFileLine != null ? indexFileLine : null;
      this.renderSection = bind(this.renderSection, this);
      this.render = bind(this.render, this);
      this.remotePath = bind(this.remotePath, this);
      this.append = bind(this.append, this);
      this.children = [];
    }

    PresentationTrack.prototype.append = function(track) {
      return this.children.push(track);
    };

    PresentationTrack.prototype.remotePath = function() {
      return this.loader.src + "/" + (this.indexFileLine.path());
    };

    PresentationTrack.prototype.render = function() {
      var childrenContent;
      childrenContent = this.children.map(function(child) {
        return child.render();
      });
      return this.renderSection(childrenContent.join("\n\n"));
    };

    PresentationTrack.prototype.renderSection = function(content) {
      var str;
      if (!this.indexFileLine) {
        return content;
      }
      str = "";
      if (this.indexFileLine.isRoot()) {
        str = "<section>";
      }
      if (this.indexFileLine.isDirectory()) {
        try {
          ({});
        } catch (undefined) {}
        str += "<section data-markdown># " + (this.indexFileLine.name());
        if (PresentationTrack.sectionCounter === 0) {
          str += "\n\n source: [github](" + this.loader.readme + ")";
          str += "\n\n pdf (only in chrome): [open](" + (window.location.href.split("#")[0]) + "?print-pdf)";
        }
        PresentationTrack.sectionCounter++;
        str += "</section>";
      } else {
        str += "<section data-markdown='" + (this.remotePath()) + "' data-remote-path='" + (this.remotePath()) + "'></section>";
      }
      str += content;
      if (this.indexFileLine.isRoot()) {
        str += "</section>";
      }
      return str;
    };

    return PresentationTrack;

  })();

  PresentationComposer = (function() {
    function PresentationComposer(loader) {
      this.loader = loader;
      this.render = bind(this.render, this);
      this.compose = bind(this.compose, this);
      this.rootTrack = new PresentationTrack(this.loader);
    }

    PresentationComposer.prototype.compose = function(dataAsString) {
      var i, lastRoot, len, line, ref, track;
      lastRoot = null;
      ref = dataAsString.split('\n');
      for (i = 0, len = ref.length; i < len; i++) {
        line = ref[i];
        if (line.indexOf('-') === -1) {
          continue;
        }
        line = new IndexFileLine(line);
        track = new PresentationTrack(this.loader, line);
        console.log(line.depth(), line.path());
        if (line.isRoot()) {
          this.rootTrack.append(track);
          lastRoot = track;
        } else {
          lastRoot.append(track);
        }
      }
      return this.render();
    };

    PresentationComposer.prototype.render = function() {
      return this.loader.container.append(this.rootTrack.render());
    };

    return PresentationComposer;

  })();

  this.CwRevealLoader = (function() {
    function CwRevealLoader(config) {
      this.config = config;
      this.initializeReveal = bind(this.initializeReveal, this);
      this.renderPresentation = bind(this.renderPresentation, this);
      this.loadPresentation = bind(this.loadPresentation, this);
      this.src = this.config.presentation;
      this.readme = this.config.readme;
      this.container = $(this.config.selector);
      this.composer = new PresentationComposer(this);
      this.loadPresentation(this.src);
    }

    CwRevealLoader.prototype.loadPresentation = function(src) {
      this.startSlide = '';
      return $.ajax({
        url: src + "/index.md",
        success: (function(_this) {
          return function(data) {
            data = "- [00_overview](./00_overview.md) \n\n " + data;
            return _this.renderPresentation(data);
          };
        })(this)
      });
    };

    CwRevealLoader.prototype.renderPresentation = function(data) {
      this.composer.compose(data);
      return this.initializeReveal();
    };

    CwRevealLoader.prototype.initializeReveal = function() {
      return Reveal.initialize(this.config.reveal);
    };

    return CwRevealLoader;

  })();

  this.CwRelativePathResolver = (function() {
    function CwRelativePathResolver() {}

    CwRelativePathResolver.resolve = function() {
      var slides;
      slides = $('.reveal .slides section');
      return $.each(slides, function(index, slide) {
        var images, links;
        images = $('img', slide);
        $.each(images, function(index, image) {
          var $image, $imageLink, $parentSection, absolutePath, relativeSource, sectionBasePath, sectionSource, tmp;
          console.log(image);
          $image = $(image);
          relativeSource = $image.attr('src');
          $parentSection = $image.closest('section');
          $parentSection.addClass('with-image');
          if (relativeSource.indexOf('./') === 0) {
            sectionSource = $parentSection.data('remote-path');
            tmp = sectionSource.split('/');
            tmp.pop();
            sectionBasePath = tmp.join('/');
            absolutePath = sectionBasePath + '/' + relativeSource.slice(2);
            $image.attr('src', absolutePath);
            $imageLink = $("<a class='fancybox' href='" + absolutePath + "'/>");
            return $image.wrap($imageLink);
          }
        });
        links = $('a', slide);
        return $.each(links, function(index, links) {
          var $links, $parentSection, absolutePath, relativeSource, sectionBasePath, sectionSource, tmp;
          $links = $(links);
          relativeSource = $links.attr('href');
          $parentSection = $links.closest('section');
          if (relativeSource.indexOf('./') === 0) {
            sectionSource = $parentSection.data('remote-path');
            tmp = sectionSource.split('/');
            tmp.pop();
            sectionBasePath = tmp.join('/');
            absolutePath = sectionBasePath + '/' + relativeSource.slice(2);
            return $links.attr('href', absolutePath);
          }
        });
      });
    };

    return CwRelativePathResolver;

  })();

}).call(this);

//# sourceMappingURL=maps/reveal-github-loader.js.map
