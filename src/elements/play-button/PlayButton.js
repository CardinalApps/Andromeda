/**
 * This custom element is a play button that can have the following attributes:
 * 
 * - `trackid` (unique)
 * - `albumid` (unique)
 * - `artistid` (unique)
 * - `ids` (unique) Use an stringified array of track ID's
 * 
 * When clicked, it will begin new playback for the content in the attribute.
 */
import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

export class PlayButton extends Lowrider {
  /**
   * When an instance of this element is created in the DOM.
   */
  async onSpawn() {
    this.boundPlaybackChangeHandler = this.syncWithPlayback.bind(this)
    
    // hook into the playback
    Player.on('stateChange', this.boundPlaybackChangeHandler)
    Player.on('trackChange', this.boundPlaybackChangeHandler)
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/play-button/play-button.html')
  }

  /**
   * After the inner HTML has rendered.
   */
  onLoad() {
    // listen for click
    this.registerEventHandlers()
        
    this.syncWithPlayback()
  }

  /**
   * When the instance is removed from the document.
   */
  onRemoved() {
    Player.off('stateChange', this.boundPlaybackChangeHandler)
    Player.off('trackChange', this.boundPlaybackChangeHandler)
  }

  /**
   * Registers event handlers for this custom element.
   */
  registerEventHandlers() {
    // on click
    this.addEventListener('click', (event) => {
      let buttonState = __(this).attr('state')

      // if the button is currently showing the playing animation, pause the music
      if (buttonState === 'playing') {
        Player.pause()
        return
      }

      // if the button state is currently showing the paused state of the playing 
      // animation, resume the music
      if (buttonState === 'paused') {
        Player.resume()
        return
      }

      // in simple mode, the parent <track-block> will handle starting new playback
      if (__(this).attr('mode') === 'simple') {
        this.closest('track-block').play()
        return
      }

      // if stateless, start new playback
      if (__(this).attr('trackid')) {
        this.playTrack()
      } else if (__(this).attr('albumid')) {
        this.playAlbum()
      } else if (__(this).attr('artistid')) {
        this.playArtist()
      } else if (__(this).attr('playlistid')) {
        this.playPlaylist()
      } else if (__(this).attr('ids')) {
        this.playIds()
      }
    })
  }

  /**
   * Plays the track in the `trackid` attribute.
   */
  playTrack() {
    let trackId = __(this).attr('trackid')

    Player.play([trackId])
  }

  /**
   * Plays the album in the `albumid` attribute.
   */
  async playAlbum() {
    let albumId = __(this).attr('albumid')
    let albumTracksQuery = await new Query({
      'table': 'music_tracks',
      'itemsPerPage': -1,
      'columns': {
        'track_release_id': albumId
      },
      'orderBy': {
        'track_disc': 'ASC',
        'track_num': 'ASC'
      }
    })

    // let ids = albumTracksQuery.results.map(trackRow => trackRow.id)

    // sort by disc
    let discs = {}
    let allTrackIds = []

    for (let trackRow of albumTracksQuery.results) {
      // if there is no disc in the meta, assume disc 1
      let disc = (typeof trackRow.trackdisk === 'object' && 'no' in trackRow.trackdisk && trackRow.trackdisk.no !== null) ? trackRow.trackdisk.no : 1

      if (!(disc in discs)) discs[disc] = [] // init array for the disc

      discs[disc].push(trackRow.id)
    }

    // make one array of all ids from all disks
    for (let [disc, ids] of Object.entries(discs)) {
      ids.forEach(id => allTrackIds.push(id))
    }

    Player.play(allTrackIds)
  }

  /**
   * Plays the artist in the `artistid` attribute. Tracks are ordered by album then track number.
   */
  async playArtist() {
    let artistId = __(this).attr('artistid')
    let artistTracksQuery = await new Query({
      'table': 'music_tracks',
      'itemsPerPage': -1,
      'columns': {
        'track_artist_id': artistId
      },
      'orderBy': {
        'track_date': 'DESC',
        'track_num': 'ASC'
      }
    })

    let ids = artistTracksQuery.results.map(trackRow => trackRow.id)

    Player.play(ids)
  }

  /**
   * Plays the playlist in the `playlist` attribute. Tracks are ordered by album then track number.
   */
  async playPlaylist() {
    let playlistId = __(this).attr('playlistId')
    let playlistQuery = await new Query({
      'table': 'music_playlists',
      'columns': {
        'id': playlistId
      }
    })

    if (!playlistQuery.results.length) throw new Error(`<play-button> could not find playlist with ID ${playlistId} in the database.`)

    let playlist = playlistQuery.results[0]

    // if the playlist exists but has no tracks
    if (!playlist.playlist_track_ids || (Array.isArray(playlist.playlist_track_ids) && !playlist.playlist_track_ids.length)) {
      return
    }

    Player.play(playlist.playlist_track_ids)
  }

  /**
   * Plays the array of ID's in the `ids` attribute.
   */
  playIds() {
    let ids = __(this).attr('ids')

    Player.play(ids)
  }

  /**
   * Sets this buttons state to match the current playback.
   */
  async syncWithPlayback() {
    let isPlaying

    if (Player.state === 'stopped' || Player.state === 'loading') {
      isPlaying = false
    } 
    // if this <play-button> has the `albumid` attr
    else if (__(this).attr('albumid')) {
      let albumId = __(this).attr('albumid')
      
      if (albumId === Player.trackObj.track_release_id) {
        isPlaying = true
      }
    }
    // or if it has a `playlistid` attr... the queue must match the playlist exactly
    else if (__(this).attr('playlistid')) {
      let playlistId = __(this).attr('playlistid')
      let playlistQuery = await new Query({
        'table': 'music_playlists',
        'columns': {
          'id': playlistId
        }
      })

      if (!playlistQuery.results.length) throw new Error('<play-button> could not find the playlist in the database.')

      if (JSON.stringify(playlistQuery.results[0].trackids) === JSON.stringify(Player.queue)) {
        isPlaying = true
      }
    }
    // or if it has a 'trackid' attr
    else if (__(this).attr('trackid')) {
      isPlaying = __(this).attr('trackid') === Player.currentlyPlayingId
    }

    if (isPlaying) {
      __(this).attr('state', Player.state)
    } else {
      __(this).removeAttr('state')
    }
  }
}