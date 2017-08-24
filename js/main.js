(function() {
  jQuery(document).ready(function($) {
    Reveal.addEventListener('ready', function() {
      CwRelativePathResolver.resolve();
      $('.fancybox').fancybox({
        selector: '.fancybox'
      });
      $('body').removeClass('loading');
      return $('.loader').fadeOut(function() {
        return $('.reveal .slides').fadeIn();
      });
    });
    return new CwRevealLoader($.extend(true, {
      selector: '.reveal .slides',
      reveal: {
        autoSlideMethod: Reveal.navigateNext,
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
        ]
      }
    }, window.cwRevealConfig));
  });

}).call(this);

//# sourceMappingURL=maps/main.js.map
