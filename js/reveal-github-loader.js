(function() {
  var IndexFileLine, PresentationComposer, PresentationTrack,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  IndexFileLine = (function() {
    IndexFileLine.nameRegexp = new RegExp('\\[([^\\]]*)\\]');

    IndexFileLine.pathRegexp = new RegExp('.*\\]\\(([^\\)]*)\\)');

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
    function PresentationTrack(loader, indexFileLine) {
      this.loader = loader;
      this.indexFileLine = indexFileLine != null ? indexFileLine : null;
      this.renderSection = bind(this.renderSection, this);
      this.renderSections = bind(this.renderSections, this);
      this.render = bind(this.render, this);
      this.load = bind(this.load, this);
      this.isRootTrack = bind(this.isRootTrack, this);
      this.remotePath = bind(this.remotePath, this);
      this.path = bind(this.path, this);
      this.isRoot = bind(this.isRoot, this);
      this.isDirectory = bind(this.isDirectory, this);
      this.append = bind(this.append, this);
      this.children = [];
      this.content = '';
    }

    PresentationTrack.prototype.append = function(track) {
      return this.children.push(track);
    };

    PresentationTrack.prototype.isDirectory = function() {
      return this.indexFileLine.isDirectory();
    };

    PresentationTrack.prototype.isRoot = function() {
      return this.indexFileLine.isRoot();
    };

    PresentationTrack.prototype.path = function() {
      return this.indexFileLine.path();
    };

    PresentationTrack.prototype.remotePath = function() {
      var path;
      path = this.loader.src + "/" + (this.path());
      if (this.indexFileLine && !this.isDirectory()) {
        return path;
      }
      return path + "/00_teaser.md";
    };

    PresentationTrack.prototype.isRootTrack = function() {
      return this.indexFileLine === null;
    };

    PresentationTrack.prototype.load = function(callback) {
      var defered;
      defered = [];
      this.children.map((function(_this) {
        return function(child) {
          return defered.push(child.load());
        };
      })(this));
      if (!this.isRootTrack() && !this.isDirectory()) {
        defered.push($.ajax({
          url: this.remotePath(),
          success: (function(_this) {
            return function(data) {
              return _this.content = data;
            };
          })(this)
        }));
      }
      return $.when.apply($, defered).always(callback);
    };

    PresentationTrack.prototype.render = function() {
      var renderedChildren;
      renderedChildren = this.children.map(function(child) {
        return child.render();
      });
      return this.renderSections(renderedChildren.join("\n\n"));
    };

    PresentationTrack.prototype.renderSections = function(childrenContent) {
      var str;
      if (this.isRootTrack()) {
        return childrenContent;
      }
      str = "";
      if (this.isRoot()) {
        str += "<section>";
      }
      if (this.content) {
        str += this.renderSection(this.remotePath(), this.content);
      }
      if (childrenContent) {
        if (!this.isDirectory()) {
          str += this.renderSection(this.remotePath(), childrenContent);
        } else {
          str += childrenContent;
        }
      }
      if (this.isRoot()) {
        str += "</section>";
      }
      return str;
    };

    PresentationTrack.prototype.renderSection = function(remotePath, content) {
      return ("<section data-markdown data-section-source='" + remotePath + "'>") + ("<script type='text/template'>" + content + "</script>") + "</section>";
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

    PresentationComposer.prototype.compose = function(dataAsString, callback) {
      var i, lastRoot, len, line, ref, track;
      lastRoot = this.rootTrack;
      ref = dataAsString.split('\n');
      for (i = 0, len = ref.length; i < len; i++) {
        line = ref[i];
        if (line.indexOf('-') === -1) {
          continue;
        }
        line = new IndexFileLine(line);
        track = new PresentationTrack(this.loader, line);
        if (line.isRoot()) {
          this.rootTrack.append(track);
          lastRoot = track;
        } else {
          lastRoot.append(track);
        }
      }
      return this.render(callback);
    };

    PresentationComposer.prototype.render = function(callback) {
      return this.rootTrack.load((function(_this) {
        return function() {
          _this.loader.container.append(_this.rootTrack.render());
          return callback();
        };
      })(this));
    };

    return PresentationComposer;

  })();

  this.CwRevealLoader = (function() {
    function CwRevealLoader(config) {
      this.config = config;
      this.initializeReveal = bind(this.initializeReveal, this);
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
            return _this.composer.compose(data, _this.initializeReveal);
          };
        })(this)
      });
    };

    CwRevealLoader.prototype.initializeReveal = function() {
      return Reveal.initialize(this.config.reveal);
    };

    return CwRevealLoader;

  })();

  this.CwGithubLinkForSLide = (function() {
    function CwGithubLinkForSLide() {}

    CwGithubLinkForSLide.appendGithubLinksToSLides = function() {
      var slides;
      slides = $('.reveal .slides section');
      return $.each(slides, function(index, slide) {
        var url;
        url = $(slide).data('section-source');
        if (!url) {
          return;
        }
        if (url.indexOf('00_index/02_topics') !== -1) {
          return;
        }
        url = url.replace('raw.githubusercontent.com', 'github.com');
        url = url.replace('/master/', '/blob/master/');
        return $('h1, h2, h3, h4', slide).first().prepend("<a href='" + url + "' target='_blank' title='view on github' class='github-source'> </a>");
      });
    };

    return CwGithubLinkForSLide;

  })();

  this.CwRelativePathResolver = (function() {
    function CwRelativePathResolver() {}

    CwRelativePathResolver.pathRegexp = new RegExp('.*\\]\\((\\./[^\\)]*)\\)', 'g');

    CwRelativePathResolver.resolve = function() {
      var slides;
      slides = $('.reveal .slides section');
      return $.each(slides, function(index, slide) {
        var images, links;
        images = $('img', slide);
        $.each(images, function(index, image) {
          var $image, $imageLink, $parentSection, absolutePath, relativeSource, sectionBasePath, sectionSource, tmp;
          $image = $(image);
          relativeSource = $image.attr('cw-data-src') || $image.attr('src');
          $parentSection = $image.closest('section');
          $parentSection.addClass('with-image');
          if (relativeSource.indexOf('./') === 0) {
            sectionSource = $parentSection.data('section-source');
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
            sectionSource = $parentSection.data('section-source');
            tmp = sectionSource.split('/');
            tmp.pop();
            sectionBasePath = tmp.join('/');
            absolutePath = sectionBasePath + '/' + relativeSource.slice(2);
            return $links.attr('href', absolutePath);
          }
        });
      });
    };

    CwRelativePathResolver.appendSources = function() {
      return $('section > section', '.reveal .slides').first().append(("<ul><li>source: <a href='" + cwRevealConfig.src + "' target='_blank'>github</a></li>") + ("<li>pdf <small>(Chrome)</small>: <a href='" + (window.location.href.split("#")[0]) + "?print-pdf' target='_blank'>pdf</a></li></ul>"));
    };

    return CwRelativePathResolver;

  })();

}).call(this);

//# sourceMappingURL=maps/reveal-github-loader.js.map
