import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

/**
 * The <artist-grid> is the custom element used for showing and sorting any number of artists. It's designed
 * to respond to changes from a <control-group>.
 *
 * Supported attributes:
 * 
 * - `ids` (unique): An array of track ID's to show. Use an asterisk (`*`) instead of an array to show all artists.
 * - `genres` (unique): The artists shown will be all artists in these genres.
 * - `size`: Set to `full` for when the grid takes 100% of the view width. Only effects CSS.
 * - `titlei18nkey`: Set this to a i18n key and the grid will render the translation as the title. This has a higher priority than `titlestring`.
 * - `titlestring`: Set this to a string and the grid will render it as the title.
 * - `orderby`: Supports `name`. A `<control-group>` may overwrite this value.
 * - `order`: Set this to `asc` or `desc` to manually order the artists. Must be used with the `orderby` attribute. A `<control-group>` may overwrite this value.
 */
export class ArtistGrid extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    this.boundArtistListener = this.onNewArtist.bind(this)
    this.boundWindowResizeListener = this.onWindowResize.bind(this)
    this.resizeTimout = null

    // @listens new-artist
    //Bridge.ipcListen('new-artist', this.boundArtistListener)

    this.registerEventListeners()

    // start manually observing attributes
    this.watchAttr(['order', 'orderby'], async (changes) => {
      __(this).removeAttr('data-pages-loaded')
      let queryObj = await this.buildQueryObj()
      if (!queryObj) return
      this.Query = await new Query(queryObj)

      this.build()
    })

    let queryObj = await this.buildQueryObj()

    // the query object may not find anything
    if (!queryObj) return

    this.Query = await new Query(queryObj)
    this.pageIsLoading = false
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    // if the Query did not find anything, do not render.
    // this can happen with when looking for "similar" artists.
    if (!this.Query) {
      return
    }

    this.innerHTML = await html('/elements/artist-grid/artist-grid.html')
    
    let grid = __(this).find('.grid')

    // reset the layout
    __(this).removeAttr('data-pages-loaded')
    grid.html('')

    // maybe render the title
    this._renderTitle()

    // there's nothing to show
    if (!this.Query.results.length) {
      return
    }

    for (let artist of this.Query.results) {
      grid.appendHtml(/*html*/`<artist-block artistid="${artist.id}"></artist-block>`)
    }

    __(this).attr('data-pages-loaded', 1)
    __('.view-content').el().scrollTop = 0

    // if showing all artists, create loaded illusion
    if (__(this).attr('ids') === '*') {
      // let the injected <artist-block>'s render their innards first
      setTimeout(() => {
        this.createLoadedIllusion()
      }, 100)
    }
  }

  /**
   * When this instance is removed from the document.
   */
  onRemoved() {
    // this block may have not rendered
    if (__(this).hasClass('no-artists')) return

    //Bridge.removeListener('new-artist', this.boundArtistListener)
    window.removeEventListener('resize', this.boundWindowResizeListener)
  }

  /**
   * Registers event listeners for this instance.
   */
  registerEventListeners() {
    // register the infinite scroll handler when showing all albums
    if (__(this).attr('ids') === '*') {
      this.supportInfiniteScroll(() => {
        this.onInfiniteScroll()
      }, '.view-content')
    }

    window.addEventListener('resize', this.boundWindowResizeListener)
  }

  /**
   * Triggered every time the user scrolls far enough down to trigger a load point.
   */
  async onInfiniteScroll() {
    // do nothing if already loading a page
    if (this.pageIsLoading) return

    this.pageIsLoading = true
    
    let pageToLoad = __(this).attr('data-pages-loaded') + 1

    // we have loaded all pages
    if (pageToLoad > this.Query.pages) {
      this.pageIsLoading = false
      return
    }
    
    // load the next page of results
    await this.Query.goToPage(pageToLoad)
    let grid = __(this).find('.grid')
    
    // inject the tracks of this page.
    // since infinite scroll is only enabled when showing ALL artists, we can assume all are in scope
    for (let artist of this.Query.results) {
      grid.appendHtml(/*html*/`<artist-block artistid="${artist.id}"></artist-block>`)
    }

    // update the attribute
    __(this).attr('data-pages-loaded', pageToLoad)

    this.pageIsLoading = false
  }

  /**
   * When the window is resized (after 200ms of not resizing)
   */
  onWindowResize(event) {
    clearTimeout(this.resizeTimout)

    this.resizeTimout = setTimeout(() => {
      if (__('music-app').hasClass('no-music')) {
        return
      }

      // refresh the illusion if showing all albums
      if (__(this).attr('ids') === '*') {
        this.createLoadedIllusion()
      }
    }, 200)
  }

  /**
   * Whenever a new artist is added to the database, add a new <album-block> to the top of the
   * grid, regardless of sorting.
   */
  onNewArtist(row) {
    let isInScope = false

    if (__(this).attr('ids') === '*') {
      isInScope = true
    }

    if (isInScope) {
      __(this).find('.grid').prependHtml(/*html*/`<artist-block artistid="${row.id}"></artist-block>`)
    }
  }

  /**
   * Renders the title of the grid.
   */
  _renderTitle() {
    // erase old title
    __(this).find('.title').remove()
    
    let titleKey = __(this).attr('titlei18nkey')

    if (titleKey) {
      __(this).prependHtml(/*html*/`<h3 class="title">${i18n(titleKey)}</h3>`)
      return
    }

    let titleString = __(this).attr('titlestring')

    if (titleString) {
      __(this).prependHtml(/*html*/`<h3 class="title">${titleString}</h3>`)
      return
    }
  }

  /**
   * This is triggered on the first render of ids=* instances, and it estimates how tall this artist-grid
   * will be when fully loaded, and sets the min-height to that to create the illusion of being fully loaded.
   */
  createLoadedIllusion() {
    let loadedAlbumBlocks = __(this).find('.grid artist-block')
    let exampleArtistBlock = loadedAlbumBlocks.getShortest().el()
    let artistBlockHeight = __(exampleArtistBlock).height()
    let artistBlockMarginBottom = parseInt(window.getComputedStyle(exampleArtistBlock).marginBottom)
    let itemsPerRow = __(this).itemsPerRow('artist-block')
    let rowsToSimulate = this.Query.totalResults / itemsPerRow[0]
    let firstRowHeight = artistBlockHeight + artistBlockMarginBottom

    __('.artist-grid-outer').css({'min-height': firstRowHeight * rowsToSimulate})
  }

  /**
   * Builds the queryObj based on the Element attributes.
   */
  async buildQueryObj() {
    let idsAttr = __(this).attr('ids')
    let orderByAttr = __(this).attr('orderby')
    let orderAttr = __(this).attr('order')
    let genresAttr = __(this).attr('genres')

    // if there is no data-pages-loaded attribute, set to 0
    let currentPage = __(this).attr('data-pages-loaded') || Number(0)
    let queryObj = {}

    // showing all artists
    if (idsAttr === '*') {
      queryObj.table = 'music_artists',
      queryObj.orderBy = {'artist_plaintext_name': 'ASC'}
      queryObj.page = currentPage + 1
    }
    // showing specific ID's
    else if (Array.isArray(idsAttr)) {
      queryObj.table = 'music_artists'
      queryObj.itemsPerPage = -1
      queryObj.equalityOperator = 'IN'
      queryObj.columns = {
        'id': idsAttr
      }
    }
    // showing all artists that are in the same genre
    // TODO this whole section is disgusting and needs to be moved to an API
    // endpoint
    else if (genresAttr && genresAttr.length) {
      // get all tracks in the genres that the artist is in
      let genreMetaRowsQuery = await new Query({
        'table': 'music_track_meta',
        'itemPerPage': -1,
        'columns': [
          {
            'meta_key': 'genre',
          },
          {
            'meta_value': genresAttr,
            'equalityOperator': 'IN'
          }
        ]
      })

      let trackIds = genreMetaRowsQuery.results.map(metaRow => metaRow.meta_object_id)

      let tracksInGenresQuery = await new Query({
        'table': 'music_tracks',
        'itemPerPage': -1,
        'columns': [
          {
            'id': trackIds,
            'equalityOperator': 'IN'
          }
        ]
      })

      // get all artists from the tracks
      let artistsInGenres = new Set()

      for (let row of tracksInGenresQuery.results) {
        artistsInGenres.add(row.track_artist_id)
      }
      
      if (__(this).attr('exclude')) {
        artistsInGenres.delete(__(this).attr('exclude'))
      }

      artistsInGenres = Array.from(artistsInGenres)

      if (!artistsInGenres.length) {
        __(this).addClass('no-artists')
        return
      }

      queryObj.table = 'music_artists'
      queryObj.itemsPerPage = -1,
      queryObj.columns = {
        'id': artistsInGenres,
        'equalityOperator': 'IN'
      }
    }
    
    // we are ordering by a certain column, default to ASC
    if (orderByAttr) {
      queryObj.orderBy = {[orderByAttr]: orderAttr || 'ASC'}
    }

    return queryObj
  }
}