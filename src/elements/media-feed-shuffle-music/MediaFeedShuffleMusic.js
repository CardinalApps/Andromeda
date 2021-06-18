import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

/**
 * If all attributes are omitted, this block defaults to shuffling all music.
 * 
 * Supported attributes:
 * 
 * - `genreid`: (unique): A genre ID to shuffle. Use 'rand' to shuffle a random genre.
 * - `rand`: (unique): `*`, `album` or `artist` to play a random album or
 *   shuffled artist, or shuffled library.
 */
export class MediaFeedShuffleMusic extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    this.lastShuffle = 0
    this.shuffleThrottle = 5000
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/media-feed-shuffle-music/media-feed-shuffle-music.html')
    this.insertIcon()
    this.insertTitle()
  }

  /**
   * After the inner HTML has rendered.
   */
  async onLoad() {
    this.registerEventListeners()
  }

  /**
   * After this instance is removed.
   */
  async onRemoved() {

  }

  /**
   * Registers event listeners for this instance.
   */
  registerEventListeners() {
    let btn = this.querySelector('button')

    btn.addEventListener('mouseenter', () => {
      btn.classList.add('over')
    })

    btn.addEventListener('mouseleave', () => {
      btn.classList.remove('over', 'press')
    })

    btn.addEventListener('mousedown', (event) => {
      if (event.which !== 1) return
      btn.classList.add('press')
      btn.classList.remove('over')
    })

    btn.addEventListener('mouseup', (event) => {
      if (event.which !== 1 || !btn.classList.contains('press')) return
      btn.classList.remove('press')
      this.insertIcon()

      if (Date.now() - this.lastShuffle > this.shuffleThrottle) {
        this.shuffleAndPlay()
      }
    })

    btn.addEventListener('keydown', (event) => {
      if (event.code !== 'Space') return
      btn.classList.add('press')
    })

    btn.addEventListener('keyup', (event) => {
      if (event.code !== 'Space') return
      btn.classList.remove('press')
      this.insertIcon()

      if (Date.now() - this.lastShuffle > this.shuffleThrottle) {
        this.shuffleAndPlay()
      }
    })
  }

  /**
   * Inserts (and overwrites) the button title.
   */
  insertTitle() {
    let genreAttr = __(this).attr('genreid')
    let randAttr = __(this).attr('rand')
    
    if (genreAttr === 'rand') {
      this.props.title = i18n('media-feed.shuffle-music-genre.title')
    } else if (randAttr === 'album') {
      this.props.title = i18n('media-feed.random-album.title')
    } else if (randAttr === 'artist') {
      this.props.title = i18n('media-feed.shuffle-artist.title')
    } else if (randAttr === '*') {
      this.props.title = i18n('media-feed.shuffle-music.title')
    }
  }

  /**
   * Inserts (and overwrites) the buttons icon.
   */
  insertIcon() {
    let genreAttr = __(this).attr('genreid')
    let randAttr = __(this).attr('rand')
    let currentIcon = __(this).attr('current-icon')
    let commonIcons
    let icon

    // random genre icons
    if (genreAttr === 'rand') {
      commonIcons = ['fa-guitar', 'fa-drum', 'fa-sliders-h', 'fa-headphones-alt']
    }
    // random album
    else if (randAttr === 'album') {
      commonIcons = ['fa-compact-disc', 'fa-record-vinyl']
    }
    // random artist
    else if (randAttr === 'artist') {
      commonIcons = ['fa-user-friends', 'fa-users']
    }
    // shuffle all
    else if (randAttr === '*') {
      commonIcons = ['fa-dice', 'fa-dice-two', 'fa-dice-three', 'fa-dice-four', 'fa-dice-five', 'fa-dice-six']
    }

    // remove the current icon so that we can't roll the same one twice in a row
    if (currentIcon) {
      commonIcons.splice(commonIcons.indexOf(currentIcon), 1)
    }

    let rareIcons = ['fa-gamepad', 'fa-cat', 'fa-poop', 'fa-carrot', 'fa-hat-wizard']
    let roll = __().odds({
      'rare': '1/30',
      'common': '29/30'
    })
    
    if (roll === 'common') {
      icon = __().randomFromArray(commonIcons)
    } else if (roll === 'rare') {
      icon = __().randomFromArray(rareIcons)
    }

    __(this).attr('current-icon', icon)
    
    let iconParent = __(this).find('.content')
    let existingIconEl = __(this).find('.icon')
    let iconClass = `icon fas ${icon}`

    if (!existingIconEl.els.length) {
      iconParent.prependHtml(/*html*/`<i class="${iconClass}"></i>`)
    } else {
      existingIconEl.attr('class', iconClass)
    }
  }

  /**
   * Starts a shuffled playlist.
   */
  async shuffleAndPlay() {
    let genreAttr = __(this).attr('genreid')
    let randAttr = __(this).attr('rand')

    if (genreAttr === 'rand') {
      await this._shuffleAndPlayMusicGenre()
    } else if (randAttr === 'album') {
      await this._playRandomAlbum()
    } else if (randAttr === 'artist') {
      await this._shuffleAndPlayArtistTracks()
    } else if (randAttr === '*') {
      await this._shuffleAndPlayAllMusic()
    }

    // animate the throttling
    __(this).addClass('throttled')

    setTimeout(() => {
      __(this).removeClass('throttled')
    }, this.shuffleThrottle)
    
    this.lastShuffle = Date.now()
  }

  /**
   * Helper for `shuffleAndPlay()`.
   */
  async _shuffleAndPlayAllMusic(numTracks = 200) {
    let tracksQuery = await new Query({
      'table': 'music_tracks',
      'itemsPerPage': numTracks,
      'orderBy': 'rand'
    })

    if (!tracksQuery.results.length) {
      throw new Error("The shuffle button shouldn't be showing if there are no tracks.")
    }

    // play the music
    Player.play(tracksQuery.results.map(row => row.id))
  }

  /**
   * Helper for `shuffleAndPlay()`.
   */
  async _playRandomAlbum() {
    let randAlbumQuery = await new Query({
      'table': 'music_releases',
      'itemsPerPage': 1,
      'orderBy': 'rand'
    })

    if (!randAlbumQuery.results.length) {
      throw new Error("The shuffle button shouldn't be showing if there are no albums.")
    }

    let tracksQuery = await new Query({
      'table': 'music_tracks',
      'itemsPerPage': -1,
      'columns': {
        'track_release_id': randAlbumQuery.results[0].id
      },
      'orderBy': 'track_num'
    })

    // play the music
    Player.play(tracksQuery.results.map(row => row.id))
  }

  /**
   * Helper for `shuffleAndPlay()`.
   */
  async _shuffleAndPlayArtistTracks() {
    let randArtistQuery = await new Query({
      'table': 'music_artists',
      'itemsPerPage': 1,
      'orderBy': 'rand'
    })

    if (!randArtistQuery.results.length) {
      throw new Error("The shuffle button shouldn't be showing if there are no artists.")
    }

    let tracksQuery = await new Query({
      'table': 'music_tracks',
      'itemsPerPage': -1,
      'columns': {
        'track_artist_id': randArtistQuery.results[0].id
      },
      'orderBy': 'rand'
    })

    // play the music
    Player.play(tracksQuery.results.map(row => row.id))
  }

  /**
   * Helper for `shuffleAndPlay()`.
   */
  async _shuffleAndPlayMusicGenre() {
    let genreId = __(this).attr('genreid')
    let tracksToPlay = []

    if (!genreId) throw new Error('Genre ID is required')

    // get a random genre
    if (genreId === 'rand') {
      let randGenreQuery = await new Query({
        'table': 'music_genres',
        'itemsPerPage': 1,
        'orderBy': 'rand'
      })

      if (randGenreQuery.results.length) {
        genreId = randGenreQuery.results[0].id
      } 
      // if no genres, silently fall back to random songs.
      // "do you not have genres?"
      else {
        let randTracksQuery = await new Query({
          'table': 'music_tracks',
          'itemsPerPage': 200,
          'orderBy': 'rand'
        })

        Player.play(randTracksQuery.results.map(row => row.id))
        return
      }
    }

    // get random songs from the genre
    let randTracksQuery = await new Query({
      'table': 'music_track_meta',
      'columns': {
        'meta_key': 'genre',
        'meta_value': genreId
      },
      'itemsPerPage': 200,
      'orderBy': 'rand'
    })

    tracksToPlay = randTracksQuery.results.map(row => row.meta_object_id)

    // play the music
    Player.play(tracksToPlay)
  }
}