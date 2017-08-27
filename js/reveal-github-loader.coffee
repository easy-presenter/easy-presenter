class IndexFileLine
  @nameRegexp: new RegExp('\\[([^\\]]*)\\]')
  @pathRegexp: new RegExp('.*\\]\\(([^\\)]*)\\)')

  constructor: (@line) ->

  isDirectory: =>
    @path().slice(-3) != '.md'

  name: =>
    res = @line.match(IndexFileLine.nameRegexp)
    return @line if !res || res.length < 2
    res[1]

  path: =>
    res = @line.match(IndexFileLine.pathRegexp)
    return @line if !res || res.length < 2
    res[1]

  depth: =>
    @path().split('/').length - 2 #'./any_file'

  isRoot: =>
    @depth() == 0

  parentPath: =>
    return '/' if @path.indexOf('/') == -1 # top level

    @path().split('/').pop().join('/')


class PresentationTrack
  constructor: (@loader, @indexFileLine=null) ->
    @children = []
    @content  = ''

  append: (track) =>
    @children.push(track)

  isDirectory: =>
    @indexFileLine.isDirectory()

  isRoot: =>
    @indexFileLine.isRoot()

  path: =>
    @indexFileLine.path()

  remotePath: =>
    path = "#{@loader.src}/#{@path()}"

    return path if @indexFileLine && !@isDirectory()

    return "#{path}/00_overview.md" # if directory

  isRootTrack: =>
    @indexFileLine == null

  load: (callback) =>
    defered = []
    @children.map (child) =>
      defered.push(child.load())

    unless @isRootTrack()
      defered.push(
        $.ajax
          url: @remotePath()
          success: (data) =>
            @content = data
      )

    $.when.apply($, defered).always( callback )

  render: =>
    renderedChildren = @children.map( (child) ->
      child.render()
    )

    @renderSections(renderedChildren.join("\n\n"))

  renderSections: (childrenContent)=>
    return childrenContent if @isRootTrack()

    str = ""

    # add a section for vertical slides if it is a toplevel folder
    str+= "<section>" if @isRoot()

    str+= @renderSection(@remotePath(), @content) if @content

    if childrenContent
      if !@isDirectory()
        str+= @renderSection(@remotePath(), childrenContent)
      else
        str+= childrenContent

    # add a section for vertical slides if it is a toplevel folder
    str+= "</section>" if @isRoot()

    str

  renderSection: (remotePath, content)=>
    "<section data-markdown data-section-source='#{remotePath}'>" +
      "<script type='text/template'>#{content}</script>" +
    "</section>"


class PresentationTrackRaw extends PresentationTrack
  constructor: (@loader, @name, @path, content, @isDirectory=false, @isRoot=true) ->
    super @loader, new IndexFileLine("  - [#{@name}](#{@path})")
    @content = content

  load: (callback) =>
    defered = []
    @children.map (child) =>
      defered.push(child.load())

    $.when.apply($, defered).always(callback)

  isDirectory: =>
    @isDirectory

  isRoot: =>
    @isRoot

  path: =>

    @path

class PresentationComposer
  constructor: (@loader) ->
    @rootTrack = new PresentationTrack(@loader)

  compose: (dataAsString, callback) =>
    lastRoot = @rootTrack
    for line in dataAsString.split('\n')
      continue if line.indexOf('-') == -1

      line        = new IndexFileLine(line)
      track       = new PresentationTrack(@loader, line)

      if line.isRoot()
        @rootTrack.append(track)

        lastRoot = track

      else
        lastRoot.append(track)

    @render(callback)

  render: (callback) =>
    @rootTrack.load =>
      @loader.container.append(@rootTrack.render())
      callback()


class @CwRevealLoader
  constructor: (@config) ->
    @src       = @config.presentation
    @readme    = @config.readme
    @container = $(@config.selector)
    @composer  = new PresentationComposer(@)
    @loadPresentation(@src)

  loadPresentation: (src) =>
    @startSlide = ''

    $.ajax(
      url: "#{src}/index.md"
      success: (data) =>
        @composer.compose(data, @initializeReveal)
    )

  initializeReveal: =>
    Reveal.initialize @config.reveal


class @CwGithubLinkForSLide
  @appendGithubLinksToSLides: ->
    slides = $('.reveal .slides section')
    $.each slides, (index, slide) ->
      # https://github.com/easy-presentations/cw-wordpress-divi/blob/master/pages/de/00_index/00_overview.md
      # https://raw.github/easy-presentations/cw-wordpress-divi/master/pages/de/00_index/00_overview.md
      url = $(slide).data('section-source')

      return unless url

      return if url.indexOf('00_index/02_topics') != -1

      url = url.replace('raw.githubusercontent.com', 'github.com')
      url = url.replace('/master/', '/blob/master/')

      $('h1, h2, h3, h4', slide).first().prepend("<a href='#{url}' target='_blank' title='view on github' class='github-source'> </a>")


class @CwRelativePathResolver
  @pathRegexp: new RegExp('.*\\]\\((\\./[^\\)]*)\\)', 'g')

  @resolve: ->
    slides = $('.reveal .slides section')
    $.each slides, (index, slide) ->
      images = $('img', slide)
      $.each images, (index, image) ->
        $image = $(image)
        relativeSource = $image.attr('cw-data-src') || $image.attr('src')
        $parentSection = $image.closest('section')
        $parentSection.addClass 'with-image'
        if relativeSource.indexOf('./') == 0
          sectionSource = $parentSection.data('section-source')
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
          sectionSource = $parentSection.data('section-source')
          tmp = sectionSource.split('/')
          tmp.pop()
          sectionBasePath = tmp.join('/')
          absolutePath = sectionBasePath + '/' + relativeSource.slice(2)
          $links.attr 'href', absolutePath

  @appendSources: =>
    $('section > section', '.reveal .slides').first().append(
      "<ul><li>source: <a href='#{cwRevealConfig.src}' target='_blank'>github</a></li>" +
      "<li>pdf <small>(Chrome)</small>: <a href='#{window.location.href.split("#")[0]}?print-pdf' target='_blank'>pdf</a></li></ul>"
    )
