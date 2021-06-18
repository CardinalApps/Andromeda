import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

export class MediaFeedAlbumsWithFavorites extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    this.boundOnFavoriteChange = this.onFavoriteChange.bind(this)

    // @listens option-change
    Bridge.wsListen('announcements:favorite-added', this.boundOnFavoriteChange)
    Bridge.wsListen('announcements:favorite-removed', this.boundOnFavoriteChange)
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/media-feed-albums-with-favorites/media-feed-albums-with-favorites.html')
  }

  /**
   * After the inner HTML has rendered.
   */
  async onLoad() {
    this.refresh()
  }

  /**
   * After this instance is removed.
   */
  async onRemoved() {
    Bridge.removeWsListener('announcements:favorite-added', this.boundOnOptionChange)
    Bridge.removeWsListener('announcements:favorite-removed', this.boundOnOptionChange)
  }

  /**
   * When a change occurs in the database options table, check if it was a
   * change to the users favorite tracks, and if so, refresh.
   */
  onFavoriteChange(changeEvent) {
    this.refresh()
  }

  /**
   * Gets the block object from the main process.
   */
  async getBlockObject() {
    let apiResponse = await Bridge.httpApi('/media-api', 'POST', {
      'fn': 'getFeedBlock',
      'args': ['albums-with-favorites']
    })

    return apiResponse.response
  }

  /**
   * Injects an album slider.
   * 
   * @param {object} blockObj - The block object as returned by getBlockObject()
   */
  injectSlider(blockObj) {
    let ids = blockObj.data

    let slider = Lowrider.elementFactory({
      'name': `album-slider`,
      'bindings': {
        'ids': ids,
        'props': {
          'noContentMessage': '<i class="fas fa-scroll"></i>' + i18n('media-feed-block.albums-with-favorites.no-content')
        }
      }
    })

    __(this).attr('data-signature', blockObj.dataSignature)
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