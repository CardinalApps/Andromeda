import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

export class MediaFeedTopTracks extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/media-feed-top-tracks/media-feed-top-tracks.html')
    
    // set title
    this.props.title = 'top tracks'

    this.refresh()
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
   * Registers event listeners for this instance.
   */
  registerEventListeners() {
    
  }

  /**
   * Gets the block objects from the main process.
   */
  async getBlockObjectTopTracks() {
    let apiResponse = await Bridge.httpApi('/media-api', 'POST', {
      'fn': 'getFeedBlock',
      'args': ['top-tracks']
    })

    return apiResponse.response
  }

  /**
   * Injects the top songs.
   * 
   * @param {object} blockObj - The block object as returned by getBlockObjectTopSongs()
   */
  injectTopTracks(blockObj) {
    let ids = blockObj.data.map(row => row.id)

    let slider = Lowrider.elementFactory({
      'name': `track-slider`,
      'attrs': {
        'config': 'media-feed-half-then-full'
      },
      'bindings': {
        'ids': ids
      }
    })

    __(this).find('.top-tracks').html('').appendHtml(slider)
    __(this).attr('data-signature', blockObj.dataSignature)
  }

  /**
   * Checks if the blocks need to be refreshed, and if so, refreshes them.
   * 
   * @param {boolean} [force] - Force a refresh, Defaults to false.
   */
  async refresh(force = false) {
    let topTracksBlockObj = await this.getBlockObjectTopTracks()

    if (__(this).attr('data-signature') !== topTracksBlockObj.dataSignature || force) {
      this.injectTopTracks(topTracksBlockObj)
    }
  }
}