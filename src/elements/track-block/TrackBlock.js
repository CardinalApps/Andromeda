import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

/**
 * The track-block is the standard block for showing a single track. It has two modes, the first
 * being the default simple mode, and the second being the opt-in `expanded` mode, which is used when 
 * multiple track-block's are grouped together, like when showing all the songs on an album.
 * 
 * When used in expanded mode, adjacent track blocks in the DOM will detect eachother automatically, and
 * pressing play in any one of them will also add the following track blocks to the queue.
 * 
 * Supported attributes:
 * - `trackid`
 * - `mode` - There are two modes, 'simple' and 'expanded'. Defaults to 'simple' when the attribute
 * is omitted.
 */
export class TrackBlock extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn () {
    this.boundTrackChangeSubscriber = this.onTrackChange.bind(this)

    // cannot use "class" attr here, will cause infinite loop
    this.watchAttr(['trackid', 'mode'], async (changes) => {
      this.render()
      this.setPlayingStatus()
    })
    this.watchAttr(['num'], async (changes) => {
      let num = __(this).attr('num')
      __(this).find('.track-num').html(num)
    })

    let trackid = __(this).attr('trackid')

    this.trackId = trackid
    this.trackObj = null
    this.releaseObj = null
    this.artistObj = null

    this.favoriteClass = 'is-favorite'
    
    if (!trackid) {
      throw new Error('Cannot render <track-block> without trackid attribute')
    }

    Player.on('trackChange', this.boundTrackChangeSubscriber)
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    __(this).addClass('loading')

    if (__(this).attr('mode') === undefined || __(this).attr('mode') === 'simple') {
      await this._renderAsSimpleBlock()
    } else if (__(this).attr('mode') === 'expanded') {
      await this._renderAsExpandedBlock()
    }

    __(this).removeClass('loading')
  }

  /**
   * After the inner HTML has rendered.
   */
  async onLoad() {
    // need to load properties when using cache
    if (!this.trackObj) {
      await this._setInternalObjects()
    }

    this.refreshFavoriteStatus()

    this.classList.add('has-context-menu-items')

    this.registerEventListeners()
    this.setPlayingStatus()

    // always set playcount incase it was updated while block was cached
    await this.setPlayCount()

    this.supportInteractingState()
  }

  /**
   * When an instance is destroyed.
   */
  onRemoved() {
    Player.off('trackChange', this.boundTrackChangeSubscriber)
  }

  /**
   * Context menu items.
   * 
   * @returns {array}
   */
  getContextMenuItems() {
    let trackId = __(this).attr('trackid')

    let items = [{
      'group': this.trackObj.track_title,
      'items': {
        /**
         * Play Track
         */
        [i18n('track-block.context-menu.play-track')]: {
          'cb': (rightClickedEl, menuItem) => {
            Player.play(trackId)
            ContextMenu.closeAllContextMenus()
          }
        },
        /**
         * Play Track Next
         */
        [i18n('track-block.context-menu.play-next')]: {
          'cb': (rightClickedEl, menuItem) => {
            if (Player.state === 'stopped') {
              Player.add(trackId, 0)
            } else {
              Player.add(trackId, Player.currentQueueItemIndex)
            }
            ContextMenu.closeAllContextMenus()
          }
        },
        /**
         * Add Track to Queue
         */
        [i18n('track-block.context-menu.add-to-queue')]: {
          'cb': (rightClickedEl, menuItem) => {
            Player.add(trackId)
            ContextMenu.closeAllContextMenus()
          }
        },
        /**
         * Add Track to Playlist
         */
        [i18n('track-block.context-menu.add-to-playlist')]: {
          'class': 'dropdown-item',
          'cb': async (rightClickedEl, menuItem) => {
            ContextMenu.renderSpecialItem('addToPlaylist', {
              'el': menuItem,
              'idsToAdd': [trackId]
            })
          }
        },
        /**
         * Edit Track
         */
        // [i18n('track-block.context-menu.edit-track')]: {
        //   'cb': (rightClickedEl, menuItem) => {
        //     // remove previously showing metadata editor
        //     if (__('#metadata-editor-modal').els.length) {
        //       modal.close('metadata-editor-modal')
        //     }

        //     modal.show(this.closest('music-app'), `<metadata-editor trackid="${trackId}"></metadata-editor>`, {
        //       'id': 'metadata-editor-modal',
        //       'mode': 'floating'
        //     })

        //     ContextMenu.closeAllContextMenus()
        //   }
        // }
      }
    }]

    // if this track block is part of a playlist, add the "remove from playlist" item
    if (__(this).closest('track-list[playlistid]').els.length) {
      items[0].items[i18n('track-block.context-menu.remove-from-playlist')] = {
        'attrs': {'data-hover': 'danger'},
        'cb': async (rightClickedEl, menuItem) => {
          let trackId = __(this).attr('trackid')
          let playlistId = __(this).closest('track-list[playlistid]').attr('playlistid')
    
          // get the playlist
          let playlistQuery = await new Query({
            'table': 'music_playlists',
            'columns': {
              'id': playlistId
            }
          })
    
          if (!playlistQuery.results.length) throw new Error(`Could not find playlist with ID ${playlistId} in the database.`)
    
          // remove the track from the playlist
          let trackIds = playlistQuery.results[0].playlist_track_ids
          let indexToRemove = playlistQuery.results[0].playlist_track_ids.indexOf(trackId)
          trackIds.splice(indexToRemove, 1)
          
          let success = await Bridge.httpApi('/db-api', 'POST', {
            'fn': 'update',
            'args': [
              'music_playlists',
              playlistId,
              {'playlist_track_ids': trackIds}
            ]
          })
    
          if (success) {
            let parentTrackList = __(this).closest('track-list')
    
            ContextMenu.closeAllContextMenus()
            await __(this).animate('fadeOut')
            __(this).closest('.track-list-item').remove()
            //parentTrackList.el().showEmptyMessageIfNoChildTrackBlocks()
            parentTrackList.el().updateTrackNumsInPlaylist()
            parentTrackList.el().renderPlaylistStats()
          } else {
            throw new Error('Error updating database with new playlist tracks')
          }
        }
      }
    }

    return items
  }

  /**
   * Renders the simple block layout.
   */
  _renderAsSimpleBlock() {
    return new Promise(async (resolve, reject) => {
      
      this.innerHTML = await html('/elements/track-block/track-block-simple.html')
      
      await this._setInternalObjects()

      // TODO track down this bug then erase the next 4 lines
      if (this.releaseObj === null) {
        console.warn('Why is this sometimes (rarely) null?')
        console.log(this)
      } else 
      
      // add album art
      if (this.releaseObj.artwork !== null) {
        __(this).find('.art').attr('style', `background-image:url('${__().__doubleSlashesOnWindowsOnly(this.releaseObj.artwork.thumbs[75].thumb_file)}');`)
      } else {
        __(this).find('.art').addClass('no-art')
      }

      // add album art link
      __(this).find('.art a').attr('href', `/music-release/${this.releaseObj.id}`)

      // add track meta
      this.props.trackName = this.trackObj.track_title
      this.props.artistName = this.artistObj.artist_name
      this.props.duration = __().convertSecondsToHHMMSS(this.trackObj.track_duration)
      __(this).find('.meta .artist a').attr('href', `/artist/${this.artistObj.id}`)

      resolve()

    })
  }

  /**
   * Renders the expanded block layout.
   */
  _renderAsExpandedBlock() {
    return new Promise(async (resolve, reject) => {

      this.refreshFavoriteStatus()

      await this._setInternalObjects()
    
      this.innerHTML = await html('/elements/track-block/track-block-expanded.html', this.trackObj)

      // add play button
      __(this).find('.play-col').appendHtml(/*html*/`<play-button trackid="${this.trackObj.id}" mode="simple"></play-button>`)
      
      // the track number can be overwritten by the 'num' attribute
      let numAttr = __(this).attr('num')

      if (numAttr) {
        __(this).find('.play-col .track-num').html(numAttr)
      } else {
        __(this).find('.play-col .track-num').html(this.trackObj.track_num)
      }

      // add track name
      __(this).find('.track-name').appendHtml(/*html*/`<span title="${this.trackObj.track_title}">${this.trackObj.track_title}</span>`)

      // add album name
      __(this).find('.album-name').appendHtml(/*html*/`
        <a href="/music-release/${this.releaseObj.id}" class="router-link" title="${this.releaseObj.release_title}">
          <span tabindex="-1">${this.releaseObj.release_title}</span>
        </a>
      `)

      // add artist with link
      __(this).find('.artist-name').appendHtml(/*html*/`
        <a href="/artist/${this.artistObj.id}" class="router-link" title="${this.artistObj.artist_name}">
          <span tabindex="-1">${this.artistObj.artist_name}</span>
        </a>
      `)

      // add duration
      __(this).find('.duration').html(__().convertSecondsToHHMMSS(this.trackObj.track_duration))

      // add source
      if (this.trackObj.track_source === 'local') {
        __(this).find('.source-col').html(/*html*/`<i class="fas fa-hdd" title="${i18n('source-icon.local.title')}"></i>`)
      }

      resolve()

    })
  }

  /**
   * Registers event listeners for this Element instance.
   */
  registerEventListeners() {
    if (__(this).attr('mode') === 'expanded') {
      this._registerEventListenersForExpandedBlock()
    }
  }

  /**
   * Registers event listeners for the expanded block version.
   */
  _registerEventListenersForExpandedBlock() {
    /**
     * Prevent double clicks of certain children from starting new playback.
     */
    this.querySelector('button.toggle-favorite').addEventListener('dblclick', (event) => { event.stopPropagation() })
    this.querySelector('play-button').addEventListener('dblclick', (event) => { event.stopPropagation() })

    /**
     * On click of the favorite star.
     */
    this.querySelector('button.toggle-favorite').addEventListener('click', async (event) => {
      // event must be a left click
      if (event.which !== 1) return

      // this track is already a favorite, remove it
      if (await this.isFavorite()) {
        await this.removeTrackFromFavorites()
      }
      // it's not already a favorite, add it
      else {
        await this.addTrackToFavorites()
      }
    })

    /**
     * On double click of the block.
     */
    this.addEventListener('dblclick', (event) => {
      this.play()
    })
  }

  /**
   * Triggered when the track changes.
   */
  onTrackChange() {
    this.setPlayingStatus()
    
    // maybe increment the play count
    if (__(this).attr('trackid') === Player.currentlyPlayingId) {
      this.props.playCount = parseInt(this.props.playCount) + 1
    }
  }

  /**
   * Check if this block is that track, and if so, add a class.
   */
  setPlayingStatus() {
    if (__(this).attr('trackid') === Player.currentlyPlayingId) {
      __(this).addClass('is-playing')
    } else {
      __(this).removeClass('is-playing')
    }
  }

  /**
   * Updates the state of this block to match the state of the favorites in the
   * database.
   */
  async refreshFavoriteStatus() {
    if (await this.isFavorite()) {
      __(this).addClass(this.favoriteClass)
    } else {
      __(this).removeClass(this.favoriteClass)
    }
  }

  /**
   * Checks whether this track is in the favorites
   */
  async isFavorite() {
    let favorites = await this.getFavorites()

    // empty favorites array in the db
    if (!favorites.length) {
      return false
    }

    let trackId = __(this).attr('trackid')
    let favIds = favorites.map(row => row.favorite_thing_id)

    if (favIds.includes(trackId)) {
      return true
    }
  }

  /**
   * Queries the database for the current favorite genres.
   * 
   * @returns {array} An array of track ids, maybe empty.
   */
  async getFavorites() {
    let favoritesRequest = await Bridge.httpApi('/favorites/music-track')

    // if the http request failed, returning an empty array lets things work as
    // if the user never added favorites
    if (favoritesRequest.statusRange !== 2) {
      console.warn('Could not load favorites from server')
      return []
    }

    // server may have returned an empty array
    return favoritesRequest.response
  }

  /**
   * Adds this track to the favorites.
   */
  async addTrackToFavorites() {
    let trackId = this.getAttribute('trackid')
    let addedRequest = await Bridge.httpApi('/favorites', 'POST', {
      'favorite_thing_id': trackId,
      'favorite_thing_type': 'music-track',
      'favorite_date_added': Date.now()
    })

    if (addedRequest.statusRange !== 2) {
      console.error('Error adding favorite')
      return
    }

    // update ALL track-blocks with this ID in the DOM
    __(`track-block[trackid="${trackId}"]`).addClass(this.favoriteClass)
  }

  /**
   * Removes this tracks from the favorites.
   */
  async removeTrackFromFavorites() {
    let trackId = this.getAttribute('trackid')
    let deletedRequest = await Bridge.httpApi(`/favorites/music-track/${trackId}`, 'DELETE')

    if (deletedRequest.statusRange !== 2) {
      console.error('Error removing favorite')
      return
    }

    __(`track-block[trackid="${trackId}"]`).removeClass(this.favoriteClass)
  }

  /**
   * Plays the track. Will check for adjacent <track-block>'s to add to the queue as well.
   */
  play() {
    let queue = []
    queue.push(__(this).attr('trackid'))

    // if there are track blocks directly adjacent to this one, add them to the queue
    let nextTracksInGroup = __(this).siblings('next', 'track-block')

    // if there are no directly adjacent track blocks, look up a level for the .track-list-item (used in playlists for drag n drop)
    if (!nextTracksInGroup.els.length) {
      let parentTrackListItem = __(this).closest('.track-list-item')

      if (parentTrackListItem.els.length) {
        nextTracksInGroup = parentTrackListItem.siblings('next', '.track-list-item').find('track-block')
      }
    }

    // we have found siblings, add them to the queue
    if (nextTracksInGroup.els.length) {
      nextTracksInGroup.each((siblingEl) => {
        queue.push(__(siblingEl).attr('trackid'))
      })
    }

    Player.play(queue)
  }

  /**
   * Loads data from the database.
   */
  async _setInternalObjects() {
    // get the track object
    let trackApi = await Bridge.httpApi(`/music-track/${this.trackId}`)
    if (trackApi.statusRange !== 2) throw new Error(`Error getting track ${this.trackId} from API`)

    this.trackObj = trackApi.response

    // get the release object
    let releaseApi = await Bridge.httpApi(`/music-release/${this.trackObj.track_release_id}`)
    if (releaseApi.statusRange !== 2) throw new Error(`Error getting release ${this.trackObj.track_release_id} from API`)

    this.releaseObj = releaseApi.response

    // get the artist object
    let artistApi = await Bridge.httpApi(`/music-artist/${this.trackObj.track_artist_id}`)
    if (artistApi.statusRange !== 2) console.error(`Error getting artist ${this.trackObj.track_release_id} from API`)

    this.artistObj = artistApi.response
  }

  /**
   * Sets the play count for this track
   */
  async setPlayCount() {
    let trackId = __(this).attr('trackid')

    let historyQuery = await new Query({
      'table': 'music_history',
      'itemsPerPage': -1,
      'columns': {
        'music_history_track_id': trackId
      }
    })

    this.props.playCount = historyQuery.totalResults
  }
}