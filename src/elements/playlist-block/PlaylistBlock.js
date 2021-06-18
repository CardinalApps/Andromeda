import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'
import * as modal from '../../modal.js'

export class PlaylistBlock extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    let playlistId = __(this).attr('playlistid')
    if (!playlistId) throw new Error('<playlist-block> requires a playlistid attribute.')
    
    this.classList.add('has-context-menu-items')

    this.playlistQuery = await new Query({
      'table': 'music_playlists',
      'columns': {
        'id': playlistId
      }
    })
    if (!this.playlistQuery.results.length) throw new Error('<playlist-block> could not find a playlist with that ID in the database.')

    this.playlist = this.playlistQuery.results[0]

    this.shouldBuild = () => {
      let previouslyRenderedWithIds = JSON.stringify(__(this).attr('trackids'))
      let dbIds = JSON.stringify(this.playlist.playlist_track_ids)

      return previouslyRenderedWithIds !== dbIds
    }
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    let markup = await html('/elements/playlist-block/playlist-block.html')
    let trackCount = Array.isArray(this.playlist.playlist_track_ids) ? this.playlist.playlist_track_ids.length : 0
    let trackSuffix = trackCount === 1 ? i18n('playlist-block.track-count.suffix-singular') : i18n('playlist-block.track-count.suffix')

    this.innerHTML = await html(markup, {
      ...this.playlist,
      'numTracks': `${trackCount} ${trackSuffix}`,
      'link': `/playlist/${__(this).attr('playlistid')}`
    })

    // if there's tracks, render a list of albums
    if (trackCount) {
      // insert loading svg
      __(this).find('.albums-in-playlist').appendHtml(await __().getFileContents('/images/loading.svg'))

      // no tracks
      if (!trackCount) {
        __(this).addClass('loaded')
        __(this).attr('trackids', '[]')
        return
      }

      // get all tracks
      let allTracksQuery = await new Query({
        'table': 'music_tracks',
        'columns': {
          'id': this.playlist.playlist_track_ids,
          'equalityOperator': 'IN'
        }
      })
      if (!allTracksQuery.results.length) throw new Error('<playlist-block> could not find tracks for this playlist in the database.')

      // create an array of non duplicate album ids of the tracks in this playlist
      let albumIds = Array.from(new Set(allTracksQuery.results.map(trackRow => trackRow.track_release_id)))
      let artEl = __(this).find('.albums-in-playlist').el()

      for (let album of albumIds) {
        let albumReq = await Bridge.httpApi(`/music-release/${album}`)

        if (albumReq.statusRange !== 2) {
          console.warn('<playlist-block> did not get album from API')
          continue
        }

        let albumObj = albumReq.response

        if ('artwork' in albumObj) {
          let artwork = __().__doubleSlashesOnWindowsOnly(albumObj.artwork.thumbs[75].thumb_file)
          __(artEl).appendHtml(/*html*/`<div class="artwork" title="${albumObj.release_title} - ${albumObj.meta.artist}" style="background-image:url('${artwork}')"></div>`)
        }
      }

      let artworkToShow = __(this).find('.artwork')

      if (artworkToShow.els.length) {
        artworkToShow.els = artworkToShow.els.reverse()
        let delay = 0

        artworkToShow.each((el) => {
          setTimeout(() => {
            __(el).addClass('show')
          }, delay)

          delay += 50
        })
      }
    }

    __(this).find('svg.loading').animate('fadeOut').then((__Obj) => {
      __Obj.remove()
    })

    __(this).addClass('loaded')
    __(this).attr('trackids', this.playlist.trackids)
  }

  /**
   * After the HTML has rendered
   */
  onLoad() {
    //__(this).find('.artwork').addClass('show')
    this.supportInteractingState()
  }

  /**
   * Context menu items.
   * 
   * @returns {array}
   */
  async getContextMenuItems() {
    let items = [{
      'group': this.playlist.playlist_name,
      'items': {
        /**
         * Play Playlist
         */
        [i18n('playlist-block.context-menu.play')]: {
          'cb': async (rightClickedEl, menuItem) => {
            let trackIds = this.playlist.playlist_track_ids

            if (!trackIds) return
            if (Array.isArray && !trackIds.length) return

            Player.play(trackIds)
            ContextMenu.closeAllContextMenus()
          }
        },
        /**
         * Play Playlist Next
         */
        [i18n('playlist-block.context-menu.play-next')]: {
          'cb': async (rightClickedEl, menuItem) => {
            let trackIds = this.playlist.playlist_track_ids

            if (!trackIds) return
            if (Array.isArray && !trackIds.length) return

            Player.add(trackIds, Player.currentQueueItemIndex + 1)
            ContextMenu.closeAllContextMenus()
          }
        },
        /**
         * Add Playlist to Queue
         */
        [i18n('playlist-block.context-menu.add-to-queue')]: {
          'cb': async (rightClickedEl, menuItem) => {
            let trackIds = this.playlist.playlist_track_ids

            if (!trackIds) return
            if (Array.isArray && !trackIds.length) return
            
            Player.add(trackIds)
            ContextMenu.closeAllContextMenus()
          }
        },
        /**
         * Edit Playlist
         */
        // [i18n('playlist-block.context-menu.edit-playlist')]: {
        //   'cb': async (rightClickedEl, menuItem) => {
        //     let playlistId = __(this).attr('playlistid')

        //     // remove previously showing metadata editor
        //     if (__('#metadata-editor-modal').els.length) {
        //       modal.close('metadata-editor-modal')
        //     }

        //     modal.show(this.closest('music-app'), `<metadata-editor playlistid="${playlistId}"></metadata-editor>`, {
        //       'id': 'metadata-editor-modal',
        //       'mode': 'floating'
        //     })

        //     ContextMenu.closeAllContextMenus()
        //   }
        // },
        /**
         * Delete Playlist
         */
        [i18n('playlist-block.context-menu.delete-playlist')]: {
          'attrs': {'data-hover': 'danger'},
          'cb': async (rightClickedEl, menuItem) => {
            let playlistId = __(this).attr('playlistid')
            if (!playlistId) throw new Error('Delete callback cannot find playlist ID')

            if (confirm(i18n('danger-confirm'))) {
              let apiReturn = await Bridge.httpApi('/media-api', 'POST', {
                'fn': 'deletePlaylist',
                'args': [playlistId]
              })

              if (apiReturn.statusRange !== 2) {
                console.error('Something went wrong when deleting playlist.', apiReturn)
                return
              }

              Router.deleteViewCache()
              __(this).remove()
            }

            ContextMenu.closeAllContextMenus()
          }
        }
      }
    }]

    return items
  }

  /**
   * Creates the items in this instances <dot-menu>.
   */
  setDotMenuItems() {
    // when "Settings" in the main dot menu is clicked
    dotMenu.addMenuItem('deletePlaylist', deletePlaylistMenuItem, async (dotMenuEl) => {
      
    })
  }
}