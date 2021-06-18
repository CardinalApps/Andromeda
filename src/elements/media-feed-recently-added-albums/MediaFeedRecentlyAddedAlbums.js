import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

export class MediaFeedRecentlyAddedAlbums extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/media-feed-recently-added-albums/media-feed-recently-added-albums.html')
    
    let blockObj = await this.getBlockObject()

    // if nothing was added recently, hide this block
    if (!blockObj.data.length) {
      __(this).closest('.feed-layout-container').hide()
    }

    __(this).attr('data-signature', blockObj.dataSignature)
    this.injectSlider(blockObj)
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
   * Gets the block object from the main process.
   */
  async getBlockObject() {
    let apiResponse = await Bridge.httpApi('/media-api', 'POST', {
      'fn': 'getFeedBlock',
      'args': ['recently-added-albums']
    })

    return apiResponse.response
  }

  /**
   * Injects an album slider.
   * 
   * @param {object} blockObj - The block object as returned by getBlockObject()
   */
  injectSlider(blockObj) {
    let ids = blockObj.data.map(row => row.track_release_id)

    let slider = Lowrider.elementFactory({
      'name': `album-slider`,
      'bindings': {
        'ids': ids
      }
    })

    __(this).find('.album-slider').html('').appendHtml(slider)
  }

  /**
   * Checks if the block needs to be refreshed, and if so, refreshes it.
   * 
   * @param {boolean} [force] - Force a refresh, Defaults to false.
   */
  async refresh(force = false) {
    let blockObj = await this.getBlockObject()

    if (__(this).attr('data-signature') !== blockObj.dataSignature || force) {
      this.injectSlider(blockObj)
    }
  }
}