jQuery(document).ready ($) ->

  Reveal.addEventListener 'ready', ->
    CwRelativePathResolver.resolve()
    $('.fancybox').fancybox selector: '.fancybox'
    $('body').removeClass 'loading'
    $('.loader').fadeOut(->
      $('.reveal .slides').fadeIn()
    )

  setTimeout( ->
    new CwRevealLoader(
      $.extend(true, {
        selector: '.reveal .slides'
        reveal: {
          autoSlideMethod: Reveal.navigateNext
          dependencies: [
            {
              src: 'lib/js/classList.js'
              condition: -> !document.body.classList
            },{
              src: 'plugin/markdown/marked.js'
              condition: -> ! !document.querySelector('[data-markdown]')
            },{
              src: 'plugin/markdown/markdown.js'
              condition: -> ! !document.querySelector('[data-markdown]')
            },{
              src: 'plugin/highlight/highlight.js'
              async: true
              callback: -> hljs.initHighlightingOnLoad()
            },{
              src: 'plugin/zoom-js/zoom.js'
              async: true
            },{
              src: 'plugin/notes/notes.js'
              async: true
            },{
              src: 'plugin/math/math.js'
              async: true
            }
          ]
        }
      }, window.cwRevealConfig)
    )
  , 1000)
