import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

/**
 * The <album-grid> is the custom element used for showing and sorting any number of albums. It's designed
 * to respond to changes from a <control-group>.
 *
 * Supported attributes:
 * 
 * - `ids`: (unique): An array of track ID's to show. Use an asterisk (`*`) instead of an array to show all artists.
 * - `artistid`: (unique) An artist ID, who's albums will be shown.
 * - `size`: Set to `full` for when the grid takes 100% of the view width. Set to `med` when the grid takes approx 50% of the screen width. Only effects CSS.
 * - `titlei18nkey`: Set this to a i18n key and the grid will render the translation as the title. This has a higher priority than `titlestring`.
 * - `titlestring`: Set this to a string and the grid will render it as the title.
 * - `orderby`: Supports `name`. A `<control-group>` may overwrite this value.
 * - `order`: Set this to `asc` or `desc` to manually order the artists. Must be used with the `orderby` attribute. A `<control-group>` may overwrite this value.
 */
export class AlbumGrid extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    //this.boundNewAlbumListener = this.onNewAlbum.bind(this)
    this.boundWindowResizeListener = this.onWindowResize.bind(this)
    this.resizeTimout = null
    this.pageIsLoading = false

    this.registerEventListeners()

    // @listens new-album
    //Bridge.ipcListen('new-album', this.boundNewAlbumListener)

    // observe attributes
    this.watchAttr(['order', 'orderby'], async (changes) => {
      __(this).removeAttr('data-pages-loaded')
      this.Query = await new Query(this.buildQueryObj())
      this.build()
    })
  }

  /**
   * Invoked every time a watched attr changes, this will animate out the old albums
   * and animate in the new ones according to the attrs.
   */
  async onBuild() {
    this.Query = await new Query(this.buildQueryObj())

    this.innerHTML = await html('/elements/album-grid/album-grid.html')

    let grid = __(this).find('.grid')

    // reset the layout
    __(this).removeAttr('data-pages-loaded')
    grid.html('')
    
    // nothing to show
    if (!this.Query.results.length) {
      return
    }
    
    // maybe render the title
    this._renderTitle()

    for (let album of this.Query.results) {
      grid.appendHtml(/*html*/`<album-block albumid="${album.id}" lazy-render></album-block>`)
    }

    __(this).attr('data-pages-loaded', 1)
    __('.view-content').el().scrollTop = 0

    // if showing all albums, create loaded illusion after a block has loaded (triggers once)
    if (__(this).attr('ids') === '*') {
      let observer = new MutationObserver((mutations) => {
        if (this.querySelector('album-block.loaded')) {
          observer.disconnect()
          this.createLoadedIllusion()
        }
      })

      observer.observe(document, {'attributes': false, 'childList': true, 'characterData': false, 'subtree': true})
    }
  }

  async onLoad () {
    // reload query when using cache
    if (!this.Query) {
      this.Query = await new Query(this.buildQueryObj())
    }
  }

  /**
   * When this instance is removed from the document.
   */
  onRemoved() {
    //Bridge.removeListener('new-album', this.boundNewAlbumListener)
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
    // since infinite scroll is only enabled when showing ALL albums, we can assume all are in scope
    for (let album of this.Query.results) {
      grid.appendHtml(/*html*/`<album-block albumid="${album.id}" lazy-render></album-block>`)
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
  onNewAlbum(row) {
    let isInScope = false

    if (__(this).attr('ids') === '*') {
      isInScope = true
    }

    if (isInScope) {
      __(this).find('.grid').prependHtml(/*html*/`<album-block albumid="${row.id}" lazy-render></album-block>`)
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
   * This is triggered on the first render of ids=* instances, and it estimates how tall this album-grid
   * will be when fully loaded, and sets the min-height to that to create the illusion of being fully loaded.
   */
  createLoadedIllusion() {
    let loadedAlbumBlocks = __(this).find('.grid album-block.has-art.loaded')
    let exampleAlbumBlock = loadedAlbumBlocks.getShortest().el()
    let albumBlockHeight = __(exampleAlbumBlock).height()
    let albumBlockMarginBottom = parseInt(window.getComputedStyle(exampleAlbumBlock).marginBottom)
    let itemsPerRow = __(this).itemsPerRow('album-block')
    let rowsToSimulate = this.Query.totalResults / itemsPerRow[0]
    let firstRowHeight = albumBlockHeight + albumBlockMarginBottom

    __('.album-grid-outer').css({'min-height': firstRowHeight * rowsToSimulate})
  }

  /**
   * Builds the queryObj based on the Element attributes.
   */
  buildQueryObj() {
    let idsAttr = __(this).attr('ids')
    let artistIdAttr = __(this).attr('artistid')
    let orderByAttr = __(this).attr('orderby')
    let orderAttr = __(this).attr('order')
    let typeAttr = __(this).attr('releasetype')

    // if there is no data-pages-loaded attribute, set to 0
    let currentPage = __(this).attr('data-pages-loaded') || Number(0)
    let queryObj = {}

    // showing all albums
    if (idsAttr === '*') {
      queryObj.table = 'music_releases',
      queryObj.orderBy = {'release_plaintext_title': 'ASC'}
      queryObj.page = currentPage + 1
    }
    // showing specific ID's
    else if (Array.isArray(idsAttr)) {
      queryObj.table = 'music_releases'
      queryObj.itemsPerPage = -1
      queryObj.columns = {
        'id': idsAttr,
        'equalityOperator': 'IN'
      }
    }
    // showing all albums of an artist
    else if (typeof artistIdAttr === 'number') {
      queryObj.table = 'music_releases'
      queryObj.itemsPerPage = -1
      queryObj.columns = [{
        'release_primary_artist_id': artistIdAttr
      }]
    }

    // if filtering by release type
    if (typeAttr) {
      if (typeAttr === 'other') {
        queryObj.columns.push({
          'release_type': ['album', 'single', 'ep', 'compilation', 'soundtrack', 'live', 'remix'],
          'equalityOperator': 'NOT IN'
        })
      } else {
        queryObj.columns.push({
          'release_type': typeAttr
        })
      }
    }
    
    // we are ordering by a certain column, default to ASC
    if (orderByAttr) {
      queryObj.orderBy = {[orderByAttr]: orderAttr || 'ASC'}
    }

    return queryObj
  }
}