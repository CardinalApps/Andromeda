/**
 * @file
 *
 * Andromeda is the package name of the Hydra desktop app theme. It sets up the
 * UI environment, inits a few necessary globals, then injects the appropiate
 * app into the DOM (music-app, photos-app, etc). All app types are designed to
 * run within the Andromeda envrionment, and depend on certain globals to exist
 * (namely the Router, Bridge, Player, ContextMenu, and i18n globals).
 *
 * When running in Electron, Andromeda takes advantage of the additional
 * capabilties that Electron provides, such as listening for keyboard media
 * keys, which can't easily happen on the web.
 */
import __ from '../node_modules/double-u/index.js'
import { Bridge } from '../node_modules/bridge.js/index.js'
import { Router } from '../node_modules/router.js/index.js'
import Boogietime from '../node_modules/boogietime.js/index.js'
import { getJSONFromFile } from '../node_modules/html.js/index.js'

/**
 * Register all the custom elements, they automatically register with the browser.
 */
import './elements/index.js'

/**
 * Import app models that will be given to the router.
 * 
 * TODO Remove this, the idea didn't pan out. Convert view-models into Lowrider components.
 */
import models from './models/index.js'

/**
 * Wish there was top level await...
 */
async function initTheme() {
  // init Bridge singleton. the AppBase component will establish the connections
  window.Bridge = new Bridge()

  // try to connect to the Electron main process via IPC
  await window.Bridge.init('ipc')
  let env
  
  if (window.Bridge.ipcConnectionEstablished) {
    env = 'electron'
  } else {
    env = 'vanilla'
  }

  // init app audio player
  window.Player = new Boogietime({
    'device': 'cardinalmusic:desktop:full',
    'mode': 'stream'
  })
  
  // init Router singleton. english is hardcoded here as a fallback. the main
  // app-base will check for a user-selected lang during its startup, and set it
  // if needed.
  window.Router = new Router({
    'root': '#view',
    'mode': 'electron',
    'langs': ['en', 'fr'],
    'defaultLang': 'en',
    'cacheViews': true,
    'currentLang': 'en',
    'routes': await getJSONFromFile('/routes.json'),
    'models': models
  })

  // if the env is electron, we can use IPC to get the i18n strings now. we need
  // them sooner in this env because the connection screen has strings, but will
  // never have a http connection
  if (env === 'electron') {
    window.i18n = await window.Bridge.ipcAsk('get-i18n')
  }
  
  // the app renders itself upon injection
  document.getElementById('root').innerHTML = `<music-app id="app" env="${env}"></music-app>`

  if (Bridge.appDebug) {
    console.log('<music-app> injected')
  }
}

initTheme()