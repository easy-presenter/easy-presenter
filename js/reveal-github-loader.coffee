class IndexFileLine
  @nameRegexp: new RegExp('\\[(.*)\\]')
  @pathRegexp: new RegExp('\\((.*)\\)')

  constructor: (@line) ->

  isDirectory: =>
    @path().slice(-3) != '.md'

  name: =>
    res = @line.match(IndexFileLine.nameRegexp)
    return @line if res.length < 2
    res[1]

  path: =>
    res = @line.match(IndexFileLine.pathRegexp)
    return @line if res.length < 2
    res[1]

  depth: =>
    @path().split('/').length - 1

  parentPath: =>
    return '/' if @path.indexOf('/') == -1 # top level

    @path().split('/').pop().join('/')


class PresentationTrack
  @sectionCounter: 0
  constructor: (@loader, @indexFileLine=null) ->
    @children = []

  append: (track) =>
    @children.push(track)

  remotePath: =>
    "#{@loader.src}/#{@indexFileLine.path()}"

  render: =>
    childrenContent = @children.map((child)->
      child.render()
    )

    @renderSection(childrenContent.join("\n\n"))

  renderSection: (content) =>
    unless @indexFileLine #root node
      return content

    str = ""
    str = "<section>" if @indexFileLine.depth() == 0

    if @indexFileLine.isDirectory()
      str+="<section data-markdown># #{@indexFileLine.name()}"

      console.log PresentationTrack.sectionCounter
      if PresentationTrack.sectionCounter == 0
        str+= "\n\n source: [github](#{@loader.readme})"
        str+= "\n\n pdf (only in chrome): [open](#{window.location.href.split("#")[0]}?print-pdf)"

      PresentationTrack.sectionCounter++

      str+="</section>"
    else
      str+="<section data-markdown='#{@remotePath()}' data-remote-path='#{@remotePath()}'></section>"

    str+= content

    str+= "</section>" if @indexFileLine.depth() == 0

    str


class PresentationComposer
  constructor: (@loader) ->
    @rootTrack = new PresentationTrack(@loader)

  compose: (dataAsString) =>
    lastRoot = null
    for line in dataAsString.split('\n')
      continue if line.indexOf('-') == -1

      line        = new IndexFileLine(line)
      track       = new PresentationTrack(@loader, line)

      if line.depth() == 0
        @rootTrack.append(track)
        lastRoot = track

      else
        lastRoot.append(track)

    @render()

  render: =>
    @loader.container.append(@rootTrack.render())


class @CwRevealLoader
  constructor: (@config) ->
    @src       = @config.presentation
    @readme    = @config.readme
    @container = $(@config.selector)
    @composer  = new PresentationComposer(@)
    @bootstrap()

  bootstrap: =>
    @loadPresentation("#{@src}/README.md")

  loadPresentation: (src) =>
    $.ajax
      url: src
      success: @renderPresentation

  renderPresentation: (data) =>
    @composer.compose(data)

    @initializeReveal()

  initializeReveal: =>
    Reveal.initialize @config.reveal

class @CwRelativePathResolver
  @resolve: ->
    slides = $('.reveal .slides section')

    $.each slides, (index, slide) ->
      images = $('img', slide)
      $.each images, (index, image) ->
        console.log image
        $image = $(image)
        relativeSource = $image.attr('src')
        $parentSection = $image.closest('section')
        $parentSection.addClass 'with-image'
        if relativeSource.indexOf('./') == 0
          sectionSource = $parentSection.data('remote-path')
          tmp = sectionSource.split('/')
          tmp.pop()
          sectionBasePath = tmp.join('/')
          absolutePath = sectionBasePath + '/' + relativeSource.slice(2)
          $image.attr 'src', absolutePath
          $imageLink = $("<a class='fancybox' href='#{absolutePath}'/>")
          $image.wrap($imageLink);

      links = $('a', slide)
      $.each links, (index, links) ->
        $links = $(links)
        relativeSource = $links.attr('href')
        $parentSection = $links.closest('section')
        if relativeSource.indexOf('./') == 0
          sectionSource = $parentSection.data('remote-path')
          tmp = sectionSource.split('/')
          tmp.pop()
          sectionBasePath = tmp.join('/')
          absolutePath = sectionBasePath + '/' + relativeSource.slice(2)
          $links.attr 'href', absolutePath
