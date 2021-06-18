import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

/**
 * Supported attributes:
 * 
 * - `albumid`: (unique) An album ID.
 */
export class ReleaseMetadata extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {

  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    let mergeTags = await this.makeMergeTags()
    this.innerHTML = await html('/elements/release-metadata/release-metadata.html', mergeTags)

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
      'join': {
        'table': 'file_index',
        'on': {
          'track_file_id': 'id'
        }
      },
      'columns': {
        'track_release_id': albumId
      },
      'orderBy': {
        'track_num': 'ASC'
      }
    })

    if (!trackListQuery.results.length) throw new Error('This album somehow has no tracks')
    
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

      let mergeTags = {
        ...this.albumObj,
        'art': '',
        'title': this.albumObj.release_title,
        'date': this.albumObj.release_year || '',
        'artist': this.albumObj.meta.artist,
        'artistLink': `/artist/${this.albumObj.release_primary_artist_id}`
      }

      this.trackList = await this.getTrackList()
      let fileTypes = this.getFileTypes()

      mergeTags.fileTypes = fileTypes.join(' ').toUpperCase()
      mergeTags.typeLabel = fileTypes.length === 1 ? i18n('release-metadata.file-type') : i18n('release-metadata.file-types')
      mergeTags.averageBitrate = this.getAverageBitrate()
      mergeTags.duration = this.getDuration()
      mergeTags.genres = this.getGenres()
      
      // has artwork
      if (this.albumObj.artwork) {
        let thumbPath = this.albumObj.artwork.thumbs['400'].thumb_file

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
   * Calculates the average bitrate for this album and returns it as a string with either "kbps" 
   * or "bps" at the end.
   * 
   * @returns {(string|null)} Either the average bitrate or null if it could not be calculated.
   */
  getAverageBitrate() {
    if (!this.trackList) throw new Error('<release-metadata> is missing internal track list')

    let allBitrates = []

    for (let trackRow of this.trackList) {
      if (trackRow.track_bitrate) {
        allBitrates.push(Number(trackRow.track_bitrate))
      }
    }

    if (!allBitrates.length) {
      return null
    }

    let sum = allBitrates.reduce((accum, current) => { return accum + current })
    let average = sum / allBitrates.length

    // format to kpbs
    average = Math.round((average / 1000).toString()) + '<sub>kbps</sub>'

    return average
  }

  /**
   * Returns an array of all the filetypes that can be found on this album.
   * 
   * @returns {array}
   */
  getFileTypes() {
    if (!this.trackList) throw new Error('<release-metadata> is missing internal track list')

    let allFileTypes = new Set()
  
    for (let trackRow of this.trackList) {
      if (trackRow.file_extension) {
        allFileTypes.add(trackRow.file_extension)
      }
    }
  
    if (!allFileTypes.size) {
      return []
    }
  
    return Array.from(allFileTypes)
  }

  /**
   * Calculates the total duration of an album.
   */
  getDuration() {
    if (!this.trackList) throw new Error('<release-metadata> is missing internal track list')

    let albumSeconds = 0

    for (let trackRow of this.trackList) {
      albumSeconds = albumSeconds + Math.round(trackRow.track_duration) 
    }

    return __().convertSecondsToHHMMSS(albumSeconds)
  }

  /**
   * Finds all of the genres that the tracks belong to.
   * 
   * @returns {string} HTML for the genre-tags.
   */
  getGenres() {
    if (!this.trackList) throw new Error('<release-metadata> is missing internal track list')

    let allGenres = new Set()

    for (let trackRow of this.trackList) {
      if (Array.isArray(trackRow.track_genre_ids)) {
        for (let genreId of trackRow.track_genre_ids) {
          allGenres.add(genreId)
        }
      }
    }

    allGenres = Array.from(allGenres)

    if (!allGenres.length) {
      return ''
    }

    let markup = ''

    for (let genreId of allGenres) {
      markup += /*html*/`<genre-tag genreid="${genreId}"></genre-tag>`
    }

    return markup
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
      throw new Error('<release-metadata> did not get API data')
    }
        
    return apiReturn.response
  }
}