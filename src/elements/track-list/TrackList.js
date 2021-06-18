import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'
import { registerDragNDropListeners } from '../../dragndrop.js'

/**
 * The <track-list> is designed to be the parent of a group of <track-block>'s, however
 * <track-block>'s are designed to be used outside of <track-list>'s.
 * 
 * The track-list supports showing a generic list of tracks but also handles showing favorites.
 * 
 * - `ids` (unique): An array of track ID's to show.
 * - `mode` (unique): Set to `favorites` to automatically show all favorite tracks.
 * - `albumid` (unique): Use an album ID to show all tracks from an album in order.
 * - `playlistid' (unique): Use a playlist ID to show all tracks in that playlist.
 * - `titlei18nkey`: Set this to a i18n key to render the translation as the title. This has a higher priority than `titlestring`.
 * - `titlestring`: Set this to a string and the grid will render it as the title.
 */
export class TrackList extends Lowrider {
  /**
   * Define a custom render checker.
   */
  // async shouldBuild() {
  //   let playlistIdAttr = __(this).attr('playlistid')
  //   let cachedTrackEls = __(this).find('track-block')

  //   if (!cachedTrackEls.els.length) return true

  //   let alreadyShowingIds = cachedTrackEls.els.map(el => __(el).attr('trackid'))

  //   // when showing a playlist
  //   if (playlistIdAttr) {
  //     let dbTracks = await this.getPlaylistTracks() || []

  //     // if the playlist was updated in another part of the app, rerender
  //     if (alreadyShowingIds.join(',') !== dbTracks.join(',')) {
  //       return true
  //     }
  //   }

  //   return false
  // }

  async shouldBuild() {
    if (this.isFavoritesList) {
      return true
    } else if (this.isPlaylistList) {
      let idsByDisc = await this.getPlaylistTracks()
      return idsByDisc.join(',') !== __(this).attr('data-signature')
    } else {
      return this.firstElementChild === null
    }
  }

  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    this.isFavoritesList = __(this).attr('mode') === 'favorites'
    this.isPlaylistList = __(this).attr('playlistid')

    // listen for favorites change if this is the favorites list
    if (this.isFavoritesList) {
      this.boundOnFavoriteChange = this.onFavoriteChange.bind(this)

      // @listens option-change
      Bridge.wsListen('announcements:favorite-added', this.boundOnFavoriteChange)
      Bridge.wsListen('announcements:favorite-removed', this.boundOnFavoriteChange)
    }
    
    // watch attributes
    this.watchAttr(['ids', 'mode', 'playlistid'], (changes) => {
      this.render()
    })
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    let idsAttr = __(this).attr('ids')
    let albumIdAttr = __(this).attr('albumid')
    let playlistIdAttr = __(this).attr('playlistid')
    let idsByDisc

    if (idsAttr) {
      idsByDisc = idsAttr
    } else if (albumIdAttr) {
      idsByDisc = await this.getAlbumTracks()
    } else if (playlistIdAttr) {
      idsByDisc = await this.getPlaylistTracks()
      __(this).attr('data-signature', idsByDisc.join(','))
    } else if (this.isFavoritesList) {
      idsByDisc = await this.getFavorites()
    }

    // if idsToRender is an array, wrap them in an object as if they're from CD #1
    if (Array.isArray(idsByDisc)) {
      idsByDisc = {1: idsByDisc}
    }
    
    if (!idsByDisc || !Object.keys(idsByDisc).length || !idsByDisc[1].length) {
      this.innerHTML = await html('/elements/track-list/track-list.html')
      __(this).addClass('no-tracks')
      return
    }

    __(this).removeClass('no-tracks')
    
    // different modes require different markup
    if (idsAttr) {
      await this._renderAsSimpleTrackList(idsByDisc)
    } else if (albumIdAttr) {
      await this._renderAsAlbumTrackList(idsByDisc)
    } else if (playlistIdAttr) {
      await this._renderAsPlaylistTrackList(idsByDisc)
      this.renderPlaylistStats()
    } else if (this.isFavoritesList) {
      await this._renderAsFavoritesTrackList(idsByDisc)
    }
  }

  /**
   * After the inner HTML has rendered.
   */
  onLoad() {
    // register event listeners on each track list item
    __(this).find('.track-list-item').each((el) => {
      this.registerTrackListItemEventListeners(el)
    })
  }

  /**
   * When a change occurs in the database options table, check if it was a
   * change to the users favorite tracks, and if so, refresh.
   */
  onFavoriteChange(changeEvent) {
    this.build()
  }

  /**
   * When the instance is removed from the docuement.
   */
  onRemoved() {
    Bridge.removeWsListener('announcements:favorite-added', this.boundOnFavoriteChange)
    Bridge.removeWsListener('announcements:favorite-removed', this.boundOnFavoriteChange)
  }

  /**
   * Registers event listeners for this instance.
   */
  registerTrackListItemEventListeners(el) {
    //console.log('registering drag n drops')
    // if this is a list of playlist tracks, enable drag n drop on each song
    if (__(this).attr('playlistid')) {
      registerDragNDropListeners({
        'dragEl': el,
        'dragoverEl': el,
        'dropEl': el,
        'onDrop': (event, newEl) => {
          this.registerTrackListItemEventListeners(newEl)
          this.updateTrackNumsInPlaylist()
          this.updatePlaylistInDatabase()
        }
      })
    }
  }

  /**
   * Rerender whenever the favorite tracks change.
   */
  onFavoriteChange(event) {
    this.render()
  }

  /**
   * Pulls favorites from the db and puts the appropiate ID's into the id attr.
   */
  async getFavorites() {
    let artistId = __(this).attr('artistid')
    let favoritesReq = await Bridge.httpApi('/favorites/music-track')

    if (favoritesReq.statusRange !== 2) {
      console.warn('Could not load favorites')
      return []
    }

    // no favs
    if (!favoritesReq.response.length) {
      return []
    }

    // filter down to this artists favorites
    let favoritesQuery = await new Query({
      'table': 'music_tracks',
      'columns': [
        {
          'track_artist_id': artistId,
        },
        {
          'id': favoritesReq.response.map(row => row.favorite_thing_id),
          'equalityOperator': 'IN'
        }
      ]
    })

    if (!favoritesQuery.results.length) {
      return []
    }

    let songIdsByArtist = favoritesQuery.results.map(trackRow => trackRow.id)

    return songIdsByArtist
    //return favoritesReq.response.filter(id => songIdsByArtist.includes(id))
  }

  /**
   * Gets all tracks on an album and sorts them by disc and by track number.
   */
  async getAlbumTracks() {
    // get all tracks on the album
    let trackListQuery = await new Query({
      'table': 'music_tracks',
      'itemsPerPage': -1,
      'columns': {
        'track_release_id': __(this).attr('albumid')
      },
      'orderBy': {
        'track_num': 'ASC'
      }
    })
  
    if (!trackListQuery.results.length) throw new Error('This album somehow has no tracks')
      
    // sort by disc
    let discs = {}

    for (let trackRow of trackListQuery.results) {
      // fall back to disc 1
      let disc = 1

      if (trackRow.track_disc) {
        disc = trackRow.track_disc
      }

      // maybe init array for the disc
      if (!(disc in discs)) discs[disc] = []

      discs[disc].push(trackRow.id)
    }

    return discs
  } 

  /**
   * Gets the playlist track ID's from the database.
   */
  async getPlaylistTracks() {
    let playlistId = __(this).attr('playlistid')
    let playlistQuery = await new Query({
      'table': 'music_playlists',
      'columns': {
        'id': playlistId,
      }
    })

    if (!playlistQuery.results.length) {
      return []
    }

    return playlistQuery.results[0].playlist_track_ids
  }

  /**
   * The list title can be set by setting the attribute `titlei18nkey`. If omitted, a title may
   * be set automatically by the `mode`. Renders nothing if no title could be determined.
   */
  renderTitle() {
    // remove old title
    __(this).find('.title-row').remove()
    
    let titleStr = null
    
    // title is set manually
    if (__(this).attr('titlei18nkey')) {
      titleStr = i18n(__(this).attr('titlei18nkey'))
    }
    
    // title for favorites mode
    if (__(this).attr('mode') === 'favorites') {
      titleStr = i18n('view.artist.favorite-tracks.title')
    }
    
    if (titleStr) {
      __(this).prependHtml(/*html*/`<div class="title-row"><h3 class="title">${titleStr}</h3></div>`)
    }
  }

  /**
   * Splits the track list by disc.
   */
  async _renderAsSimpleTrackList(idsByDisc) {
    this.innerHTML = await html('/elements/track-list/track-list.html')
    this.renderTitle()
    
    for (let [disc, ids] of Object.entries(idsByDisc)) {
      for (let id of ids) {
        __(this).find(`.tracks`).appendHtml(/*html*/`
          <track-block trackid="${id}" mode="expanded" playbutton="permanent"></track-block>
        `)
      }
    }
  }

  /**
   * Splits the track list by disc.
   */
  async _renderAsAlbumTrackList(idsByDisc) {
    this.innerHTML = await html('/elements/track-list/track-list.html')
    this.renderTitle()
    
    __(this).attr('discs', Object.keys(idsByDisc).length)

    for (let [disc, ids] of Object.entries(idsByDisc)) {
      __(this).find('.tracks').appendHtml(/*html*/`<div class="disc disc-${disc}"><h3 class="disc-title">${i18n('disc')} ${disc}</h3></div>`)

      for (let id of ids) {
        __(this).find(`.tracks .disc-${disc}`).appendHtml(/*html*/`
          <track-block trackid="${id}" mode="expanded"></track-block>
        `)
      }
    }
  }

  /**
   * Renders the favorites list. This rendering method will pay special
   * attention to preexisting track-blocks, and not needlessly rerender when
   * favorite items already exist. This smooths out the rendering when removing
   * items from the list of favorites.
   */
  async _renderAsFavoritesTrackList() {
    let favorites = await this.getFavorites()
    let preexistingTrackBlocks = __(this).find('track-block')

    // first render
    if (!preexistingTrackBlocks.els.length) {
      this.innerHTML = await html('/elements/track-list/track-list.html')
      this.renderTitle()
    }

    //let preeistingTrackIds = preexistingTrackBlocks.map(el => __(el).attr(id))
    let allIds = []

    // insert all new ID's and don't neeedlessly rerender
    for (let id of favorites) {
      let preexistingChildBlock = __(this).find(`track-block[trackid="${id}"]`)
      let trackBlockHtml = /*html*/`<track-block trackid="${id}" mode="expanded" playbutton="permanent"></track-block>`
      let prevId = favorites.indexOf(id) === 0 ? null : favorites[favorites.indexOf(id) - 1]

      // track block was not prerendered, we must insert it
      if (!preexistingChildBlock.els.length) {
        // is it the very first block?
        if (prevId === null) {
          __(this).find('.tracks').appendHtml(trackBlockHtml)
        } 
        // or should it be inserted after an existing block?
        else {
          __(this).find(`track-block[trackid="${prevId}"]`).after(trackBlockHtml)
        }
      }

      allIds.push(id)
    }

    // check for favorites that need to be removed
    preexistingTrackBlocks.each((el) => {
      if (!allIds.includes(__(el).attr('trackid'))) {
        __(el).remove()
      }
    })
  }

  /**
   * Renders the track list with the proper markup for drag n dropping.
   */
  async _renderAsPlaylistTrackList(idsByDisc) {
    this.innerHTML = await html('/elements/track-list/track-list.html')
    this.renderTitle()
    
    for (let [disc, ids] of Object.entries(idsByDisc)) {
      for (let id of ids) {
        __(this).find(`.tracks`).appendHtml(/*html*/`
          <div class="track-list-item" draggable="true">
            <track-block trackid="${id}" mode="expanded" lazy-render></track-block>
          </div>
        `)
      }
    }

    this.updateTrackNumsInPlaylist()
  }

  /**
   * This is called after rendering a playlist track list, and after dragging n dropping within a playlist
   * to set the number of each track.
   */
  updateTrackNumsInPlaylist() {
    let num = 1

    __(this).find('track-block').each((el) => {
      __(el).attr('num', num)
      num++
    })
  }

  /**
   * Updates the database with the current playlist order. Called after a drag n drop.
   */
  async updatePlaylistInDatabase() {
    let ids = []

    __(this).find('track-block').each((el) => {
      ids.push(__(el).attr('trackid'))
    })

    let updateReq = await Bridge.httpApi('/db-api', 'POST', {
      'fn': 'update',
      'args': [
        'music_playlists',
        __(this).attr('playlistid'),
        {'playlist_track_ids': ids}
      ]
    })

    if (updateReq.statusRange !== 2) {
      console.warn('Error updating playlist')
    }

    __(this).attr('data-signature', ids.join(','))
  }

  /**
   * Renders the statistics about a playlist
   */
  async renderPlaylistStats() {
    let ids = []
    let trackBlocks = __(this).find('track-block')

    if (!trackBlocks.els.length) {
      return
    }

    trackBlocks.each((el) => {
      ids.push(__(el).attr('trackid'))
    })

    let tracksInPlaylistQuery = await new Query({
      'table': 'music_tracks',
      'itemsPerPage': -1,
      'columns': {
        'id': ids,
        'equalityOperator': 'IN'
      }
    })

    if (!tracksInPlaylistQuery.results.length) throw new Error('<track-list> could not find playlist tracks in the database.')

    let numTracks = tracksInPlaylistQuery.results.length
    let durationInSeconds = 0

    for (let trackRow of tracksInPlaylistQuery.results) {
      durationInSeconds += trackRow.track_duration
    }

    let songStr = numTracks === 1 ? i18n('track-table.playlist-stats.tracks-singular') : i18n('track-table.playlist-stats.tracks')

    // update old stats if they exist
    if (__(this).find('.playlist-stats').els.length) {
      __(this).find('.playlist-stats .num-tracks').html(songStr.replace('{{n}}', numTracks))
      __(this).find('.playlist-stats .duration').html(__().convertSecondsToHHMMSS(durationInSeconds))
    } else {
      // add new stats
      __('.title-row').appendHtml(/*html*/`
        <div class="playlist-stats pill-bar">
          <div class="inner">
            <span class="num-tracks">${songStr.replace('{{n}}', numTracks)}</span>
            <span class="duration">${__().convertSecondsToHHMMSS(durationInSeconds)}</span>
          </div>
        </div>
      `)
    }
  }
}