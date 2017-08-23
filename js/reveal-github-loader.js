(function() {
  var IndexFileLine, PresentationComposer, PresentationTrack,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  IndexFileLine = (function() {
    IndexFileLine.nameRegexp = new RegExp('\\[(.*)\\]');

    IndexFileLine.pathRegexp = new RegExp('\\((.*)\\)');

    function IndexFileLine(line1) {
      this.line = line1;
      this.parentPath = bind(this.parentPath, this);
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
      if (res.length < 2) {
        return this.line;
      }
      return res[1];
    };

    IndexFileLine.prototype.path = function() {
      var res;
      res = this.line.match(IndexFileLine.pathRegexp);
      if (res.length < 2) {
        return this.line;
      }
      return res[1];
    };

    IndexFileLine.prototype.depth = function() {
      return this.path().split('/').length - 1;
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
      str = "<section>";
      if (this.indexFileLine.isDirectory()) {
        str += "<section data-markdown>" + (this.indexFileLine.name()) + "</section>";
      } else {
        str += "<section data-markdown='" + (this.remotePath()) + "'></section>";
      }
      str += content;
      str += "</section>";
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
        if (line.depth() === 0) {
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
      this.bootstrap = bind(this.bootstrap, this);
      this.src = this.config.presentation;
      this.container = $(this.config.selector);
      this.composer = new PresentationComposer(this);
      this.bootstrap();
    }

    CwRevealLoader.prototype.bootstrap = function() {
      return this.loadPresentation(this.src + "/README.md");
    };

    CwRevealLoader.prototype.loadPresentation = function(src) {
      return $.ajax({
        url: src,
        success: this.renderPresentation
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

}).call(this);

//# sourceMappingURL=maps/reveal-github-loader.js.map
