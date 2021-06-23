import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

export class PlaybackControls extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    // holds an interval that updates the current time in the playback
    this._currentTimeInterval = null

    // rate at which the progress bar and the current playback time UI elements
    // are updated. there is also a CSS transition to take into account, which
    // smoothes it visually.
    this._updatesPerSecond = 4

    // number of milliseconds before the waveform for a song will be created.
    // the server will limit itself to 1 waveform computation at a time, but
    // there is still a delay here to not bombard the API if the user rapidly
    // steps through the queue, since the API will still immediately spin up new
    // a process that'll just get immediately cancelled
    this._waveformDelay = 500
    this._currentWaveformTimeout = null

    // callback for when the global Player state changes
    Player.on('stateChange', (newState) => {
      this.changeState(newState)
    })

    // callback for when the global Player track changes
    Player.on('trackChange', (newTrackId) => {
      this.onTrackChange(newTrackId)
    })
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/playback-controls/playback-controls.html')
  }

  /**
   * After the inner HTML has rendered.
   */
  onLoad() {
    // create references to the UI elements
    this._currentlyPlayingDiv = this.querySelector('.currently-playing')
    this._scrubberButtonEl = this.querySelector('button.scrubber')
    this._repeatButtonEl = this.querySelector('button.repeat')
    this._shuffleButtonEl = this.querySelector('button.shuffle')
    this._previousButtonEl = this.querySelector('button.-previous')
    this._nextButtonEl = this.querySelector('button.-next')
    this._playPauseButtonEl = this.querySelector('button.-playPause')
    this._muteButtonEl = this.querySelector('button.mute')
    this._currentPlaybackTimeEl = this.querySelector('.time .current')
    this._trackDurationEl = this.querySelector('.time .duration')
    this._queueButtonEl = this.querySelector('button.queue')
    this._progressBarEl = this.querySelector('.progress')
    this._waveformContainerEl = this.querySelector('.waveform-container')

    // registers callbacks on all UI elements (play/pause/next/prev/etc)
    this.registerButtonCallbacks()

    // set the state of the playback controls on init
    this.changeState(Player.state)
  }

  /**
   * Changes the state of the playback controls. This has no affect on actual
   * audio playback, this is merely the state of the UI. Use the global `Player`
   * instance to control audio playback (which will trigger this method
   * automatically).
   *
   * There are three states:
   *
   * `stopped` is the state when no music is playing, and the default state. The
   * current track block and track duration are not shown, the next/play/prev
   * buttons won't respond to input, but the others will.
   *
   * `playing` is when audio is actively playing. The current track block and
   * the duration are shown and the UI is actively updating itself. The play
   * button is changed to a pause button.
   *
   * `paused` is the same as playing, except the play button is shown instead of
   * the pause button.
   *
   * @param {string} state - playing, paused, stopped
   */
  async changeState(state) {
    //console.log(`playback controls received new state "${state}"`,)

    // remove previous state
    __(this).removeClass('playing', 'paused', 'stopped', 'loading')

    switch (state) {
      case 'playing':
        if (!Player.trackObj) throw new Error('global Player object is missing trackObj property')

        // inject new <track-block> only if we need to
        if (__(this._currentlyPlayingDiv).find('track-block').attr('trackid') !== Player.currentlyPlayingId) {
          this.setCurrentlyPlayingTrackBlock()
        }

        __(this._trackDurationEl).html(__().convertSecondsToHHMMSS(Player.trackObj.track_duration, true, true)) // add song duration
        __(this).addClass('playing') // show it
        this.syncPlayButton()
        this.beginTimeUpdating() // creates a new interval
        break

      case 'paused':
        __(this).addClass('paused') // show it
        this.syncPlayButton()
        break

      case 'stopped':
        __(this).addClass('stopped') // hides stuff that aren't relevant when music isn't playing
        this.syncPlayButton()
        this.removeCurrentlyPlayingTrackBlock()
        __(this._currentlyPlayingDiv).html('') // erase the track block
        __(this._currentPlaybackTimeEl).html('0:00') // reset the current playback time
        __(this._trackDurationEl).html('0:00') // reset the song duration
        __(this._progressBarEl).removeAttr('style')
        clearInterval(this._currentTimeInterval)
        break

      case 'loading':
        // update the track block to the song that's loading
        this.setCurrentlyPlayingTrackBlock()
        __(this).addClass('loading') // show it
        this.syncPlayButton()
        break
    }
  }

  /**
   * Callback for when the currently playing track changes in the global Player.
   */
  async onTrackChange(newTrackId) {
    //console.log('playback controls received new track id')

    __(this).removeClass('waveform-error')

    // the 'stop' event itself within the global Player will trigger the
    // 'trackChange' event, which triggers this
    if (Player.state === 'stopped') return

    if (!Player.trackObj) throw new Error('global Player object is missing trackObj property')

    // change song duration
    __(this._trackDurationEl).html(__().convertSecondsToHHMMSS(Player.trackObj.track_duration, true, true))

    // time updating
    this.beginTimeUpdating()

    // clear previous waveform timeout
    clearTimeout(this._currentWaveformTimeout)

    // remove previous waveform
    if (__(this._waveformContainerEl).find('canvas').els.length) {
      __(this._waveformContainerEl).find('canvas').remove()
    }

    // create the waveform after a small delay
    this._currentWaveformTimeout = setTimeout(async () => {
      console.log('Requesting waveform from server')

      if (Player.state !== 'playing' && Player.state !== 'paused') return

      let waveformReq = await Bridge.httpApi(`/music-track/${Player.trackObj.id}/waveform`)
      
      if (waveformReq.statusRange !== 2) {
        __(this).addClass('waveform-error')
        return
      }

      this.drawWaveform(waveformReq.response)
    }, this._waveformDelay)
  }

  /**
   * Updates/overwrites the currently playing track block.
   */
  setCurrentlyPlayingTrackBlock() {
    //__(this._currentlyPlayingDiv).find('track-block').remove()

    let currentBlock = __(this).find('.currently-playing track-block')

    // update existing block for smooth fades
    if (currentBlock.els.length) {
      currentBlock.attr('trackid', Player.currentlyPlayingId)
    }
    // insert new block
    else {
      __(this._currentlyPlayingDiv).html(`<track-block trackid="${Player.currentlyPlayingId}" class="readonly xs"></track-block>`)
    }
  }

  /**
   * Updates/overwrites the currently playing track block.
   */
   removeCurrentlyPlayingTrackBlock() {
    __(this._currentlyPlayingDiv).find('track-block').remove()
  }

  /**
   * The play button changes between two states (play/pause), calling this syncs
   * it with the Player state.
   */
  syncPlayButton() {
    if (Player.state === 'playing') {
      __(this._playPauseButtonEl).find('i').removeClass('fa-play').addClass('fa-pause')
    } else if (Player.state === 'paused' || Player.state === 'loading') {
      __(this._playPauseButtonEl).find('i').removeClass('fa-pause').addClass('fa-play')
    } else if (Player.state === 'stopped') {
      __(this._playPauseButtonEl).find('i').removeClass('fa-pause').addClass('fa-play')
    }
  }

  /**
   * All UI button event handlers.
   */
  registerButtonCallbacks() {
    /**
     * PlayPause button MOUSE CLICKED or SPACEBARRED
     */
    this._playPauseButtonEl.addEventListener('click', (event) => {
      if (Player.state === 'playing') {
        Player.pause()
      } else if (Player.state === 'paused') {
        Player.play()
      } else if (Player.state === 'stopped' && Player.queue.length) {
        Player.play()
      }
    })

    /**
     * Prev button MOUSE CLICKED or SPACEBARRED
     */
    this._previousButtonEl.addEventListener('click', (event) => {
      Player.previous()
    })

    /**
     * Next button MOUSE CLICKED or SPACEBARRED
     */
    this._nextButtonEl.addEventListener('click', (event) => {
      Player.next()
    })

    /**
     * Shuffle button MOUSE CLICKED or SPACEBARRED
     */
    this._shuffleButtonEl.addEventListener('click', (event) => {
      if (Player.shuffle) {
        __(this).removeClass('shuffle-on')
        Player.setShuffle(false)
      } else {
        __(this).addClass('shuffle-on')
        Player.setShuffle(true)
      }
    })

    /**
     * Repeat button MOUSE CLICKED or SPACEBARRED
     */
    this._repeatButtonEl.addEventListener('click', (event) => {
      // if not repeating, switch to track repeat
      if (Player.repeat === false) {        
        Player.setRepeat('track')
        __(this).removeClass('repeat-track', 'repeat-queue')
        __(this).addClass('repeat-track')
      }
      // if repeating track, switch to repeat queue
      else if (Player.repeat === 'track') {        
        Player.setRepeat('queue')
        __(this).removeClass('repeat-track', 'repeat-queue')
        __(this).addClass('repeat-queue')
      }
      // if repeating queue, switch back to repeating nothing
      else if (Player.repeat === 'queue') {
        Player.setRepeat(false)
        __(this).removeClass('repeat-track', 'repeat-queue')
      }
    })

    /**
     * Mute button MOUSE CLICKED or SPACEBARRED
     */
    this._muteButtonEl.addEventListener('click', (event) => {
      if (Player.muted) {
        __(this).removeClass('muted')
        Player.unmute()
      } else {
        __(this).addClass('muted')
        Player.mute()
      }
    })

    /**
     * Queue button MOUSE CLICKED or SPACEBARRED
     */
    this._queueButtonEl.addEventListener('click', (event) => {
      __('music-app').toggleClass('queue-open')
    })

    /**
     * Scrubber MOUSEDOWN. When the user mousedown's on the scrubber, it will
     * expand into the audio waveform.
     *
     * This registers new event handers that listen for actions while the lmb is
     * held down. When lmb is released, the event handlers are removed.
     */
    let expandWaveform = (event) => {
      event.preventDefault()
      console.log('a')
      //if (event.which !== 1) return // must be left click
      if (Player.state === 'stopped') return // audio must be playing or paused

      let playbackControlsX = __(this).position().x

      /**
       * Scrubber MOUSEMOVE handler that drags the progress bar under the users mouse, only
       * registered while the waveform is open.
       */
      const dragProgressBar = (event) => {
        event.preventDefault()
        this.stopTimeUpdating()

        console.log('drag')

        let width = event.x - playbackControlsX
        this._scrubberButtonEl.classList.add('dragging')
        this._progressBarEl.setAttribute('style', `width:${width}px`)

        let songDuration = Player.trackObj.track_duration
        let percentageDragged = width / this._scrubberButtonEl.clientWidth
        let secondsDragged = songDuration * percentageDragged

        this.querySelector('.scrubber-time').innerHTML = /*html*/`
          <span class="drag-time" data-seconds="${secondsDragged}">
            
          </span>`
      }

      /**
       * "Scrubber" MOUSEUP - this only gets registered when the waveform is
       * open, and it's attached to the document, not the scrubber itself.
       *
       * When lmb is released, if the mouse is still within the scrubber, seek
       * to that point, otherwise if the mouse is outside the scrubber, do not
       * seek.
       */
      const scrubberMouseUpHandler = (event) => {
        event.preventDefault()
        console.log('up')
        // lmb was released within the scrubber, seek to that time
        if (__(event.target).parents('.scrubber').els.length) {
          let dragTime = this._scrubberButtonEl.querySelector('.drag-time')

          if (dragTime) {
            let seekToSeconds = dragTime.getAttribute('data-seconds')
            Player.seek(seekToSeconds)
          }
        }

        this.beginTimeUpdating()

        __(this._scrubberButtonEl).removeClass('expanded', 'dragging')

        // remove scrubber event handlers when lmb is released
        this._scrubberButtonEl.removeEventListener('mousemove', dragProgressBar)
        this._scrubberButtonEl.removeEventListener('touchmove', dragProgressBar)
        document.removeEventListener('mouseup', scrubberMouseUpHandler)
        document.removeEventListener('touchend', scrubberMouseUpHandler)
      }
      
      // expand to show the waveform
      __(this._scrubberButtonEl).addClass('expanded')

      // register the listeners that only exist while lmb is held down
      this._scrubberButtonEl.addEventListener('mousemove', dragProgressBar)
      this._scrubberButtonEl.addEventListener('touchmove', dragProgressBar)
      document.addEventListener('mouseup', scrubberMouseUpHandler)
      document.addEventListener('touchend', scrubberMouseUpHandler)
    }
    
    this._scrubberButtonEl.addEventListener('mousedown', expandWaveform)
    this._scrubberButtonEl.addEventListener('touchstart', expandWaveform)
    this._scrubberButtonEl.addEventListener('touchcancel', () => {
      console.log('cancel')
    })
  }

  /**
   * Invoking this function will create an interval that updates the current
   * playback time and the scrubber bar in the UI. The interval is saved to the
   * class property `_currentTimeInterval`.
   */
  beginTimeUpdating() {
    // rescope
    let timerEl = this._currentPlaybackTimeEl

    // clear the previous timer
    this.stopTimeUpdating()

    // UI update interval. this must run while music is paused as well, in order
    // to restore the correct state after playing with the seek bar
    this._currentTimeInterval = setInterval(() => {
      // do nothing if the music is not playing
      if (Player.state === 'stopped') throw new Error('Interval should be destroyed when the music is stopped, find your bug.')
      
      if (!Player.trackObj) {
        console.log('<playback-controls> time updating interval is waiting for track to load')
        return
      }

      let currentTime = Player.getCurrentPlaybackTime()
      
      // update time
      __(timerEl).attr('data-seconds', currentTime)
      __(timerEl).html(__().convertSecondsToHHMMSS(Math.floor(currentTime)))

      // update progress bar
      let currentTrackDuration = Player.trackObj.track_duration
      let progressPercentage = (currentTime / currentTrackDuration) * 100
      
      // truncate the percentage to 4 decimal places
      progressPercentage = progressPercentage.toFixed(4)

      __(this._progressBarEl).css({'width': `${progressPercentage}%`})
    }, 1000 / this._updatesPerSecond)
  }

  /**
   * Deletes the interval that updates the time and progress bar in the UI.
   */
  stopTimeUpdating() {
    clearInterval(this._currentTimeInterval)
  }

  /**
   * Draws the waveform based on the waveform data.
   *
   * @param {array} waveform - An array of waveform data that was created by the
   * WaveformCreator process or retreived from the cached waveforms in the
   * database.
   */
  drawWaveform(waveform) {
    const canvasWidth = '100%'
    const canvasHeight = 60
    
    //console.log('Drawing waveform', waveform)

    // inject new canvas, overwriting old one
    this._waveformContainerEl.innerHTML = '<canvas class="waveform"></canvas>'
    const canvas = this._waveformContainerEl.querySelector('canvas')

    let determinedWidth = 0
    let determinedHeight = 0

    // if width is 100%, use parent width
    if (canvasWidth === '100%') {
      determinedWidth = canvas.closest('div').clientWidth
    } else {
      determinedWidth = canvasWidth
    }

    // if height is 100%, use parent height
    if (canvasHeight === '100%') {
      determinedHeight = canvas.closest('div').clientHeight
    } else {
      determinedHeight = canvasHeight
    }

    // set the canvas size
    canvas.width = determinedWidth
    canvas.height = determinedHeight

    // get context
    const ctx = canvas.getContext('2d')

    // vertically aligns the content within the canvas
    ctx.translate(0, determinedHeight / 2)

    // the width of each segment
    const segmentWidth = determinedWidth / waveform.length

    /**
     * Draws an individual line segment
     * 
     * @param {object} ctx - Canvas context.
     * @param {number} x - X-axis pixel value.
     * @param {number} value - Segment "intensity".
     * @param {number} canvasHeight - Canvas height in pixels.
     */
    function drawLineSegment(ctx, x, value, canvasHeight) {
      let segmentHeight = Math.abs(canvasHeight * value)
    
      ctx.beginPath()
      ctx.lineWidth = 1
      ctx.strokeStyle = '#8b8b8b'
    
      // draw the downwards portion
      ctx.moveTo(x, 0)
      ctx.lineTo(x, segmentHeight)
    
      // draw the upwards portion
      ctx.moveTo(x, 0)
      ctx.lineTo(x, '-'+segmentHeight)
    
      // make it visible
      ctx.stroke()
    }

    // draw each segment
    for (let i = 0; i < waveform.length; i++) {
      let x = segmentWidth * i

      drawLineSegment(ctx, x, waveform[i], determinedHeight)
    }
  }
}