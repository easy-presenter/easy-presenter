(function() {
  jQuery(document).ready(function($) {
    Reveal.addEventListener('ready', function() {
      CwRelativePathResolver.resolve();
      $('.fancybox').fancybox({
        selector: '.fancybox'
      });
      return $('.loader').fadeOut(function() {
        $('body').removeClass('loading');
        return $('.reveal .slides').fadeIn();
      });
    });
    return new CwRevealLoader({
      selector: '.reveal .slides',
      presentation: 'https://raw.githubusercontent.com/easy-presentations/cw-wordpress-divi/master/de',
      readme: 'https://github.com/easy-presentations/cw-wordpress-divi/blob/master/de/README.md',
      reveal: {
        dependencies: [
          {
            src: 'lib/js/classList.js',
            condition: function() {
              return !document.body.classList;
            }
          }, {
            src: 'plugin/markdown/marked.js',
            condition: function() {
              return !!document.querySelector('[data-markdown]');
            }
          }, {
            src: 'plugin/markdown/markdown.js',
            condition: function() {
              return !!document.querySelector('[data-markdown]');
            }
          }, {
            src: 'plugin/highlight/highlight.js',
            async: true,
            callback: function() {
              return hljs.initHighlightingOnLoad();
            }
          }, {
            src: 'plugin/zoom-js/zoom.js',
            async: true
          }, {
            src: 'plugin/notes/notes.js',
            async: true
          }, {
            src: 'plugin/math/math.js',
            async: true
          }
        ],
        controls: true,
        progress: true,
        defaultTiming: 120,
        zoomKey: 'shift',
        slideNumber: 'h.v',
        pdfMaxPagesPerSlide: 1,
        showSlideNumber: 'all',
        history: true,
        keyboard: true,
        overview: true,
        center: true,
        touch: true,
        loop: false,
        rtl: false,
        shuffle: false,
        fragments: true,
        embedded: false,
        help: true,
        showNotes: false,
        autoPlayMedia: null,
        autoSlide: 0,
        autoSlideStoppable: true,
        autoSlideMethod: Reveal.navigateNext,
        mouseWheel: false,
        hideAddressBar: true,
        previewLinks: false,
        transition: 'convex',
        transitionSpeed: 'default',
        backgroundTransition: 'fade',
        viewDistance: 3,
        parallaxBackgroundImage: '',
        parallaxBackgroundSize: '',
        parallaxBackgroundHorizontal: null,
        parallaxBackgroundVertical: null,
        display: 'block'
      }
    });
  });

}).call(this);

//# sourceMappingURL=maps/main.js.map
