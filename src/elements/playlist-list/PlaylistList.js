import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'
import * as formHelpers from '../../../node_modules/cardinal-forms/index.js'

/**
 * The `<playlist-list>` element is used to show any number of `<playlist-block>`'s.
 *
 * Supported attributes:
 * 
 * - `ids` (unique): An array of playlist ID's to show. Use an asterisk (`*`) instead of an array to show all playlists.
 * - `orderby`: Supports `name`. A `<control-group>` may overwrite this value.
 * - `order`: Set this to `asc` or `desc` to manually order the playlists. Must be used with the `orderby` attribute. A `<control-group>` may overwrite this value.
 */
export class PlaylistList extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    this.boundDeletedPlaylistListener = this.onDeletedPlaylist.bind(this)
    this.boundWindowResizeListener = this.onWindowResize.bind(this)
    this.resizeTimout = null

    // @listens deleted-playlist
    Bridge.ipcListen('deleted-playlist', this.boundDeletedPlaylistListener)

    // get the first page of results
    this.Query = await new Query(this.buildQueryObj())
    this.pageIsLoading = false

    // observe attributes
    this.watchAttr(['order', 'orderby'], async (changes) => {
      __(this).removeAttr('data-pages-loaded')
      this.Query = await new Query(this.buildQueryObj())
      this.render()
    })
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/playlist-list/playlist-list.html')

    let list = __(this).find('.playlists')

    // reset the layout
    __(this).removeAttr('data-pages-loaded')
    list.html('')

    // nothing to show
    if (!this.Query.results.length) {
      __(this).addClass('no-playlists')
      return
    }
    
    for (let playlist of this.Query.results) {
      list.appendHtml(/*html*/`<playlist-block playlistid="${playlist.id}"></playlist-block>`)
    }

    __(this).attr('data-pages-loaded', 1)
    __('.view-content').el().scrollTop = 0

    // if showing all playlists, create loaded illusion after a block has loaded (triggers once)
    if (__(this).attr('ids') === '*') {
      let observer = new MutationObserver((mutations) => {
        if (this.querySelector('playlist-block.loaded')) {
          observer.disconnect()
          this.createLoadedIllusion()
        }
      })

      observer.observe(document, {'attributes': false, 'childList': true, 'characterData': false, 'subtree': true})
    }
  }

  /**
   * After the inner HTML has rendered.
   */
  onLoad() {
    this.registerEventListeners()

    formHelpers.prepare(this.querySelector('form#create-playlist'))
  }

  /**
   * When this instance is removed from the document.
   */
  onRemoved() {
    Bridge.removeListener('deleted-playlist', this.boundDeletedAlbumListener)
    window.removeEventListener('resize', this.boundWindowResizeListener)
  }

  /**
   * Registers event listeners for this instance.
   */
  registerEventListeners() {
    /**
     * Register the infinite scroll handler when showing all playlists
     */
    if (__(this).attr('ids') === '*') {
      this.supportInfiniteScroll(() => {
        this.onInfiniteScroll()
      }, '.view-content')
    }

    /**
     * Refresh loaded illusion when the window is resized
     */
    window.addEventListener('resize', this.boundWindowResizeListener)

    /**
     * When the empty message is clicked
     */
    __(this).find('.empty-message').on('click', (event) => {
      let form = __(this).find('form#create-playlist')

      if (!form.hasClass('show')) {
         form.find('button[name="show-fields"]').trigger('click')
      }

      form.find('input[name="new-playlist-name"]').el().focus()
    })

    /**
     * When the "create new playlist" button is clicked
     */
    __(this).find('button[name="show-fields"]').on('click', (event) => {
      event.preventDefault()
      let form = __(this).find('form#create-playlist')
      let fieldParent = __(this).find('form#create-playlist .hidden-fields')

      if (!fieldParent.hasClass('show')) {
        form.addClass('show')
        fieldParent.addClass('show')
        fieldParent.find('input[name="new-playlist-name"]').el().focus()
      } else {
        form.removeClass('show')
        fieldParent.removeClass('show')
      }
    })

    /**
     * On submit of the form
     */
    const form = __(this).find('form#create-playlist')
    form.on('submit', async (event) => {
      event.preventDefault()

      let nameField = form.find('input[name="new-playlist-name"]')
      let name = nameField.value()

      // name can't be empty
      if (name === null || typeof name === 'undefined' || name.trim() === '') {
        return
      }

      // insert the playlist into the database
      // let createdPlaylist = await Bridge.ipcAsk('media-api', {
      //   'fn': 'createPlaylist',
      //   'args': [{
      //     'playlist_name': name,
      //     'plsylisttags': null,
      //     'playlist_track_ids': null
      //   }]
      // })

      // TODO replace with RESTful api
      let apiResponse = await Bridge.httpApi('/media-api', 'POST', {
        'fn': 'createPlaylist',
        'args': [{
          'playlist_name': name,
          'plsylisttags': null,
          'playlist_track_ids': null
        }]
      })

      if (apiResponse.statusRange !== 2) {
        console.error('Something went wrong when creating playlist.', apiResponse)
        return
      }

      __(this).removeClass('no-playlists')

      // insert the new playlist-block
      __(this).find('.playlists').prependHtml(/*html*/`<playlist-block playlistid="${apiResponse.response.id}"></playlist-block>`)

      // reset the form
      nameField.value('')
    })
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
    let list = __(this).find('.playlists')
    
    // since infinite scroll is only enabled when showing ALL playlists, we can assume all are in scope
    for (let playlist of this.Query.results) {
      list.appendHtml(/*html*/`<playlist-block playlistid="${playlist.id}"></playlist-block>`)
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

      // refresh the illusion if showing all playlists
      if (__(this).attr('ids') === '*') {
        this.createLoadedIllusion()
      }
    }, 200)
  }

  /**
   * Whenever a new playlist is added to the database, rerender.
   */
  async onDeletedPlaylist(row) {
    // remove the min-height from the illusion
    __(this).closest('.playlists-outer').removeAttr('style')

    // check if there are still remaining playlists
    let anyPlaylistQuery = await new Query({
      'table': 'music_playlists',
      'itemsPerPage': 1
    })

    if (!anyPlaylistQuery.results.length) {
      __(this).addClass('no-playlists')
    }
  }

  /**
   * This is triggered on the first render of ids=* instances, and it estimates how tall this album-grid
   * will be when fully loaded, and sets the min-height to that to create the illusion of being fully loaded.
   */
  async createLoadedIllusion() {
    let loadedPlaylistBlocks = __(this).find('.playlists playlist-block.loaded')

    if (!loadedPlaylistBlocks.els.length) return

    let examplePlaylistBlock = loadedPlaylistBlocks.getShortest().el()
    let playlistBlockHeight = __(examplePlaylistBlock).height()
    let playlistBlockMarginBottom = parseInt(window.getComputedStyle(examplePlaylistBlock).marginBottom)
    let firstRowHeight = playlistBlockHeight + playlistBlockMarginBottom
    let rowsToSimulate = this.Query.totalResults

    __(this).closest('.playlists-outer').css({'min-height': firstRowHeight * rowsToSimulate})
  }

  /**
   * Builds the queryObj based on the Element attributes.
   */
  buildQueryObj() {
    let idsAttr = __(this).attr('ids')
    let orderByAttr = __(this).attr('orderby')
    let orderAttr = __(this).attr('order')

    // if there is no data-pages-loaded attribute, set to 0
    let currentPage = __(this).attr('data-pages-loaded') || Number(0)
    let queryObj = {}

    // showing all playlists
    if (idsAttr === '*') {
      queryObj.table = 'music_playlists',
      queryObj.page = currentPage + 1
    }
    // showing specific ID's
    else if (Array.isArray(idsAttr)) {
      queryObj.table = 'music_playlists'
      queryObj.itemsPerPage = -1
      queryObj.columns = {
        'id': idsAttr
      }
    }
    
    // we are ordering by a certain column, default to ASC
    if (orderByAttr) {
      queryObj.orderBy = {[orderByAttr]: orderAttr || 'ASC'}
    }

    return queryObj
  }
}