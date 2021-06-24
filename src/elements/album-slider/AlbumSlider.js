import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'
import Swiper from '../../_external/swiper/swiper-bundle.esm.browser.js'

export class AlbumSlider extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/album-slider/album-slider.html')
    let idsAttr = __(this).attr('ids')
    let ids

    if (idsAttr) {
      ids = idsAttr
    } else if (this.ids) {
      __(this).attr('ids', this.ids) // cache the dynamic ids
      ids = this.ids
    }
    
    if (!ids) {
      throw new Error('Album slider requires album IDs')
    }

    if (!ids.length) {
      this.props.noContentMessage = i18n('no-content')
      __(this).addClass('no-content')
      return
    }

    ids.forEach((id) => {
      __(this).find('.swiper-wrapper').appendHtml(this.getSlideHtml(id))
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
        'slidesPerView': 3,
        'slidesPerGroup': 2,
        'spaceBetween': 15,
        'roundLengths': true,
        'touchStartPreventDefault': false,
        'breakpoints': {
          800: {
            'slidesPerView': 3,
            'slidesPerGroup': 2
          },
          950: {
            'slidesPerView': 3,
            'slidesPerGroup': 2
          },
          1100: {
            'slidesPerView': this.closest('#app').hasAttribute('touch') ? 3 : 5,
            'slidesPerGroup': 3
          },
          1200: {
            'slidesPerView': 2,
            'slidesPerGroup': 2
          },
          1280: {
            'slidesPerView': 3,
            'slidesPerGroup': 2
          },
          1620: {
            'slidesPerView': 4,
            'slidesPerGroup': 2
          },
          1920: {
            'slidesPerView': 5,
            'slidesPerGroup': 2
          },
          2100: {
            'slidesPerView': 6,
            'slidesPerGroup': 3
          }
        }
      }
    } else {
      /**
       * Default config
       */
      config = {
        'slidesPerView': 3,
        'slidesPerGroup': 1,
        'spaceBetween': 15,
        'roundLengths': true,
        'touchStartPreventDefault': false,
        'breakpoints': {
          600: {
            'slidesPerView': 3,
            'slidesPerGroup': 2
          },
          800: {
            'slidesPerView': 3,
            'slidesPerGroup': 2
          },
          1000: {
            'slidesPerView': this.closest('#app').hasAttribute('touch') ? 6 : 5,
            'slidesPerGroup': 3
          },
          1200: {
            'slidesPerView': 5,
            'slidesPerGroup': 3
          },
          1400: {
            'slidesPerView': 6,
            'slidesPerGroup': 3
          },
          1600: {
            'slidesPerView': 7,
            'slidesPerGroup': 4
          },
          1800: {
            'slidesPerView': 8,
            'slidesPerGroup': 5
          },
          2000: {
            'slidesPerView': 9,
            'slidesPerGroup': 6
          }
        }
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
   * Registers event handlers for this instance.
   */
  registerEventHandlers() {
    let prevThrottler = __().throttler(() => {
      if (this.slider.animating) return
      this.slider.slidePrev()
    }, 100)

    let nextThrottler = __().throttler(() => {
      if (this.slider.animating) return
      this.slider.slideNext()
    }, 100)

    this.querySelector('.slider-prev').addEventListener('click', prevThrottler)
    this.querySelector('.slider-next').addEventListener('click', nextThrottler)
  }

  /**
   * Returns the HTML for a single Swiper slide.
   */
  getSlideHtml(albumId) {
    return /*html*/`
    <div class="swiper-slide">
      <album-block albumid="${albumId}"></album-block>
    </div>`
  }

  /**
   * Add a slide to the beginning of the slider.
   */
  prependSlide(id) {
    this.slider.prependSlide(this.getSlideHtml(id))
  }

  /**
   * Removes the last slide from the slider.
   * 
   * @param {(number|array)} index - Slide index.
   */
  removeSlides(index) {
    this.slider.removeSlide(index)
  }
}