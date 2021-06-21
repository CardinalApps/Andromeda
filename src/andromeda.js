/**
 * Andromeda is the Cardinal Music web app. It depends on a connection to
 * Cardinal Server.
 *
 * This file will bootstrap the client env then inject the required element(s)
 * into the DOM to load the app.
 *
 * When running in Electron, Andromeda will also establish an IPC connection to
 * the main process.
 */
import __ from '../node_modules/double-u/index.js'
import { Bridge } from '../node_modules/bridge.js/index.js'
import { Router } from '../node_modules/router.js/index.js'
import Boogietime from '../node_modules/boogietime.js/index.js'

/**
 * Register all the custom elements, they automatically register with the browser.
 */
import './elements/index.js'

/**
 * Import app models that will be given to the router.
 */
import models from './models/index.js'

/**
 * Async function for await support.
 */
async function initTheme() {
  // init Bridge singleton
  window.Bridge = new Bridge()

  // try to connect to the Electron main process. if we cannot, we must be
  // running in a regular web browser. this is a more robust way of determining
  // the env than parsing the agent string.
  const ipcConnected = await window.Bridge.init('ipc')
  const env = ipcConnected ? 'electron' : 'web'

  // init app audio player
  window.Player = new Boogietime({
    'device': 'cardinalmusic:desktop:full',
    'mode': 'stream'
  })
  
  // init router. english is hardcoded here as a fallback. the app will check
  // for a user selected lang during startup and change it if needed.
  window.Router = new Router({
    'root': '#view',
    'mode': 'electron',
    'langs': ['en', 'fr'],
    'defaultLang': 'en',
    'cacheViews': true,
    'currentLang': 'en',
    'models': models,
    'routes': [
      {
        "route": "/explore-music",
        "view": "explore-music.html"
      },
      {
        "route": "/search",
        "view": "search.html"
      },
      {
        "route": "/playlists",
        "view": "playlists.html"
      },
      {
        "route": "/playlist/:id",
        "view": "playlist.html",
        "model": "playlist",
        "parent": "/playlists"
      },
      {
        "route": "/artists",
        "view": "artists.html"
      },
      {
        "route": "/artist/:id",
        "view": "artist.html",
        "model": "artist",
        "parent": "/artists"
      },
      {
        "route": "/music-releases",
        "view": "music-releases.html"
      },
      {
        "route": "/music-release/:id",
        "view": "music-release.html",
        "model": "music-release",
        "parent": "/music-releases"
      },
      {
        "route": "/tracks",
        "view": "tracks.html"
      },
      {
        "route": "/music-genres",
        "view": "music-genres.html"
      },
      {
        "route": "/music-genre/:id",
        "view": "music-genre.html",
        "model": "music-genre",
        "parent": "/music-genres"
      },
      {
        "route": "/home-cinema",
        "view": "home-cinema.html"
      },
      {
        "route": "/tv",
        "view": "tv.html"
      },
      {
        "route": "/movies",
        "view": "movies.html"
      },
      {
        "route": "/cinema-genres",
        "view": "cinema-genres.html"
      },
      {
        "route": "/channels",
        "view": "channels.html"
      }
    ]
  })

  // if the env is electron, we can use IPC to get the i18n strings now. we need
  // them sooner in this env for offline usage. the web app will load them over
  // http.
  if (env === 'electron') {
    window.i18n = await window.Bridge.ipcAsk('get-i18n')
  }
  
  // the app renders itself upon injection
  document.getElementById('root').innerHTML = `<music-app id="app" env="${env}"></music-app>`
}

initTheme()