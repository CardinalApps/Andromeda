import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

export class MediaFeedTopAlbums extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/media-feed-top-albums/media-feed-top-albums.html')
    
    // set title
    this.props.title = this.buildTitle()

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
   * Handles building the special Top Picks block.
   */
  buildTitle() {
    // all possoble titles
    let criteriaPools = {
      'overnight': [
        i18n('media-feed-block.top-picks.title.overnight-1'),
        i18n('media-feed-block.top-picks.title.overnight-2'),
        i18n('media-feed-block.top-picks.title.overnight-3'),
        i18n('media-feed-block.top-picks.title.overnight-4'),
        i18n('media-feed-block.top-picks.title.overnight-5'),
      ],
      'morning': [
        i18n('media-feed-block.top-picks.title.morning-1'),
        i18n('media-feed-block.top-picks.title.morning-2'),
        i18n('media-feed-block.top-picks.title.morning-3'),
        i18n('media-feed-block.top-picks.title.morning-4'),
        i18n('media-feed-block.top-picks.title.morning-5'),
      ],
      'afternoon': [
        i18n('media-feed-block.top-picks.title.afternoon-1'),
        i18n('media-feed-block.top-picks.title.afternoon-2'),
        i18n('media-feed-block.top-picks.title.afternoon-3'),
        i18n('media-feed-block.top-picks.title.afternoon-4'),
        i18n('media-feed-block.top-picks.title.afternoon-5'),
      ],
      'evening': [
        i18n('media-feed-block.top-picks.title.evening-1'),
        i18n('media-feed-block.top-picks.title.evening-2'),
        i18n('media-feed-block.top-picks.title.evening-3'),
        i18n('media-feed-block.top-picks.title.evening-4'),
        i18n('media-feed-block.top-picks.title.evening-5'),
      ],
      // 'afternoon,happy': [
      //   i18n('media-feed-block.top-picks.title.afternoon-happy-1'),
      //   i18n('media-feed-block.top-picks.title.evening-2'),
      // ],
    }

     // becomes an object of sentence structure criteria
    let generatedCriteria = []

    // create time of day criteria
    let now = new Date()
    let hours = now.getHours()

    // 11:00pm to 5:59am
    if (hours === 23 || hours === 24 || __().numberIsBetween(hours, 0, 5)) {
      generatedCriteria.push('overnight')
    } 
    // 6:00am to 11:59am
    else if (__().numberIsBetween(hours, 6, 11)) {
      generatedCriteria.push('morning')
    }
    // noon to 4:59pm
    else if (__().numberIsBetween(hours, 12, 16)) {
      generatedCriteria.push('afternoon')
    }
    // 5pm to 10:59pm
    else if (__().numberIsBetween(hours, 17, 22)) {
      generatedCriteria.push('evening')
    }

    // set the mood criteria
    //let moods = ['happy', 'relaxed', 'energized', 'down', 'angry']
    //let moods = ['happy']
    //generatedCriteria.push(__().randomFromArray(moods))

    // find a random title from the criteria pool with the most matching
    // criteria
    let mostMatches = 0
    let randomTitle = i18n('media-feed-block.top-picks.title.default')

    for (let [poolCriteria, criteriaTitles] of Object.entries(criteriaPools)) {
      let intersection = __().getArrayIntersection(generatedCriteria, poolCriteria.split(','))

      if (intersection.length > mostMatches) {
        randomTitle = __().randomFromArray(criteriaTitles)
      }  
    }

    return randomTitle
  }

  /**
   * Gets the block objects from the main process.
   */
  async getBlockObjectTopAlbums() {
    let apiResponse = await Bridge.httpApi('/media-api', 'POST', {
      'fn': 'getFeedBlock',
      'args': ['top-albums']
    })

    return apiResponse.response
  }

  /**
   * Injects the top songs.
   * 
   * @param {object} blockObj - The block object as returned by getBlockObjectTopSongs()
   */
  injectTopAlbums(blockObj) {
    let ids = blockObj.data.map(row => row.id)

    // get 12 random albums from the top 24
    ids = ids.sort(() => Math.random() - 0.5).slice(0, 12)

    let slider = Lowrider.elementFactory({
      'name': `album-slider`,
      'attrs': {
        'class': 'small',
        'config': 'media-feed-half-then-full'
      },
      'bindings': {
        'ids': ids
      }
    })

    __(this).find('.top-albums').html('').appendHtml(slider)
    __(this).attr('data-signature', blockObj.dataSignature)
  }

  /**
   * Checks if the blocks need to be refreshed, and if so, refreshes them.
   * 
   * @param {boolean} [force] - Force a refresh, Defaults to false.
   */
  async refresh(force = false) {
    let blockObjTopAlbums = await this.getBlockObjectTopAlbums()

    if (__(this).attr('data-signature') !== blockObjTopAlbums.dataSignature || force) {
      this.injectTopAlbums(blockObjTopAlbums)
    }
  }
}