class AppController
  constructor: (@config) ->
    presentation = $.urlParam('presentation')

    if presentation

      @loadPresentation("#{@config.src}/#{presentation}")

    else
      @loadPresentationIndex(@config.src)

  hideLoader: (callBack) ->
    $('.loader').fadeOut(->
      $('body').removeClass 'loading'
      $('.loader').hide( callBack )
    )

  loadPresentationIndex: (src) =>
    CwPresentationIndexLoader.addReadyEventListener @onPresentationIndexReady

    new CwPresentationIndexLoader(src, '.presentation-selector')

  onPresentationIndexReady: =>
    @hideLoader(->
      $('body').addClass 'flex-centered'
      $('.presentation-selector-container').fadeIn()
    )

  loadPresentation: (presentation) =>
    CwPresentationLoader.addReadyEventListener @onPresentationReady

    window.cwRevealConfig.presentation = presentation

    new CwPresentationLoader(window.cwRevealConfig)

  onPresentationReady: =>
    CwRelativePathResolver.resolve()
    CwGithubLinkForSLide.appendGithubLinksToSLides()

    $('.fancybox').fancybox selector: '.fancybox'

    @hideLoader(->
      $('.reveal').fadeIn()
    )


jQuery(document).ready ($) ->
  $.urlParam = (name) ->
    results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href)

    return null if results == null

    decodeURIComponent(results[1]) || 0


  new AppController({
      src: 'https://raw.githubusercontent.com/easy-presentations/cw-wordpress-divi/master/tracks'
    })
