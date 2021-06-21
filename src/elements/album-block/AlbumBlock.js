import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

/**
 * The `<album-block>` is used to display a single album. The album-block allows the user to interact
 * with an album using a context-menu that is invoked with a right click, or with a dot-menu. Since some actions
 * within the context-menu allow the user to interact with all of the album's tracks, this block is required
 * to query the database for the track list. This is optimized by deferring this query until the user interacts 
 * with the block. Interacting is defined as right clicking it, left clicking the dot menu, or tabbing into it.
 * 
 * This block features two layouts: the compact `thumb` layout (used on the Albums view and many other places),
 * and the `full` layout (used on the Album view). The `full` layout performs additional expensive operations.
 *
 * Supported attributes:
 * 
 * - `albumid`: (unique) An album ID.
 */
export class AlbumBlock extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    this.classList.add('has-context-menu-items')
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    let mergeTags = await this.makeMergeTags()

    this.innerHTML = await html('/elements/album-block/album-block.html', mergeTags)

    if (mergeTags.art) {
      this.classList.add('has-art', 'loaded')
    } else {
      this.querySelector('.art').classList.add('no-art')
    }
  }

  /**
   * After inner HTML has rendered.
   */
  onLoad() {
    this.supportInteractingState({
      'rightClickEls': [this.querySelector('.art')]
    })
  }

  /**
   * Context menu items.
   * 
   * @returns {array}
   */
  async getContextMenuItems() {
    // when loaded from the cache, the album row won't exist on right-click
    if (!this.albumObj) {
      this.albumObj = await this.getAlbumObj()
    }

    let items = [{
      'group': this.albumObj.release_title,
      'items': {
        /**
         * Play Album
         */
        [i18n('album-block.context-menu.play-album')]: {
          'cb': async (rightClickedEl, menuItem) => {
            let trackIds = await this.getAlbumTracks()

            Player.play(trackIds)
            ContextMenu.closeAllContextMenus()
          }
        },
        /**
         * Play Album Next
         */
        [i18n('album-block.context-menu.play-next')]: {
          'cb': async (rightClickedEl, menuItem) => {
            let trackIds = await this.getAlbumTracks()

            if (Player.state === 'stopped') {
              Player.add(trackIds, 0)
            } else {
              Player.add(trackIds, Player.currentQueueItemIndex)
            }

            ContextMenu.closeAllContextMenus()
          }
        },
        /**
         * Add Album to Queue
         */
        [i18n('album-block.context-menu.add-to-queue')]: {
          'cb': async (rightClickedEl, menuItem) => {
            let trackIds = await this.getAlbumTracks()

            Player.add(trackIds)
            ContextMenu.closeAllContextMenus()
          }
        },
        /**
         * Add Album to Playlist
         */
        [i18n('album-block.context-menu.add-to-playlist')]: {
          'class': 'dropdown-item',
          'cb': async (rightClickedEl, menuItem) => {
            let trackIds = await this.getAlbumTracks()
            
            ContextMenu.renderSpecialItem('addToPlaylist', {
              'el': menuItem,
              'idsToAdd': trackIds
            })
          }
        },
        /**
         * Edit Album
         */
        // [i18n('album-block.context-menu.edit-album')]: {
        //   'cb': async (rightClickedEl, menuItem) => {
        //     let albumId = __(this).attr('albumid')

        //     // remove previously showing metadata editor
        //     if (__('#metadata-editor-modal').els.length) {
        //       modal.close('metadata-editor-modal')
        //     }

        //     modal.show(this.closest('music-app'), `<metadata-editor albumid="${albumId}"></metadata-editor>`, {
        //       'id': 'metadata-editor-modal',
        //       'mode': 'floating'
        //     })

        //     ContextMenu.closeAllContextMenus()
        //   }
        // },
      }
    }]

    return items
  }

  /**
   * Returns an array of all the track ID's on this album in order.
   * 
   * @param {Element} instance - The album-block instance. Context menu callbacks are context-less, so this
   * is used for that.
   */
  async getAlbumTracks(instance = this) {
    let albumTracksQuery = await new Query({
      'table': 'music_tracks',
      'columns': {
        'track_release_id': __(instance).attr('albumid')
      },
      'orderBy': {
        'track_num': 'ASC'
      }
    })

    if (!albumTracksQuery.results.length) throw new Error('Could not find tracks in database')

    // sort by disc
    let discs = {}
    let allTrackIds = []

    for (let trackRow of albumTracksQuery.results) {
      // if there is no disc in the meta, assume disc 1
      let disc = (typeof trackRow.track_disc === 'object' && 'no' in trackRow.track_disc && trackRow.track_disc.no !== null) ? trackRow.track_disc.no : 1

      if (!(disc in discs)) discs[disc] = [] // init array for the disc

      discs[disc].push(trackRow.id)
    }

    // make one array of all ids from all disks
    for (let [disc, ids] of Object.entries(discs)) {
      ids.forEach(id => allTrackIds.push(id))
    }

    return allTrackIds
  }

  /**
   * Gets all tracks on this album, in order.
   * 
   * @returns {array} Returns an array of track rows.
   */
  async getTrackList() {
    let albumId = __(this).attr('albumid')
    let trackListQuery = await new Query({
      'table': 'music_tracks',
      'itemsPerPage': -1,
      'columns': {
        'track_release_id': albumId
      },
      'orderBy': {
        'track_num': 'ASC'
      }
    })

    if (!trackListQuery.results.length) throw new Error('This album somehow has no tracks')
    
    // TODO need to reimplement genres with the http api

    return trackListQuery.results
  }

  /**
   * Makes the merge tags for the template. Always generates all the tags for the `full` layout, so that
   * the same vars can be added to the `thumb` layout without needing to add new merge tags here.
   */
  makeMergeTags() {
    return new Promise(async (resolve, reject) => {

      if (!this.albumObj) {
        this.albumObj = await this.getAlbumObj()
      }

      let layout = __(this).attr('layout') || 'thumb'
      let albumId = __(this).attr('albumid')
      let mergeTags = {
        ...this.albumObj,
        'art': '',
        'link': `/music-release/${albumId}`,
        'date': this.albumObj.release_year || '',
        'artist': this.albumObj.meta.artist,
        'artistLink': `/artist/${this.albumObj.release_primary_artist_id}`
      }
      
      // has artwork
      if (this.albumObj.artwork) {
        let thumbPath = this.albumObj.artwork.thumbs['200'].thumb_file

        // detect when the background image has loaded by loading it in an invisible <img> (browser cache should not load it twice)
        let src = __().__doubleSlashesOnWindowsOnly(thumbPath)
        let tempImg = document.createElement('img')
        tempImg.src = src
        tempImg.addEventListener('load', () => {
          tempImg.remove()
          mergeTags.art = `style="background-image:url('${src}')"`

          resolve(mergeTags)
        })
      }
      // no artwork
      else {
        resolve(mergeTags)
      }

    })
  }

  /**
   * Queries the database for the album row.
   * 
   * @returns {object}
   */
  async getAlbumObj() {
    let albumId = __(this).attr('albumid')
    let apiReturn = await Bridge.httpApi(`/music-release/${albumId}`)

    if (apiReturn.statusRange !== 2) {
      throw new Error('<album-block> did not get API data')
    }
        
    return apiReturn.response
  }
}