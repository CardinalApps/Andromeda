import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

export class MediaFeedRecentlyPlayedAlbums extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    this.boundOnTrackChange = this.onTrackChange.bind(this)
    this.maxAlbumsInSlider = 24

    // listen for changes to the currently playing track
    Player.on('trackChange', this.boundOnTrackChange)
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/media-feed-recently-played-albums/media-feed-recently-played-albums.html')
    
    let blockObj = await this.getBlockObject()

    __(this).attr('data-signature', blockObj.dataSignature)
    this.injectSlider(blockObj)
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
    Player.off('trackChange', this.boundOnTrackChange)
  }

  /**
   * Triggered when the track changes in the global Player object.
   */
  onTrackChange() {
    // allow ipc to resolve
    setTimeout(() => {
      // if the slider has not already inited, perform a full refresh,
      // which will init the slider
      if (__(this).find('album-slider').hasClass('no-content')) {
        this.refresh()
        return
      }

      // if the album already exists in the history, we can just shift it to the
      // front, which simulates what the main process would return and avoids a
      // refresh
      let albumIdsInSlider = __(this).find('album-block').els.map(el => __(el).attr('albumid'))
      let currentlyPlayingAlbum = __(this).find(`album-block[albumid="${Player.trackObj.track_release_id}"]`)
      let sliderEl = __(this).find('album-slider').el()

      if (currentlyPlayingAlbum.els.length) {
        let indexInSlider = albumIdsInSlider.indexOf(Player.trackObj.track_release_id)
        
        // if the album isn't already at the front, shift it there
        if (indexInSlider !== 0) {
          sliderEl.removeSlides(indexInSlider)
          sliderEl.prependSlide(Player.trackObj.track_release_id)
        }
      }
      // the album does not already exist, insert it
      else {
        sliderEl.prependSlide(Player.trackObj.track_release_id)
        this.trimExtraSlides()
      }
    }, 0)
  }

  /**
   * Gets the block object from the main process.
   */
  async getBlockObject() {
    let apiResponse = await Bridge.httpApi('/media-api', 'POST', {
      'fn': 'getFeedBlock',
      'args': ['recently-played-albums']
    })

    return apiResponse.response
  }

  /**
   * Injects an album slider.
   * 
   * @param {object} blockObj - The block object as returned by getBlockObject()
   */
  injectSlider(blockObj) {
    let ids = blockObj.data.map(row => row.id)

    let slider = Lowrider.elementFactory({
      'name': `album-slider`,
      'bindings': {
        'ids': ids,
        'props': {
          'noContentMessage': '<i class="fas fa-scroll"></i>' + i18n('media-feed-block.recently-played-music.no-content')
        }
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

  /**
   * Removes any extra slides from the slider after new ones were manually added.
   */
  async trimExtraSlides() {
    // if the newly injected slides cause us to pass the max amount of albums,
    // trim the end
    let sliderEl = __(this).find('album-slider').el()
    let numSlidesAfterInsertions = __(this).find('album-block').els.length

    if (numSlidesAfterInsertions > this.maxAlbumsInSlider) {
      let indexesToRemove = []

      // get indexes for all slides after the max one
      for (let i = this.maxAlbumsInSlider + 1; i <= numSlidesAfterInsertions; i++ ) {
        indexesToRemove.push(i - 1)
      }

      //console.log('removing slides:', indexesToRemove)

      sliderEl.removeSlides(indexesToRemove)
    }
  }
}