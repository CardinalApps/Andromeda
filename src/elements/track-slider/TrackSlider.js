import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'
import Swiper from '../../_external/swiper/swiper-bundle.esm.browser.js'

export class TrackSlider extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/track-slider/track-slider.html')
    let idsAttr = __(this).attr('ids')
    let ids

    if (idsAttr) {
      ids = idsAttr
    } else if (this.ids) {
      __(this).attr('ids', this.ids) // cache the dynamic ids
      ids = this.ids
    }
    
    if (!ids) {
      throw new Error('Track slider requires track IDs')
    }
        
    if (!ids.length) {
      this.props.noContentMessage = i18n('no-content')
      __(this).addClass('no-content')
      return
    }

    // split into groups of 3
    let chunks = __().chunk(ids, 3)

    chunks.forEach((chunk) => {
      __(this).find('.swiper-wrapper').appendHtml(/*html*/`<div class="swiper-slide"></div>`)

      chunk.forEach((id) => {
        __(this).find('.swiper-wrapper .swiper-slide:last-of-type').appendHtml(/*html*/`
          <track-block trackid="${id}" mode="expanded" playbutton="permanent"></track-block>
        `)
      })
    })

    __(this).attr('num-items', ids.length)
  }

  /**
   * After the inner HTML has rendered.
   */
  async onLoad() {
    let config

    if (__(this).attr('config') === 'media-feed-half-then-full') {
      /**
       * For sliders that are the top block in the media feed
       */
      config = {
        'slidesPerView': 1,
        'slidesPerGroup': 1,
        'spaceBetween': 20,
        'roundLengths': true,
        'touchStartPreventDefault': false,
      }
    } else {
      /**
       * Default config
       * TODO remove if no bigger slider is ever made
       */
      config = {
        'slidesPerView': 1,
        'slidesPerGroup': 1,
        'spaceBetween': 20,
        'roundLengths': true,
        'touchStartPreventDefault': false,
      }
    }

    this.slider = new Swiper(this.querySelector('.swiper-container'), config)

    this.registerEventHandlers()

    this.watchAttr(['ids'], () => {
      this.render()
    })
  }

  /**
   * After this instance is removed.
   */
  async onRemoved() {

  }

  /**
   * Only build if we have fresh data from the feed. Else, assume we have cache.
   */
  shouldBuild() {
    if (this.ids) {
      return true
    } else {
      return false
    }
  }

  /**
   * Registers event handlers for this instance.
   */
  registerEventHandlers() {
    let prevThrottler = __().throttler(() => {
      if (this.slider.animating) return
      this.slider.slidePrev()
    }, 100)

    let nextThrottlerr = __().throttler(() => {
      if (this.slider.animating) return
      this.slider.slideNext()
    }, 100)

    this.querySelector('.slider-prev').addEventListener('click', prevThrottler)
    this.querySelector('.slider-next').addEventListener('click', nextThrottlerr)
  }
}