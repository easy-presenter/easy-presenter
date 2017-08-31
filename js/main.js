(function() {
  var AppController,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  AppController = (function() {
    function AppController(config) {
      var presentation;
      this.config = config;
      this.onPresentationReady = bind(this.onPresentationReady, this);
      this.loadPresentation = bind(this.loadPresentation, this);
      this.onPresentationIndexReady = bind(this.onPresentationIndexReady, this);
      this.loadPresentationIndex = bind(this.loadPresentationIndex, this);
      presentation = $.urlParam('presentation');
      if (presentation) {
        this.loadPresentation(this.config.src + "/" + presentation);
      } else {
        this.loadPresentationIndex(this.config.src);
      }
    }

    AppController.prototype.hideLoader = function(callBack) {
      return $('.loader').fadeOut(function() {
        $('body').removeClass('loading');
        return $('.loader').hide(callBack);
      });
    };

    AppController.prototype.loadPresentationIndex = function(src) {
      CwPresentationIndexLoader.addReadyEventListener(this.onPresentationIndexReady);
      return new CwPresentationIndexLoader(src, '.presentation-selector');
    };

    AppController.prototype.onPresentationIndexReady = function() {
      return this.hideLoader(function() {
        $('body').addClass('flex-centered');
        return $('.presentation-selector-container').fadeIn();
      });
    };

    AppController.prototype.loadPresentation = function(presentation) {
      CwPresentationLoader.addReadyEventListener(this.onPresentationReady);
      window.cwRevealConfig.presentation = presentation;
      return new CwPresentationLoader(window.cwRevealConfig);
    };

    AppController.prototype.onPresentationReady = function() {
      CwRelativePathResolver.resolve();
      CwGithubLinkForSLide.appendGithubLinksToSLides();
      $('.fancybox').fancybox({
        selector: '.fancybox'
      });
      return this.hideLoader(function() {
        return $('.reveal').fadeIn().show();
      });
    };

    return AppController;

  })();

  jQuery(document).ready(function($) {
    $.urlParam = function(name) {
      var results;
      results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
      if (results === null) {
        return null;
      }
      return decodeURIComponent(results[1]) || 0;
    };
    return new AppController({
      src: 'https://raw.githubusercontent.com/easy-presentations/cw-wordpress-divi/master/presentations'
    });
  });

}).call(this);

//# sourceMappingURL=maps/main.js.map
