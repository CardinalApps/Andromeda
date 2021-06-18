import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

export class MediaFeedArtist extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    this.artistId = __(this).attr('artistid')

    let apiReponse = await Bridge.httpApi('/media-api', 'POST', {
      'fn': 'getArtist',
      'args': [this.artistId]
    })

    this.artist = apiReponse.response
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    let blockObj = await this.getBlockObject()

    console.log(blockObj)

    // if there's somehow no data, hide this block
    if (!blockObj.dataSignature) {
      __(this).closest('.feed-layout-container').hide()
    }

    // save the signature
    __(this).attr('data-signature', blockObj.dataSignature)
    
    // init replacements obj
    let replacements = {...this.artist}

    // background image
    if (this.artist.artist_photo) {
      let imagePath = __().__doubleSlashesOnWindowsOnly(this.artist.artist_photo.full)
      replacements.artistBg = /*html*/`<div class="artist-bg" style="background-image: url('${imagePath}');"></div>`
    } else {
      replacements.artistBg = /*html*/`<div class="gradient-bg"></div>`
    }

    // inject base html
    this.innerHTML = await html('/elements/media-feed-artist/media-feed-artist.html', replacements)

    // add the albums
    this.props.albumsTitle = blockObj.data.albumsTitle

  }

  /**
   * After the inner HTML has rendered.
   */
  async onLoad() {

  }

  /**
   * After this instance is removed.
   */
  async onRemoved() {

  }

  /**
   * Gets the block objects from the main process.
   */
  async getBlockObject() {
    let apiResponse = await Bridge.httpApi('/media-api', 'POST', {
      'fn': 'getFeedBlock',
      'args': ['artist', {'artistId': this.artistId}]
    })

    return apiResponse.response
  }

  /**
   * Checks if the blocks need to be refreshed, and if so, refreshes them.
   * 
   * @param {boolean} [force] - Force a refresh, Defaults to false.
   */
  async refresh(force = false) {
    let blockObj = await this.getBlockObject()

    if (__(this).attr('data-signature') !== blockObj.dataSignature || force) {
      this.render()
    }
  }
}