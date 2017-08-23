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

    str = "<section>"

    if @indexFileLine.isDirectory()
      str+="<section data-markdown>#{@indexFileLine.name()}</section>"

    else
      str+="<section data-markdown='#{@remotePath()}'></section>"

    str+= content
    str+= "</section>"

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
