import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'
import consoleMessage from './console-message.js'
import { announcementHandler } from './announcement-hooks.js'
import * as keyboardHelpers from './keyboard-helpers.js'

/**
 * The AppBase class is meant to serve as the highest level scope in the UI, and
 * **only the app elements themselves** (music-app, cinema-app, photo-app, etc) 
 * should extend this class.
 * 
 * This class provides general functionality that all apps share.
 */
export default class AppBase extends Lowrider {
  /**
   * One-time inits on app startup (aka onSpawn of the app element).
   */
  constructor() {
    super()

    consoleMessage()

    this.maybeEnableDeveloperMode()

    this.boundAnnouncementListener = announcementHandler.bind(this)
    this.boundOnDocumentKeyDown = this.onDocumentKeyDown.bind(this)
    this.boundOnDocumentKeyUp = this.onDocumentKeyUp.bind(this)
    this.boundOnWindowResize = this.onWindowResize.bind(this)

    // create a global function that allows the user to disable the custom CSS via
    // the console
    window.disableCustomCSS = () => {
      document.querySelector('#user-custom-css').remove()
      document.querySelector('textarea[name="custom_css"]').value = ''
      window.localStorage.removeItem('custom_css')
    }

    // modal event listeners
    this.enableModals()

    // keyboard helper event listeners
    keyboardHelpers.register(this)

    // set OS attribute
    __(this).attr('os', process.platform)

    // wait 4 seconds before checking for updates, if auto update is enabled
    if (this.getAttribute('env') === 'electron') {
      setTimeout(async () => {
        if (JSON.parse(window.localStorage.getItem('auto_check_for_updates'))) {
          this.checkForUpdates()
        }
      }, 4000)
    }
  }

  /**
   * Checks if developer mode is enabled by default in the database, and if so,
   * enables it in the UI.
   * 
   * @param {boolean} [disable] - Set to `false` to disable developer mode.
   */
  async maybeEnableDeveloperMode() {
    if (JSON.parse(window.localStorage.getItem('developer_mode'))) {
      this.enableDeveloperMode()
    } else {
      this.enableDeveloperMode(false)
    }
  }

  /**
   * Enables developer mode. Does not change the developer mode setting in the database.
   * 
   * @param {boolean} [disable] - Set to `false` to disable developer mode.
   */
  async enableDeveloperMode(disable) {
    if (disable === false) {
      __(this).removeClass('developer-mode')
    } else {
      __(this).addClass('developer-mode')
    }
  }

  /**
   * Checks the database to see if a default server has been saved. If one has
   * been, the server row will be returned. If none exists, null will be
   * returned.
   *
   * @returns {(object|null)}
   */
  async getDefaultServer() {
    let defaultServerId = await Bridge.ipcAsk('get-option', 'default_server')

    if (!defaultServerId) {
      return null
    }

    let defaultServer = await Bridge.ipcAsk('db-api', {
      'fn': 'getRow',
      'args': ['servers', defaultServerId]
    })

    return defaultServer
  }

  /**
   * Attempts to connect to a Hydra Server. Will check that the HTTP API is
   * connectable and will establish a WebSocket connection.
   * 
   * If the HTTP connection is not available, the WebSocket connection will not
   * be attempted. This is to avoid the inevitable timeout.
   * 
   * @param {string} host - Host (domain, IP, whatever).
   * @param {(string|number)} port
   * @returns {boolean} True if the server is connectable and it returns the
   * Hydra Server HTTP header and a 200 status, otherwise false.
   */
  async connectToServer(host, port) {
    if (!host) throw new Error('Host is required')
    if (!port) throw new Error('Port is required')

    // attempt HTTP connection
    try {
      await Bridge.init('http', {
        'host': host,
        'port': port,
        'scheme': 'http://'
      })
    } catch (error) {
      console.log('HTTP connection to Cardinal Server cannot be established. Not attempting WebSocket connection.')
      return false
    }

    // attempt WebSocket connection. the server uses the port number +1
    // for WebSockets
    try {
      await Bridge.init('ws', {
        'host': host,
        'port': parseInt(port) + 1,
        'scheme': 'ws://'
      })
    } catch (error) {
      console.log('WebSocket connection to server failed')
    }

    // did both connections succeed?
    let connected = Bridge.httpConnectionEstablished && Bridge.wsConnectionEstablished

    if (connected) {
      return true
    } else {
      return false
    }
  }

  /**
   * Locks the app and shows the connection screen. Always happens on first
   * startup, before any server info has been inputted by the user.
   */
  async showConnectionLockScreen(message) {
    let messageAttr = message ? `message="${message}"` : ''

    __(this).prependHtml(await html(/*html*/`
      <div id="win32-window-controls" class="win32-only">
        {inc{/elements/music-app/templates/win32-window-control-buttons.html}}
      </div>
      <server-connect overlay ${messageAttr}></server-connect>`))
  }

  /**
   * Checks if the connection lock screen is currently showing.
   * 
   * @returns {boolean}
   */
  isConnectionLockScreenShowing() {
    return !!document.querySelector('server-connect[overlay]')
  }

  /**
   * One function to rule them all when it comes to starting up the app. This
   * will attempt to connect to the server using the default connection info
   * from the db, and if it doesn't work, will show the connection screen.
   * 
   * @returns {boolean} True if the Bridge already was, or/and is now connected,
   * false if EITHER the HTTP or WebSocket connection failed.
   */
  async autoConnectOrLock() {
    if (!('Bridge' in window)) throw new Error('AutoConnect: Cannot auto connect, window.Bridge global is missing.')
    
    // if the bridge is already connected, we don't need to do anything
    if (Bridge.httpConnectionEstablished && Bridge.wsConnectionEstablished) {
      console.log('AutoConnect: Bridge is already connected.')
      return true
    }

    const defaultServer = await this.getDefaultServer()
    
    // no default server set has been set (might be first start up), show connection screen
    if (!defaultServer) {
      console.log('AutoConnect: No default server set, showing connection screen.')
      this.showConnectionLockScreen()
      return false
    }
    
    const defaultServerString = `${defaultServer.server_host}:${defaultServer.server_port_http}`
    
    // attempt to establish initial Bridge->Server connection. if it fails,
    // show connection screen
    if (await this.connectToServer(defaultServer.server_host, defaultServer.server_port_http)) {
      console.log(`AutoConnect: Automatically connected to server at ${defaultServerString}.`)
      
      // is this the best place for this?
      // with the vanilla env, we can't even load
      // the app without the connection in the http first place, so it's safe to use
      // http for getting the strings.
      // with the electron env, there's the possibility of no http connection,
      // so we gotta get the strings earlier via ipc instead of here.
      await this.maybeSetI18nViaHttp()

      return true
    } else {
      console.log(`AutoConnect: Could not connect to server at ${defaultServerString}`)
      this.showConnectionLockScreen('autoconnect-failed')
      return false
    }
  }

  /**
   * Gets all of the strings that the app needs via HTTP and sets them to
   * `window.i18n`.
   */
  async maybeSetI18nViaHttp() {
    // if the strings weren't loaded earlier via IPC, we need them now via HTTP
    if (!window.i18n) {
      let i18nReq = await Bridge.httpApi('/i18n')

      if (i18nReq.status === 200) {
        window.i18n = i18nReq.response
      } else {
        console.error('i18n strings HTTP route did not return with status 200')
      }
    }
  }

  /**
   * Injects the custom css from the database into the <head>.
   */
  async injectCustomCss() {
    let customCss = window.localStorage.getItem('custom_css')

    // remove old custom css
    let existingCustomCssEl = document.querySelector('#user-custom-css')
    if (existingCustomCssEl) existingCustomCssEl.remove()

    if (customCss) {
      let styleEl = document.createElement('style')
      styleEl.id = 'user-custom-css'
      styleEl.textContent = customCss
      document.head.append(styleEl)
    }
  }

  /**
   * Checks the database for the color theme and accent color and applies them.
   * Defaults to dark mode. The default accent color is hard coded in the SCSS.
   */
  async setColors() {
    let colorTheme = window.localStorage.getItem('color_theme') || 'dark'
    let accentColor = window.localStorage.getItem('accent_color')

    if (colorTheme) {
      __(this).attr('color-theme', colorTheme)
    }

    if (accentColor) {
      document.documentElement.style.setProperty('--accent-color', accentColor)
    }
  }

  /**
   * Registers common event handlers that all apps wanna use.
   */
  registerCommonEventHandlers() {
    // main process announcements listener
    // @listens announcements
    Bridge.ipcListen('announcements', this.boundAnnouncementListener)
    document.addEventListener('keydown', this.boundOnDocumentKeyDown)
    document.addEventListener('keyup', this.boundOnDocumentKeyUp)
    window.addEventListener('resize', this.boundOnWindowResize)
    
    /**
     * win32 minmize
     */
    __('#win32-window-controls .minimize').on('click', (event) => {
      Bridge.ipcSay('minimize-player')
    })
    
    /**
     * win32 maximize
     */
    __('#win32-window-controls .maximize').on('click', (event) => {
      Bridge.ipcSay('maximize-player')
    })

    /**
     * win32 restore
     */
    __('#win32-window-controls .restore').on('click', (event) => {
      Bridge.ipcSay('restore-player')
    })
    
    /**
     * win32 close
     */
    __('#win32-window-controls .close').on('click', (event) => {
      Bridge.ipcSay('close-player')
    })

    /**
     * Back button
     */
    __('button#back-button').on('click', (event) => {
      // lmb only
      if (event.which !== 1) return
      
      Router.back()
    })

    /**
     * Opens external links in the users default browser
     */
    __('a.external').on('click', this, function(event) {
      event.preventDefault()

      let href = __(this).attr('href')
      
      Bridge.ipcSay('open-url', href)
    })

    /**
     * On right click up anywhere in the music-app, add a context menu with the class 'rmb'.
     */
    if ('ContextMenu' in window) {
      ContextMenu.listenForRightClicks(this)
    }
  }

  /**
   * Removes event listeners that get created by registerCommonEventHandlers()
   * that exist in a higher scope than this element.
   */
  removeCommonEventHandlers() {
    Bridge.removeListener('announcements', this.boundAnnouncementListener)
    document.removeEventListener('keydown', this.boundOnDocumentKeyDown)
    document.removeEventListener('keyup', this.boundOnDocumentKeyUp)
    window.removeEventListener('resize', this.boundOnWindowResize)
  }

  /**
   * Fired on document keydown.
   */
  onDocumentKeyDown(event) {
    // add helper classes
    switch (event.which) {
      // shift
      case 16:
        this.classList.add('shift-down')
        break
      
      // ctrl
      case 17:
        this.classList.add('ctrl-down')
        break

      // option (mac)
      case 18:
        this.classList.add('option-down')
        break

      // cmd (mac)
      case 91:
        this.classList.add('cmd-down')
        break

      // spacebar to pause and resume
      case 32:
        // if user is not using a form field or anchor
        for (let selector of ['input', 'textarea', 'button', 'a']) {
          if (event.target.matches(selector)) return
        }

        event.preventDefault() // prevent the page from scrolling downward
        Player.playPause()
        break

      // arrow left
      case 37:
        Player.previous()
        break

      // arrow right
      case 39:
        Player.next()
        break
    }
  }

  /**
   * Fired on document keyup.
   */
  onDocumentKeyUp(event) {
    // remove helper classes
    switch (event.which) {
      // shift
      case 16:
        this.classList.remove('shift-down')
        break
      
      // ctrl
      case 17:
        this.classList.remove('ctrl-down')
        break

      // option (mac)
      case 18:
        this.classList.remove('option-down')
        break

      // cmd (mac)
      case 91:
        this.classList.remove('cmd-down')
        break

      // esc
      case 27:
        if ('ContextMenu' in window) {
          ContextMenu.closeAllContextMenus()
        }
          
        this.modal.closeAll()
        __('context-menu').each(el => el.closeAll())
        break
    }
  }

  /**
   * On window resize.
   */
  onWindowResize() {
    // if we are not maximized
    if (window.screenX !== 0 || window.screenY !== 0) {
      __(this).removeClass('maximized')
    }
  }

  /**
   * General modal listener, delegated to music-app.
   * 
   * The extending class should implement `this.modal`.
   */
  enableModals() {
    __('[data-modal]').on('click', this, async (event) => {
      let opener = __(event.target)
      let modalSelector = opener.attr('data-modal')
      let modalEl = document.querySelector(modalSelector)

      if ('modal' in this) {
        this.modal.show(opener.closest('#app').el(), modalEl)
      } else {
        console.warn('No `modal` handler set.')
      }
    })
  }

  // TODO why is this unfinished?
  async checkForUpdates() {
    if (this.getAttribute('env') !== 'electron') return console.warn('Updates only available in Electron.')
    Bridge.ipcSay('check-for-updates-silently')
  }
}