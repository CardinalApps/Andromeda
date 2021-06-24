/**
 * @module Router
 */
 import { routeMatcher } from './route-matching-algorithm.js'

 // replace with vanilla js
 import __ from '../double-u/index.js'
 
 // TODO make this an injected dependency
 import { html, getFileContents } from '../html.js/index.js'
 
 /**
  * Router class for Echoes. The router only cares about it's #root and cannot
  * change any content outside of it (except for elements that are
  * `.router-link`).
  *
  * Routes will be matched in their given order.
  *
  * Hold cmd while clicking a link to perform a hard refresh of that view.
  *
  * TODO switch app lang when a route from another lang is requested, but that
  * action isn't possible (yet).
  */
 export class Router {
   constructor(options) {
     let requiredOptions = ['mode', 'root', 'routes', 'langs', 'defaultLang']
 
     requiredOptions.forEach((opt) => {
       if (!options.hasOwnProperty(opt)) throw new Error(`Router requires ${opt} on init`)
     })
 
     // TODO web compat begins here if this ever supports the web
     // if (this.mode === 'electron') {
     //   this.baseUrl = 'electron'
     // } else if (this.mode === 'web') {
     //   this.baseUrl = 'https://'
     // }
 
     this.mode = options.mode
     this.root = options.root
     this.buttonSelector = '.router-link'
     this.viewContentSelector = '.view-content'
     this.cacheViews = options.cacheViews || false
 
     this.givenRoutes = options.routes
     this.currentRoute = null
     this.currentHref = null
 
     this.models = 'models' in options ? options.models : {}
 
     this.langs = options.langs
     this.defaultLang = options.defaultLang
     this.currentLang = options.currentLang || options.defaultLang
 
     this._viewCache = {}
     this._history = []
     this._maxHistoryEntries = 50
     this._scrollTopDelay = 0 // when a view is loaded from the cache, wait (in ms) before attempting to scroll to the previous scrollTop
 
     // custom elements needs to know if the view was loaded from the cache so that they can decide if they
     // need to render themselves
     this.currentViewWasLoadedFromCache = null
 
     // as the user goes back and forth, this keeps track of their current position in the history array
     this._currentIndexInHistory = 0
 
     // whenever a view is loaded, its parameters are saved here. for example, when the href
     // `/albums/121` is loaded, this object will look like `{id: 121}`. Models will access this data. Custom 
     // elements can technically access this too, but are forbidden from doing so because it would effictively
     // skip the model, which goes against the MVC design.
     this.currentViewParams = {}
 
     // this can be set to true to force the router to not cache the current view when the user navigates away from it.
     // it will automatically be set back to "false" after one navigation.
     this._dontCacheCurrentViewOnNavAway = false
 
     this.consoleColor = '#47aac9'
 
     // register router event handlers
     this._registerEventHandlers()
     
     // build the routes reference that's used internally
     this._buildRoutesReference()
 
     // build an object of routes to models for convienence
     this._buildModelsObject()
 
     // build an object of routes to views for convienence
     this._buildViewsObject()
   }
 
   /**
    * Performs a regular navigation towards a href. Using this method will always add
    * a histroy entry in the Router. This is not the same as `forward()`; this will set
    * `currentIndexInHistory` to the last item and it will overwrite any items that may have 
    * been "in front".
    * 
    * For example, if you opened the app, visited five views, then pressed back twice, the
    * history would look like this:
    * 
    *     ['/albums', '/artist/34', '/album/10', '/explore', '/albums/7']
    *                                    ^ you are here
    * 
    * And then, instead of going "forward" you navigated regularly (eg. clicking a link), the
    * history would now look like this:
    * 
    *     ['/albums', '/artist/34', '/album/10', '/track/50']
    *                                                 ^ you are here
    */
   go(href, hardRefresh = false) {
     return new Promise(async (resolve, reject) => {
 
       if (href === undefined) throw new Error('Router.go() requires a URL')
 
       let validHref = this._isValidHref(href)
 
       if (validHref === false) throw new Error('Route is invalid')
 
       // when soft refreshing, do nothing if trying to navigate to the current href
       if (!hardRefresh && href === this.currentHref) return
 
       this._saveScrollTopBeforeNavAway()
 
       // valid route that aren't currently viewing? load it
       await this._loadRoute(validHref.route, href, validHref.params, hardRefresh)
 
       // in the event that go() was invoked after the user had stepped back in history multiple times,
       // this will overwrite all the "forward" steps
       if (this._currentIndexInHistory < this._history.length - 1) {
         // + 1 because the 'end' param of slice is non inclusive
         this._history = this._history.slice(0, this._currentIndexInHistory + 1)
       }
 
       // add the item to the history
       this._addToHistory(href)
 
       // set current step to the last step
       this._currentIndexInHistory = this._history.length - 1
 
     })
   }
 
   /**
    * Refreshes the current route.
    * 
    * @param {boolean} [hardRefresh] - Defaults to `true`.
    */
   refresh(hardRefresh = true) {
     this.go(this.currentHref, hardRefresh)
   }
 
   /**
    * Navigates to a route in the history. Has no effect if you're already on the oldest view.
    * 
    * @param {number} [steps=1] - The number of steps to go back. Default is 1.
    */
   async back(steps = 1) {
     // move back a number of steps from our current position in history
     let stepToLoad = this._currentIndexInHistory - steps
     
     // can't go that far back. do nothing
     if (stepToLoad < 0) {
       return
     }
 
     let hrefToLoad = this._history[stepToLoad].href
     let routeObj = this._isValidHref(hrefToLoad)
 
     this._saveScrollTopBeforeNavAway()
 
     await this._loadRoute(routeObj.route, hrefToLoad, routeObj.params)
 
     // update the index reference
     this._currentIndexInHistory = stepToLoad
 
     this._setScrollTop()
   }
 
   /**
    * Navigates forward through the history. Has no effect if you're already on the latest view.
    * 
    * @param {number} [steps=1] - The number of steps to go forward. Default is 1.
    */
   async forward(steps = 1) {
     // move forward a number of steps from our current position in history
     let stepToLoad = this._currentIndexInHistory + steps
         
     // can't go further than the length of the array
     if (stepToLoad > this._history.length - 1) {
       return
     }
 
     let hrefToLoad = this._history[stepToLoad].href
     let routeObj = this._isValidHref(hrefToLoad)
 
     this._saveScrollTopBeforeNavAway()
 
     await this._loadRoute(routeObj.route, hrefToLoad, routeObj.params)
 
     // update the index reference
     this._currentIndexInHistory = stepToLoad
 
     this._setScrollTop()
   }
 
   /**
    * Sets the scroll top of the view content with an optional delay.
    *
    * @param {number} [historyIndex] - The array index of the history entry whose
    * scrollTop to use. Defaults to the current index.
    * @ignore
    */
   _setScrollTop(historyIndex = null) {
     if (historyIndex === null) historyIndex = this._currentIndexInHistory
 
     // always wait until end of tick
     setTimeout(() => {
       document.querySelector(this.viewContentSelector).scrollTop = this._history[historyIndex].scrollTop
     }, this._scrollTopDelay)
   }
 
   /**
    * Uses the given routes to build the routes object used internally by the router.
    * 
    * @ignore
    */
   _buildRoutesReference() {
     let routesReference = []
 
     for (let singleRouteObj of this.givenRoutes) {
       for (let lang of this.langs) {
         // href includes a leading slash
         routesReference.push({
           'route': `/${lang}${singleRouteObj.route}`,
           'view': singleRouteObj.view,
           'parent': singleRouteObj.parent || null
         })
       }
     }
 
     this.routes = routesReference
   }
 
   /**
    * Uses the given routes to build an object of views and their associated route.
    * 
    * @ignore
    */
   _buildViewsObject() {
     let viewsObject = {}
 
     for (let singleRouteObj of this.givenRoutes) {
       for (let lang of this.langs) {
         viewsObject[`/${lang}${singleRouteObj.route}`] = singleRouteObj.view
       }
     }
 
     this.viewsObject = viewsObject
   }
 
   /**
    * Uses the given routes to build an object of models and their associated route.
    * 
    * @ignore
    */
   _buildModelsObject() {
     let modelsObject = {}
 
     for (let singleRouteObj of this.givenRoutes) {
       for (let lang of this.langs) {
         if (singleRouteObj.model !== undefined) {
           modelsObject[`/${lang}${singleRouteObj.route}`] = singleRouteObj.model
         }
       }
     }
 
     this.modelsObject = modelsObject
   }
 
   /**
    * Checks the given href against all possible routes in the Router, but stops after the first valid match.
    * If a valid route is found, this will extract the params.
    * 
    * @param {string} - A href, language optional. Eg. `/artists/121`.
    * @return {(object|boolean)} Null if the href is not valid, otherwise an object containing route data.
    * @ignore
    */
   _isValidHref(href) {
     if (href === undefined || href === '' || typeof href !== 'string') {
       return false
     }
 
     // if the first part of the href isn't a langugage, set it to the current language
     if (!this.langs.includes(href.split('/')[1])) {
       href = '/' + this.currentLang + href
     }
 
     for (let possibleRoute of this.routes) {
       let result = routeMatcher(possibleRoute.route).parse(href)
 
       if (result !== null) {
         // convert "id" results to integers
         for (let key in result) {
           if (key === 'id') {
             result[key] = parseInt(result[key])
           }
         }
 
         return {
           'href': href,
           'route': possibleRoute.route,
           'params': result
         }
       }
     }
 
     console.warn('Invalid href:', href)
 
     return false
   }
 
   /**
    * Invoked by `go()`, `back()`, and `forward()` to update the UI with the new route content.
    * 
    * Does these things:
    * - Removes the contents of the root element
    * - Removes all open context menus
    * - Sets/updates the `lang` attr of `<html>`
    * - Executes the model logic if there is a model for the route
    * - Gets the new view markup from either the cache or the .html file and injects it
    * - Updates `Router.params`, `Router.currentRoute`, `Router.currentViewWasLoadedFromCache`
    * - Manages the active state of all `.router-link`s in the document
    * - Sets the current route on the root.
    * 
    * @param {string} route - The route.
    * @param {string} href - The href that triggered this route load. This will not validate the href, it's
    * only for updating the .router-link's. Use `Router.go()` for href validation.
    * @param {object} params - Route parametes as parsed by the algo. They will get added as attributes to #view.
    * @param {boolean} hardRefresh - Set to true to forcefully reload the view HTML from the file.
    * @ignore
    */
   async _loadRoute(route, href, params, hardRefresh = false) {
     return new Promise(async (resolve, reject) => {
 
       if (Bridge.appDebug) {
         console.log(`%cLoading route: ${route}, hardRefresh: ${hardRefresh}`, `color:${this.consoleColor};`)
       }
     
       // cache the old view if there was one and caching is enabled. the only time there isn't one is on app init
       if (this.cacheViews && this.currentHref !== null) {
         // maybe block this cache attempt
         if (this._dontCacheCurrentViewOnNavAway) {
           this._dontCacheCurrentViewOnNavAway = false // reset the bool
         } 
         // the cache attempt was not blocked
         else {
           this._viewCache[this.currentHref] = __(this.root).el().innerHTML
         }
       }
 
       // remove everything from the view root
       __(this.root).removeChildren()
 
       // close all context menus
       if ('ContextMenu' in window) {
         ContextMenu.closeAllContextMenus()
       }
 
       // set the lang
       __('html').attr('lang', route.split('/')[1])
       
       // set the current view params in the router
       this.currentViewParams = params
 
       let viewFile = this.viewsObject[route]
       let viewHtml = ''
 
       // if the view cache is enabled and exists for this view and we are NOT hard refreshing, use the cached html
       if (this.cacheViews && href in this._viewCache && !hardRefresh) {
         //if (Bridge.appDebug) console.log('%cLoading view from cache', `color:${this.consoleColor};`)
 
         viewHtml = this._viewCache[href]
         this.currentViewWasLoadedFromCache = true
       }
       // else load the view from the html file
       else {
         //if (Bridge.appDebug) console.log('%cLoading view from file', `color:${this.consoleColor};`)
 
         viewHtml = await getFileContents(`/views/${viewFile}`)
         let modelData = null
       
         // maybe load the model
         if (this.modelsObject[route]) {
           let modelName = this.modelsObject[route]
           modelData = await this.models[modelName]() // execute the model function
         }
 
         // if there is a model returned data, make the data available to the view while parsing the view template
         if (modelData) {
           viewHtml = await html(viewHtml, modelData)
         } else {
           viewHtml = await html(viewHtml)
         }
 
         this.currentViewWasLoadedFromCache = false
       }
 
       // insert the view html into the DOM
       __(this.root).html(viewHtml)
 
       // set current route and href
       this.currentRoute = route
       this.currentHref = href
 
       // find all the router links for this route and add the active class to them
       this._setRouterLinkActiveStates()
 
       // set the current route on the root element
       __(this.root).attr('data-current-route', route)
 
       resolve()
 
     })
   }
 
   /**
    * Finds all router links in the DOM and updates their state according to the current route.
    * 
    * @ignore
    */
   _setRouterLinkActiveStates() {
     // remove active state of all router links
     __(this.buttonSelector).removeClass('active')
 
     // set active state on the links for this exact route
     __(`${this.buttonSelector}[href="${this.currentHref}"]`).addClass('active')
 
     // create an object of routes with parents for easy lookup
     let routesAndTheirParents = {}
 
     for (let routeObj of this.routes) {
       routesAndTheirParents[routeObj.route] = routeObj.parent
     }
     
     // find all the parents of this route
     let parentChain = []
 
     // recursive function that looks in the routesWithParents object and creates a parent chain.
     // childRoute must have the lang
     const recursiveParentLookup = (childRoute) => {
       let parentRouteWithoutLang = routesAndTheirParents[childRoute]
 
       if (parentRouteWithoutLang) {
         parentChain.push(parentRouteWithoutLang)
         recursiveParentLookup('/' + this.currentLang + parentRouteWithoutLang)
       }
     }
 
     // modify parentChain in place
     recursiveParentLookup(this.currentRoute)
 
     if (parentChain.length) {
       for (let routeWithoutLang of parentChain) {
         __(`${this.buttonSelector}[href="${routeWithoutLang}"]`).addClass('active')
       }
     }
   }
 
   /**
    * Adds a href to the internal history and ensures that the array does not exceed this._maxHistoryEntries.
    * 
    * @param {string} href - Href to add.
    * @ignore
    */
   _addToHistory(href) {
     let historyObj = {
       'href': href,
       'scrollTop': 0 // this gets updated when the user scrolls *away* from the current view
     }
 
     // add an entry to the history
     this._history.push(historyObj)
 
     // if the array is now over the limit, grab the last n entires
     if (this._history.length + 1 > this._maxHistoryEntries) {
       this._history = this._history.slice(-Math.abs(this._maxHistoryEntries))
     }
   }
 
   /**
    * This is called before the router navigates away from the current view; it will save the current
    * scrollTop so that it can be used when navigating back to this item in the history.
    * 
    * @ignore
    */
   _saveScrollTopBeforeNavAway() {
     let viewContent = document.querySelector(this.viewContentSelector)
 
     // on the first load, the element might not exist yet
     if (!viewContent) return
 
     // directly update the last history entry
     this._history[this._currentIndexInHistory].scrollTop = viewContent.scrollTop
   }
 
   /**
    * Registers the event handlers that the router listens for.
    * 
    * @ignore
    */
   _registerEventHandlers() {
     let router = this
 
     // this will capture raw mousebutton 4 and 5, which is what is fired when users have a
     // non apple mouse, aren't using btt to remap, and aren't using ssb
     document.addEventListener('mousedown', (event) => {
       if (event.which === 4) {
         this.back()
       } else if (event.which === 5) {
         this.forward()
       }
     })
 
     // this is only to support magic mouse back/forward
     let lockSwipe = false
     let swipeTimeout
 
     document.addEventListener('mousewheel', (event) => {      
       // small threshold to allow for sloppy up/down swiping
       if (event.wheelDeltaX < -200 || event.wheelDeltaX > 200) {
         if (lockSwipe) return
         
         lockSwipe = true // lock up this listener to prevent event spam
         let direction = (event.wheelDeltaX > 0) ? 'back' : 'forward'
 
         if (direction === 'back') {
           this.back()
         } else if (direction === 'forward') {
           this.forward()
         }
 
         // timeout will unlock the listener after 750 ms. any lower and we risk rapidfire events
         // because of mousehwheel inertia, and apple sure does love their inertia
         swipeTimeout = setTimeout(() => {
           console.log('%cunlocking swipe', `color:${this.consoleColor};`)
           lockSwipe = false
         }, 750)
       }
     })
 
     // on click of .router-link
     __(this.buttonSelector).on('click', true, function(event) {
       event.preventDefault()
 
       // left click
       if (event.button === 0) {
         let hardRefresh = false
 
         // on macOS, cmd+click = hard refresh. on all other systems, it's ctrl+click
         if (__('#app').attr('os') === 'darwin') {
           hardRefresh = event.metaKey
         } else {
           hardRefresh = event.ctrlKey
         }
 
         router.go(__(this).attr('href'), hardRefresh)
       }
     })
 
     // support spacebar when focused
     __(this.buttonSelector).on('keyup', function(event) {
       if (event.code === 'Space') {
         __(this).trigger('click')
       }
     })
   }
 
   /**
    * Changes the langugage and erases all cache.
    */
   setLang(lang) {
     this.deleteViewCache()
     this.deleteHistory()
 
     __('html').attr('lang', lang)
     this.currentLang = lang
   }
 
   /**
    * Deletes all navigation history for this session.
    */
   deleteHistory() {
     this._history = []
   }
 
   /**
    * Deletes all internal view cache for this session.
    */
   deleteViewCache() {
     this._viewCache = {}
 
     // when another part of the app deletes the view cache, it is implicitly asking the router to
     // also not cache the current view when the current page is navigated away.
     this._dontCacheCurrentViewOnNavAway = true
   }
 }