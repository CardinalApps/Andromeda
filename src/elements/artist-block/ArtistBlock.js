import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

/**
 * The <artist-block> is the custom element used for showing a single artist.
 *
 * Supported attributes:
 *
 * - `artistid`: (unique) An artist ID.
 * - `layout`: Either `bio` or `simple`. Defaults to `simple` when omitted.
 */
export class ArtistBlock extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    this.boundNewAlbumListener = this.onNewAlbum.bind(this)

    this.classList.add('has-context-menu-items')

    // @listens new-album
    // listen to new-album instead of new-artist so that we can rerender when
    // albums 1-4 are added during import
    //Bridge.ipcListen('new-album', this.boundNewAlbumListener)
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    await this.setInternalArtistRow()
    let layout = __(this).attr('layout')

    if (layout === 'bio') {
      await this._renderAsBioLayout()
    } else {
      await this._renderAsSimpleLayout()
    }
  }

  /**
   * After innards have rendered.
   */
  onLoad() {
    // only the thumb layout supports the interacting state
    if (__(this).attr('layout') !== 'bio') {
      this.supportInteractingState({
        'rightClickEls': [this.querySelector('.art')]
      })
    }
  }

  /**
   * When the instance is removed from the document.
   */
  onRemoved() {
    //Bridge.removeListener('new-album', this.boundNewAlbumListener)
  }

  /**
   * Returns all tracks on this album.
   */
  async setInternalArtistRow() {
    let artistId = __(this).attr('artistid')
    let apiReturn = await Bridge.httpApi(`/music-artist/${artistId}`)

    if (apiReturn.statusRange !== 2) {
      throw new Error('<artist-block> did not get API data')
    }

    this.artistObj = apiReturn.response
  }

  /**
   * Context menu items.
   * 
   * @returns {array}
   */
  async getContextMenuItems() {
    let artistId = __(this).attr('artistId')

    if (!('artistRow' in this)) {
      await this.setInternalArtistRow()
    }

    let items = [{
      'group': this.artistObj.artist_name,
      'items': {
        /**
         * Shuffle Artist
         */
        [i18n('artist-block.context-menu.shuffle-artist')]: {
          'cb': async (rightClickedEl, menuItem) => {
            let trackIds = await this.getShuffledArtistTracks()

            Player.play(trackIds)
            ContextMenu.closeAllContextMenus()
          }
        },
        /**
         * Edit Artist
         */
        // [i18n('artist-block.context-menu.edit-artist')]: {
        //   'cb': (rightClickedEl, menuItem) => {
        //     // remove previously showing metadata editor
        //     if (__('#metadata-editor-modal').els.length) {
        //       modal.close('metadata-editor-modal')
        //     }

        //     modal.show(this.closest('music-app'), `<metadata-editor artistid="${artistId}"></metadata-editor>`, {
        //       'id': 'metadata-editor-modal',
        //       'mode': 'floating'
        //     })

        //     ContextMenu.closeAllContextMenus()
        //   }
        // }
      }
    }]

    return items
  }

  /**
   * Renders the simple layout. Invoked by render().
   */
  async _renderAsSimpleLayout() {
    let artistId = __(this).attr('artistid')
    let markup = await html('/elements/artist-block/artist-block-simple.html')

    // if there's no artist photo, use up to 4 album arts as the background
    if (!this.artistObj.artist_photo) {
      let albumArtMarkup = await this.getAlbumArtMarkup()
      let bg = /*html*/`<div class="albums-bg" data-num="${albumArtMarkup.numArts}">${albumArtMarkup.html}</div>`

      this.innerHTML = await html(markup, {
        ...this.artistObj,
        'bg': bg,
        'artClass': albumArtMarkup.numArts ? '' : 'no-art',
        'name': this.artistObj.artist_name,
        'link': `/artist/${artistId}`
      })
    }
    // if there is a photo, use it as the background
    else {
      let photoPath = __().__doubleSlashesOnWindowsOnly(this.artistObj.artist_photo['300'])
      let bg = /*html*/`<div class="photo-bg" style="background-image: url('${photoPath}')"></div>`

      this.innerHTML = await html(markup, {
        ...this.artistObj,
        'bg': bg,
        'artClass': '',
        'name': this.artistObj.artist_name,
        'link': `/artist/${artistId}`
      })
    }
  }

  /**
   * Renders the bio layout. Invoked by render().
   */
  async _renderAsBioLayout() {
    let artistId = __(this).attr('artistid')
    let markup = await __().getFileContents('/elements/artist-block/artist-block-bio.html')
    let artist = this.artistObj
    let replacements = {
      'photoBlock': /*html*/`<div class="artist-photo no-artist-image"></div>`,
      'link': `/artist/${artistId}`,
      ...artist
    }

    // overwrite default photo if one exists
    if (artist.artist_photo) {
      replacements.photoBlock = /*html*/`<div class="artist-photo" style="background-image:url('${artist.artist_photo['150']}')"></div>`
    }

    this.innerHTML = await html(markup, replacements)
  }

  /**
   * Returns an array of all shuffled track ID's from this artist.
   *
   * @param {Element} instance - The artist-block instance. Context menu
   * callbacks are context-less, so this is used for that.
   */
  async getShuffledArtistTracks(instance = this) {
    let artistTracksQuery = await new Query({
      'table': 'music_tracks',
      'columns': {
        'track_artist_id': __(instance).attr('artistid')
      }
    })

    if (!artistTracksQuery.results.length) throw new Error('Could not find tracks in database')

    let ids = artistTracksQuery.results.map(row => row.id)

    return __().shuffle(ids)
  }

  /**
   * Called whenever a new album is added to the database. Checks to see if we
   * should update the album art of this block.
   */
  async onNewAlbum(album) {
    if (album.album_artist_id === __(this).attr('artistid')) {
      let albumArtMarkup = await this.getAlbumArtMarkup()

      __(this).find('.albums-bg').html(albumArtMarkup.html)
      __(this).find('.albums-bg').attr('data-num', albumArtMarkup.numArts)
    }
  }

  /**
   * Generates the HTML for the album art "background" and returns it wrapped in
   * an object that also contains a property "numArts".
   */
  async getAlbumArtMarkup() {
    let returnObj = {
      'html': '',
      'numArts': 0
    }

    if (!this.artistObj.releases.length) {
      return returnObj
    }

    for (let release of this.artistObj.releases) {
      let apiReturn = await Bridge.httpApi(`/music-release/${release.id}`)

      if (apiReturn.statusRange !== 2) continue
      if (returnObj.numArts === 4) break
      const releaseObj = apiReturn.response

      if (releaseObj.artwork) {
        let escapedFilename = __().__doubleSlashesOnWindowsOnly(releaseObj.artwork.thumbs['200'].thumb_file)
        returnObj.html += /*html*/`<div class="album-thumb" style='background-image:url("${escapedFilename}");'></div>`
        returnObj.numArts++
      }
    }

    return returnObj
  }
}