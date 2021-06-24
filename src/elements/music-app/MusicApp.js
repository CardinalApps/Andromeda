/**
 * @file
 *
 * The `<music-app>` custom element serves as the music app itself. It runs
 * within the hydra renderer environment, and it is the highest level scope for
 * the UI. It extends the app-base class.
 *
 * One of its first tasks is to try and establish a connection to the server,
 * and if it can't be done, show the connection screen.
 *
 * Once a server connection has been established, the music-app is responsible
 * for implementing the "app frame", which includes static HTML and the root
 * router view element. Once rendered, the user can take control of the app by
 * clicking around.
 */
import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import { registerGlobalTooltipListener }  from '../../tooltip/tooltip.js'

import * as themeNotifications from './theme-notifications.js'
import * as modal from '../../modal.js'

import AppBase from '../../../node_modules/cardinal-shared-components/app-base/AppBase.js'

export class MusicApp extends AppBase {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    if (__().enforceSingleton('music-app', this)) return

    //const userSelectedLang = await Bridge.ipcAsk('get-option', 'lang')
    const userSelectedLang = window.localStorage.getItem('lang') || 'en'

    // the app is hardcoded to start in english when the router is inited,
    // but if the user selected a lang other than that, we'll quickly switch the
    // lang.
    if (Router.currentLang === 'en' && userSelectedLang !== 'en') {
      Router.setLang(userSelectedLang)
    }

    this.callbacks = {
      'appReady': {
        'fns': [],
        'done': 0
      }
    }

    this.modal = modal
    
    this.boundOnPlayerStateChange = this.onPlayerStateChange.bind(this)

    // @listens option-change
    Bridge.ipcListen('option-change', this.boundOnOptionChange)
    Player.on('stateChange', this.boundOnPlayerStateChange)

    // tooltip event listeners
    registerGlobalTooltipListener()
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    await this.preLoadQueries()
    this.registerEventHandlers()

    if (await this.autoConnectOrLock()) {
      // is this the best place for this?
        // with the vanilla env, we can't even load
        // the app without the connection in the http first place, so it's safe to use
        // http for getting the strings.
        // with the electron env, there's the possibility of no http connection,
        // so we gotta get the strings earlier via ipc instead of here.
        await this.maybeSetI18nViaHttp()
      this.innerHTML = await html('/elements/music-app/music-app.html')
    }
  }

  /**
   * After the inner HTML has rendered.
   */
  async onLoad() {
    // if onBuild() decided to build the connection screen, we don't need to do
    // anything else
    if (this.isConnectionLockScreenShowing()) {
      return
    } 
    // otherwise, proceed with normal app load
    else {
      await this.loadApp()
    }
  }

  /**
   * When the element is removed from the document.
   */
  onRemoved() {
    this.removeCommonEventHandlers()

    Bridge.removeListener('option-change', this.boundOnOptionChange)
    Player.off('stateChange', this.boundOnPlayerStateChange)
  }

  /**
   * Called before loadApp(), this will perform db lookups for things that we
   * need before the app can load.
   */
  async preLoadQueries() {
    // inject custom css early to prevent flash of unstyled content
    await this.injectCustomCss()

    // theme color & accent color
    await this.setColors()
  }

  /**
   * Load the app after getting the server connection.
   * 
   * TODO add class "no-music" if there are no tracks on the server
   */
  async loadApp() {
    // macOS permission dialog for media keys
    if (__(this).attr('os') === 'darwin') {
      this.registerMediaKeyListeners()
    }
    
    setTimeout(() => {
      this._appIsReady()
    }, 0)
  }

  /**
   * Called when the app in the DOM is truly ready
   */
  async _appIsReady() {
    this.setMainDotMenuItems()
    
    // load the startpage
    let startPage = window.localStorage.getItem('start_page') || '/explore-music'
    window.Router.go(startPage, true)
    
    for (let cb of this.callbacks.appReady.fns) {
      cb()
    }

    // connection screen kinda makes the welcome message useless.
    // TODO remove once I'm sure I really don't want a welcome message
    //this.maybeShowWelcome()

    // TODO delegate this to a <genre-list> element that filters by favs
    //this.injectFavoriteGenres()

    Bridge.wsListen('server-to-client-instruction', (message) => {
      // let the server control this client's playback
      if (message.instruction === 'remote-playback-control') {
        Player[message.command]()
      }
    })

    // send the state on app load to let the server know the current state is
    // "stopped" (as it always is when the app first boots up)
    this.sendStateToServer()

    // TODO move to core app
    __('.nav-pillar-push').on('click', () => {
      __(this).toggleClass('nav-pillar-push')
    })
    __('#back-button').on('touchmove', (e) => {
      // stops the back button from scrolling the whole viewport
      e.preventDefault()
    })
  }

  /**
   * Event handlers
   */
  registerEventHandlers() {
    this.registerCommonEventHandlers()

    /**
     * Slidetoggles
     */
    __('.slidetoggle .label').on('click', this, function(event) {
      __(this).closest('.slidetoggle').toggleClass('open')
    })
  }

  /**
   * Context menu items.
   * 
   * @returns {array}
   */
  getContextMenuItems() {
    let items = [{
      'group': i18n('music-app.context-menu.group-name'),
      'items': {
        /**
         * Open music-settings
         */
        [i18n('music-app.context-menu.settings')]: {
          'cb': (rightClickedEl) => {
            __('music-settings').el().openSettingsPanel()
            ContextMenu.closeAllContextMenus()
          }
        },
      }
    }]

    if (__(this).hasClass('developer-mode') && this.getAttribute('env') === 'electron') {
      items.push({
        'group': 'Developer',
        'items': {
          /**
           * Open Developer Tools
           */
          [i18n('context-menu.toggle-dev-tools')]: {
            'cb': (rightClickedEl) => {
              if (__('#app').attr('env') !== 'electron') return console.warn('Developer tools only supported in Electron')
              
              Bridge.ipcSay('open-dev-tools', 'mainPlayer')
              ContextMenu.closeAllContextMenus()
            }
          },
          /**
           * Inspect Element
           */
          [i18n('context-menu.inspect-element')]: {
            'cb': (rightClickedEl) => {
              if (__('#app').attr('env') !== 'electron') return console.warn('Developer tools only supported in Electron')
              
              let elRect = __(rightClickedEl).position()
              Bridge.ipcSay('dev-tools-inspect', {'x': Math.round(elRect.x), 'y': Math.round(elRect.y)})
              ContextMenu.closeAllContextMenus()
            }
          }
        }
      })
    }

    return items
  }

  /**
   * Adds entries to the main dot menu.
   */
  setMainDotMenuItems() {
    if (this.getAttribute('env') === 'electron') {
      if (! __('#main-dot-menu').els.length) return
      
      __('#main-dot-menu').el().addMenuItems('start', {
        'group': i18n('app-name'),
        'items': {
          /**
           * Check for updates
           */
          [i18n('system-menu.check-for-updates')]: {
            'icon': 'parachute-box',
            'cb': (rightClickedEl, menuItem) => {
              if (__('#app').attr('env') !== 'electron') return console.warn('Updating only supported in Electron')
              
              Bridge.ipcSay('check-for-updates-and-prompt')
              ContextMenu.closeAllContextMenus()
            }
          }
        }
      })
    }
  }

  /**
   * Tells the main process to try and register listeners for media keys. If they cannot
   * be registered (which is often the case), a theme level notification will be displayed
   * to the user that prompts them to address the issue.
   * 
   * Requires Electron.
   */
  async registerMediaKeyListeners() {
    if (this.getAttribute('env') !== 'electron') return true
    
    let mediaKeysAreRegistered = await Bridge.ipcAsk('register-media-key-listeners')

    if (!mediaKeysAreRegistered) {
      console.log('%cMedia key listeners could not be registered', 'color:#d24848;')

      this.notify({
        'id': 'media-key-accessibility-dialogue',
        'title': i18n('media-keys-need-permission.notification.title'),
        'message': `${i18n('media-keys-need-permission.notification.message')}`,
        'onClick': async () => {
          Bridge.ipcSay('ask-for-accessibility-permission')
        }
      })

      return false
    }

    return true
  }

  /**
   * Allows other code to register callbacks with the app.
   * 
   * @param {string} eventType - Type of event. Supports `appReady`.
   * @param {Function} cb - Callback function.
   */
  on(eventType, cb) {
    // if the callback event was already done, trigger the callback function immediately instead
    if (this.callbacks[eventType].done) {
      cb()
    } else {
      this.callbacks[eventType].fns.push(cb)
    }
  }

  /**
   * Adds a theme level notification.
   * 
   * @param {object} params - See docs for `themeNotifications.create()`
   */
  notify(params) {
    themeNotifications.create(params)
  }

  /**
   * Whenever the state of the global Player changes, send the app state to the server.
   */
  onPlayerStateChange(state) {
    this.sendStateToServer()
  }

  /**
   * Injects the users favorite genres into the sidebar.
   * 
   * @param {array} [genres] - Optionally give genre ID's to render instead of looking them up.
   */
  // async injectFavoriteGenres(favoriteGenres = []) {
  //   if (!favoriteGenres.length) {
  //     favoriteGenres = await Bridge.ipcAsk('get-option', 'favorite_genres')
  //   }

  //   if (Array.isArray(favoriteGenres)) {
  //     let favoriteGenresEl = __(this).find('.favorite-genres')
  //     favoriteGenresEl.html('')

  //     for (let genreId of favoriteGenres) {
  //       favoriteGenresEl.appendHtml(/*html*/`<genre-tag genreid="${genreId}" small></genre-tag>`)
  //     }
  //   }
  // }

  // /**
  //  * Checks the database 'show_welcome' option and shows the welcome modal if needed.
  //  */
  // async maybeShowWelcome() {
  //   if (await Bridge.ipcAsk('get-option', 'show_welcome')) {
  //     this.showWelcome()
  //   }
  // }

  // /**
  //  * Shows the welcome modal.
  //  */
  // async showWelcome() {
  //   let modalContent = await html('/elements/music-app/modals/welcome.html')

  //   modal.show(this, modalContent, {
  //     'onClose': (id) => {
  //       Bridge.ipcAsk('set-option', {'option': 'show_welcome', 'value': 0})
  //     }
  //   })
  // }

  /**
   * Shows the attributions modal.
   */
  async showOpenSource() {
    let modalContent = await html('/elements/music-app/modals/open-source.html')

    modal.show(this, modalContent)
  }

  /**
   * Shows the about modal.
   */
  async showAbout() {
    if (this.getAttribute('env') !== 'electron') return false

    let appPackage = await Bridge.ipcAsk('get-app-package')

    let replacements = {
      'name': i18n(appPackage.name),
      'version': 'v' + appPackage.version,
      'description': appPackage.description,
      'homepage': appPackage.homepage,
    }

    let modalContent = await html('/elements/music-app/modals/about.html', replacements)

    modal.show(this, modalContent)
  }

  /**
   * Sends information about the current state of the music player to the server.
   */
  sendStateToServer() {
    let reportedTime = Player.getCurrentPlaybackTime()
    let timeSeconds = __('playback-controls .current').attr('data-seconds') // ugly, but is related to bug below
    let timeFormatted = Player.state === 'stopped' ? '0:00' : __('playback-controls .current').el().innerText // ugly, but is related to bug below

    // FIXME
    // https://github.com/thangngoc89/react-howler/issues/72
    // currently experiencing that issue (disregard the React part).
    // sometimes `time` is the Howl object
    if (typeof reportedTime === 'number') {
      timeSeconds = reportedTime
      timeFormatted = __().convertSecondsToHHMMSS(Math.floor(reportedTime))
    }

    let state = {
      'mode': Player.mode,
      'track': Player.trackObj,
      'currentSeconds': timeSeconds,
      'currentTime': timeFormatted,
      'totalTime': '0:00',
      'muted': Player.muted,
      'state': Player.state,
      'repeat': Player.repeat,
      'shuffle': Player.shuffle,
      'queue': Player.queue
    }

    if (Player.state === 'playing' || Player.state === 'paused') {
      state.totalTime = Player.trackObj.track_duration_formatted
    }

    console.log('Sending client state to server', state)

    Bridge.wsSay('client-to-server-state-update', state)
  }
}