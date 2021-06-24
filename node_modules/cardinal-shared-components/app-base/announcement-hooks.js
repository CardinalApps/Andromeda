/**
 * @file
 * 
 * These are the actions that can be triggered by the main process through the 'announcements'
 * ipc channel to make the theme do things.
 */
import __ from '../../../node_modules/double-u/index.js'

/**
 * Directly called by the ipc listener for the 'announcements' channel.
 */
export async function announcementHandler(announcement, event) {
  console.log(`%c${announcement.action}`, 'color:#f39a11;')

  // all possible hooks
  switch (announcement.action) {
    case 'maximized':
        __(this).addClass('maximized')
        __(this).removeClass('minimized')
        break

    case 'openSettings':
      __('music-settings').el().openSettingsPanel()
      break 

    // for the Router
    case 'swipe':
      if (announcement.direction === 'left') {
        Router.back()
      } else if (announcement.direction === 'right') {
        Router.forward()
      }
      break

    case 'back':
      Router.back()
      break

    case 'forward':
      Router.forward()
      break

    // for the Player
    case 'play':
      Player.play()
      break

    case 'pause':
      Player.pause()
      break

    case 'playpause':
      Player.playPause()
      break

    case 'stop':
      Player.stop()
      break

    case 'next':
      Player.next()
      break

    case 'previous':
      Player.previous()
      break

    case 'togglequeue':
      __('music-app').toggleClass('queue-open')
      break

    case 'alert':
      alert(announcement.message)
      break

    case 'show-welcome':
      this.showWelcome()
      break

    // case 'show-attributions':
    //   this.showAttributions()
    //   break

    case 'show-open-source':
      this.showOpenSource()
      break

    case 'show-about':
      this.showAbout()
      break

    case 'zoom-in':
      if (__('#app').attr('env') === 'electron') {
        const { webFrame } = require('electron')
        webFrame.setZoomLevel(webFrame.getZoomLevel() + 0.5)
      }
      break

    case 'zoom-out':
      if (__('#app').attr('env') === 'electron') {
        const { webFrame } = require('electron')
        webFrame.setZoomLevel(webFrame.getZoomLevel() - 0.5)
      }
      break

    case 'reset-zoom':
      if (__('#app').attr('env') === 'electron') {
        const { webFrame } = require('electron')
        webFrame.setZoomLevel(0)
      }
      break
  }
}