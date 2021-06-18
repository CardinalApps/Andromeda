import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'
import { registerDragNDropListeners } from '../../dragndrop.js'

export class PlaybackQueue extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    // callbacks for when the global Player state changes. reflect the new state here
    Player.on('stateChange', (newState) => {
      //console.log('playback-queue state change')
      // only rebuild the queue when the music is stopped
      if (newState === 'stopped') {
        this.buildQueue()
      }
    })

    // when the currently playing track changes
    Player.on('trackChange', (newState) => {
      //console.log('playback-queue track change')
      if (this._needToRebuildQueueItems()) {
        this.buildQueue()
      }
      
      this.setQueueItemClasses()
      this.setQueueItemCountAndDuration()
    })

    // when a playback control changes (shuffle, repeat, etc)
    Player.on('controlChange', () => {
      //console.log('playback-queue control change')
      this._onPlayerControlChange()
    })

    // when the items in the queue change (but playback doesn't necessarily change)
    Player.on('queueChange', () => {
      //console.log('playback-queue queue change')
      this.buildQueue()
    })
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/playback-queue/playback-queue.html')
  }

  /**
   * After the inner HTML has rendered.
   */
  async onLoad() {
    this.registerEventHandlers()
    
    // music may already be playing (lang change)
    this.buildQueue()
  }

  /**
   * Goes over each item in the queue and adjusts their classes depending on the current playback state.
   */
  setQueueItemContextMenuItems() {
    __(this).find('.queue li').each((li) => {
      // define a custom method for the menu item callback
      li.getContextMenuItems = () => {
        return [{
          'group': i18n('queue.context-menu.group-name'),
          'items': {
            /**
             * Shuffle Artist
             */
            [i18n('queue.context-menu.remove-from-queue')]: {
              'cb': async (rightClickedEl, menuItem) => {
                let queueEl = rightClickedEl.matches('playback-queue .queue li') ? rightClickedEl : rightClickedEl.closest('playback-queue .queue li')
                let queueItemIndex = __(queueEl).attr('data-index')
                
                Player.remove(queueItemIndex)
                ContextMenu.closeAllContextMenus()
              }
            }
          }
        }]
      }

      li.classList.add('has-context-menu-items')
    })
  }

  /**
   * Registers the listeners for the icons within the queue. This only fires once when the <playback-queue> is created.
   */
  registerEventHandlers() {
    // on CLICK or SPACEBAR of the clear button
    __(this).find('button.clear').on('click', () => {
      Player.clearQueue()
    })
  }

  /**
   * Registers the listeners for each queue item. This fires every time the queue items are built (rendered).
   * 
   * @param {Element} el - The <li> node.
   */
  registerQueueItemEventHandlers(el) {
    // register drag n drop listeners
    registerDragNDropListeners({
      'dragEl': el,
      'dragoverEl': el,
      'dropEl': el,
      'dragImage': el.querySelector('track-block'),
      'onDrag': (event) => {
        // prevent drag and drop when the player is in shuffle mode, because it would allow the user to
        // drag and drop items into the previously played items, which is a non obvious action
        if (Player.shuffle) {
          event.preventDefault()
          return false
        }
      },
      'onDrop': (event, newEl) => {
        let dropped = __(newEl)

        // reset the state of the injected queue item
        dropped.removeClass('current-item', 'previous-item', 'upcoming-item')

        // get the directly preceeding queue item of the element that was just dropped and injected
        let preceedingQueueItem = dropped.before()

        // if the preceeding element has the .upcoming-item class or the .current-item class, then the
        // injected item is an .upcoming-item.
        // note: this is superficial now, but I'm leaving it because there is no visible performance 
        // difference, and it makes it obvious where support for drag-and-drop while shuffling should 
        // be added
        if (preceedingQueueItem.hasClass('upcoming-item') || preceedingQueueItem.hasClass('current-item')) {
          dropped.addClass('upcoming-item')
        }

        this.registerQueueItemEventHandlers(dropped.el()) // add the event handlers for the newly injected queue item
        this.syncPlayerOrderWithQueueOrder() // sync the global Player queue with the new order of the <playback-queue>
        this.setQueueItemIndexes()
      }
    })

    // on DOUBLE CLICK of a queue item
    el.addEventListener('dblclick', (event) => {
      // must be double click with lmb
      if (event.which !== 1) return

      let trackId = __(el).find('track-block').attr('trackid')
      Player.playItemInQueue(Player.queue.indexOf(trackId))
    })
  }

  /**
   * Updates the global Player queue order to match the order in the <playback-queue>. This is called
   * after a drag and drop.
   */
  syncPlayerOrderWithQueueOrder() {
    let queueTrackIds = []

    __(this).find('.queue li').each((li) => {
      queueTrackIds.push(__(li).find('track-block').attr('trackid'))
    })

    Player.silentlyUpdateQueue(queueTrackIds)
  }

  /**
   * Loops all queue items and gives them an index.
   */
  setQueueItemIndexes() {
    let index = 0

    __(this).find('.queue li').each((el) => {
      __(el).attr('data-index', index)
      index++
    })
  }

  /**
   * Calculates the total duration of an array of track ID's.
   * 
   * @param {array} tracks - An array of track ID's.
   * @returns {number}
   */
  async getTracksDuration(tracks) {
    let seconds = 0
    let query = await new Query({
      'table': 'music_tracks',
      'itemsPerPage': -1,
      'columns': {
        'id': tracks
      },
      'equalityOperator': 'IN'
    })

    if (!query.results.length) throw new Error('<playback-queue> could not find tracks in database.')

    for (let track of query.results) {
      seconds = track.track_duration + seconds
    }

    return seconds
  }

  /**
   * Returns the duration of only the upcoming songs in seconds. The queue must already be built for this to work.
   * 
   * @returns {number}
   */
  async getUpcomingTracksDuration() {
    // get the upcoming songs
    let upcomingTrackIds = []

    __(this).find('.upcoming-item track-block').each((el) => {
      upcomingTrackIds.push(__(el).attr('trackid'))
    })

    // the queue will be empty when only 1 track is playing
    if (!upcomingTrackIds.length) {
      return 0
    }

    return await this.getTracksDuration(upcomingTrackIds)
  }

  /**
   * Triggered when a player control changes (shuffle, repeat).
   */
  _onPlayerControlChange() {
    this._maybeSetShuffleMode()
    this.setQueueItemCountAndDuration()
  }

  /**
   * When the user enables shuffling, change the queue mode to shuffle mode, which shows previous
   * songs in the queue (since they are included in the shuffle).
   */
  _maybeSetShuffleMode() {
    if (Player.shuffle) {
      __(this).addClass('shuffling')
      this.scrollToCurrentTrack()
    } else {
      __(this).removeClass('shuffling')
    }
  }

  /**
   * Determines if what is showing in the queue is already representitive of what's in the Player.queue
   */
  _needToRebuildQueueItems() {
    let needToRerender = false
    let queueItems = __(this).find('.queue li track-block')

    // if there are no queue items, the global player queue should also be empty
    if (!queueItems.els.length && Player.queue.length !== 0) {
      return true
    }

    // check each queue item against the Player item at the same index, if the items are
    // not all equivalent, the queue must be rerendered
    queueItems.each((el, index) => {
      let playerTrackId = Player.queue[index]
      let queueTrackId = __(el).attr('trackid')

      if (playerTrackId !== queueTrackId) {
        needToRerender = true
      }
    })

    return needToRerender
  }

  /**
   * Centers the current track in the queue (only works when shuffling).
   */
  scrollToCurrentTrack() {
    let currentItemEl = this.querySelector('li.current-item')

    if (!currentItemEl) return

    let currentItemX = currentItemEl.offsetTop
    let queueHeight = this.querySelector('.queue').offsetHeight

    // plus 20 more pixels to account for track block height
    let scrollToY = currentItemX - (queueHeight / 2) + 40

    if (scrollToY < 0) {
      scrollToY = 0
    }

    this.querySelector('.queue').scrollTo(0, scrollToY)
  }

  /**
   * Goes over each item in the queue and adjusts their classes depending on the current playback state.
   */
  setQueueItemClasses() {
    // reset the state
    __(this).find('li').removeClass('previous-item', 'current-item', 'upcoming-item')

    // if the player is stopped, then all items are upcoming items
    if (Player.state === 'stopped') {
      __(this).find('.queue li').addClass('upcoming-item')
      return
    }

    // we need the know the current item first, but...
    // we can't use the currently playing track ID to determine the currently playing queue item
    // because the queue can have duplicate tracks (same track ID).
    // so, use the currently playing item index to locate the true current queue item
    __(this).find(`.queue li:nth-of-type(${Player.currentQueueItemIndex + 1})`).addClass('current-item')

    let hitCurrentItem = false

    // now loop all the queue items. everything is a "previous item" until we hit the current item, after which
    // everything is an "upcoming item"
    __(this).find('.queue li').each((li) => {
      let queueItem = __(li)

      if (queueItem.hasClass('current-item')) {
        hitCurrentItem = true
        return
      }

      if (!hitCurrentItem) {
        queueItem.addClass('previous-item')
      } else if (hitCurrentItem) {
        queueItem.addClass('upcoming-item')
      }
    })

    if (Player.shuffle) {
      this.scrollToCurrentTrack()
    }
  }

  /**
   * Determines what to show as the queue item count and renders it.
   */
  async setQueueItemCountAndDuration() {
    let __numTracks = __(this).find('.num-tracks')
    let __queueDuration = __(this).find('.queue-duration')
    let numUpcomingTracks = __(this).find('.upcoming-item').els.length
    let numTracksString = ''
    
    // NOT shuffling and NOT repeating = normal playback: show the number of upcoming tracks and the upcoming duration
    if (!Player.shuffle && !Player.repeat) {
      let upcomingDuration = await this.getUpcomingTracksDuration()

      // pluralization
      if (numUpcomingTracks === 1) {
        numTracksString = i18n('queue.num-in-queue-singular')
      } else {
        numTracksString = i18n('queue.num-in-queue')
      }

      __numTracks.html(numTracksString.replace('{{n}}', numUpcomingTracks))
      __queueDuration.html(__().convertSecondsToHHMMSS(upcomingDuration))
      __queueDuration.removeClass('hidden')
    }
    // when shuffling, show the number of songs in the entire queue and hide the duration
    else if (Player.shuffle) {
      // pluralization
      if (Player.queue.length === 1) {
        numTracksString = i18n('queue.num-in-queue-singular')
      } else {
        numTracksString = i18n('queue.num-in-queue')
      }

      __numTracks.html(numTracksString.replace('{{n}}', Player.queue.length))
      __queueDuration.addClass('hidden')
    }
  }

  /**
   * Builds the inner HTML based on what's in the global Player queue.
   */
  buildQueue() {
    // the queue will be empty on app init and when playback is stopped
    if (!Player.queue.length) {
      __(this).addClass('empty')
      __(this).find('.queue').html('')
      return
    }
    
    let tracks = Player.queue

    __(this).removeClass('empty')
    __(this).find('.queue').html('')

    // add each track
    for (let queueItemId of tracks) {
      __(this).find('.queue').appendHtml(/*html*/`
        <li draggable="true">
          <div class="borders">
            <track-block trackid="${queueItemId}" lazy-render class="has-duration show-content-loading"></track-block>
          </div>
        </li>
      `)
    }

    this.setQueueItemClasses()
    this.setQueueItemCountAndDuration()
    this.setQueueItemContextMenuItems()
    this.setQueueItemIndexes()

    // all queue items are rendered, now register drag-and-drop handlers
    __(this).find('ol.queue li').each((el) => {
      this.registerQueueItemEventHandlers(el)
    })
  }
}