/**
 * @module double-u
 * @typicalname __
 */

/**
 * Factory function.
 * 
 * @param {*} selector - Selector for `__Object` constructor.
 */
export function __(selector) {
  return new __Object(selector)
}

/**
 * Returns a new __Object for chaining.
 *
 * @param {*} selector
 * @returns {__Object}
 */
export class __Object {
  /**
   * Constructor.
   *
   * @param {*} selector - CSS3 selector, Element, DocumentFragment, NodeList,
   * or an array of Elements.
   * @returns {__Object}
   */
  constructor(selector) {
    // allow an empty __Object so that some helpers can still be used, eg.
    // .isJSON(), .watch(). etc
    if (!selector) return

    // save the given selector
    this.selector = selector

    // the string 'document' means the document
    if (selector === 'document') {
      this.els = [document]
    }
    // the string 'window' means the window
    else if (selector === 'window') {
      this.els = [window]
    }
    // if only a single DOM element was given
    else if (selector instanceof Element) {
      this.els = [selector]
    }
    // if a NodeList was given
    else if (NodeList.prototype.isPrototypeOf(selector)) {
      this.els = selector
    }
    // if a document fragment was given
    else if (selector instanceof DocumentFragment) {
      this.els = [selector]
    }
    // if an array of Elements was given
    else if (Array.isArray(selector) && selector.length) {
      let allItemsAreElements = true

      for (let item of selector) {
        if (!(item instanceof Element)) {
          allItemsAreElements = false
        }
      }

      // all items must be Elements
      if (allItemsAreElements) {
        this.els = selector
      }
    }
    // if it's an empty array
    else if (Array.isArray(selector) && !selector.length) {
      this.els = []
    }
    // everything else goes though .querySelectorAll()...
    else {
      // ...except instances of __Object, which are not accepted
      if (selector instanceof __Object) {
        throw new Error(`You cannot create new __Object's using exisitng __Object's. The given __Object has the selector: ${selector.selector}`)
      }

      this.els = Array.from(document.querySelectorAll(selector))
    }
  }

  /**
   * Run a callback on each element in the __Object. Does not forbid looping an
   * empty set of elements.
   *
   * @param {Function} callback - The callback function to run.
   */
  each(cb) {
    // not checking for empty array, this is to allow loops on empty arrays
    if (this.els === undefined || this.els === null)
      throw new Error(`Cannot loop elements within __Object. The invalid selector is: ${this.selector}`)

    if (!cb || typeof cb !== 'function')
      throw new Error('Cannot loop elements within __Object. Check your callback function.')

    for (let i = 0; i < this.els.length; i++) {
      cb(this.els[i], i)
    }

    return this
  }

  /**
   * Returns the first element from the `__Object.els` array. Useful for when
   * the Element itself is needed for invoking class (custom element) methods.
   * Since the typical use case for this is something like
   * `__('custom-element').el().classMethod()`, this will warn you if the
   * `__Object.els` array contains more than a single item, or if that item is
   * not an Element.
   *
   * @returns {Element} The first item in the __Object
   */
  el() {
    if (!this.els.length) {
      console.warn('.el() was called on an __Object that has no items')
      return undefined
    }

    if (this.els.length !== 1) {
      console.warn('.el() was called on an __Object that has more than 1 item')
    }

    if (!(this.els[0] instanceof Element)) {
      console.warn('.el() returned an item that was not an Element')
    }

    return this.els[0]
  }

  /**
   * Registers event handlers for a given selector. If the selector matches any
   * DOM nodes, the event handler will be attached directly to those nodes. This
   * means that something like __('a.link').on('click') will only work for the
   * `a.link`'s that exist in the DOM at the time `.on()` was run. 
   *
   * To alleviate this and have the event hander work for all current and future
   * DOM nodes, set `forceDelegation` to true. This will instead defer the event
   * handler to the `document`.
   *
   * If the given CSS selector does not match any DOM nodes, the event hander
   * will automatically be delegated.
   *
   * Within the callback function, `this` is equal to the target Element.
   *
   * **Notice**: Delegated events do not support `mouseenter`, use `mouseover`
   * instead. This is a caveat of delegating to document instead of defining a
   * parent element each time. Full explanation in source code.
   *
   * **Notice**: There is a maximum of 1 delegated callback function per
   * selector. That means that if this method is used like
   * `__('a.link').on('click', true, cb1)`, and then later on again as
   * `__('a.link').on('click', true, cb2)`, only the callback function given in
   * the first usage will fire (`cb1`). This behavior is by design, and keeps
   * the door closed to blindly delegating all events to the document and
   * bloating each event with unnecessary checks. The goal is to attach events
   * to their proper Element instance when possible.
   *
   * All callbacks are stored in `window.__delegations`.
   *
   * @param {string} eventType - The type of event to listen for, ie. "click",
   * "submit", "keydown" etc.
   * @param {(boolean|Function|Element)} [forceDelegation] - If `true`, this
   * automatically defers to the `document`. If an Element, the event will be
   * attached to that Element. Or the callback function.
   * @param {Function} cb - The callback function when forcing delegation.
   *
   * TODO this needs to be refactored, it's now convoluted after dozens of small
   * edits
   */
  on(eventType, forceDelegation, thirdArg) {
    let cb

    // window.__delegations holds the functions given to on() that waits for the event to trigger them
    if (typeof window.__delegations !== 'object') {
      window.__delegations = {}
    }

    // window.__delegationForwarders holds references to the "proxy" functions that get attached to
    // the document, and listen for the delegated events to see if they match the delegated element selectors,
    // and if so, forwards the event to the appropiate functions in window.__delegations
    if (typeof window.__delegationForwarders !== 'object') {
      window.__delegationForwarders = {}
    }

    // callback can be given as the 2nd or 3rd arg
    if (typeof forceDelegation === 'function') {
      cb = forceDelegation
      forceDelegation = false
    } else if ((typeof forceDelegation === 'boolean' || forceDelegation instanceof Element) && typeof thirdArg === 'function') {
      cb = thirdArg
    }

    // will hold all of the DOM nodes that will get this event attached to them
    let attachTo = []
    let deferredToDocument = false
    let deferredToParentElement = false

    // if we are explicitly delegating
    if (forceDelegation instanceof Element || forceDelegation === true) {
      deferredToParentElement = true

      if (forceDelegation instanceof Element) {
        attachTo = [forceDelegation]
      } else {
        attachTo = [document]
      }
    }
    // we aren't explicitely delegating, but the given query selector may match nothing and still require delegation
    else {
      // if the set of elements contains Elements, we'll attach directly to them
      if (this.els.length) {
        // a single element was given
        if (this.els.length === 1 && this.els[0] instanceof Element) {
          attachTo = [this.els[0]]
        } 
        // a NodeList was given
        else if (this.els instanceof NodeList) {
          attachTo = Array.from(this.els)
        } 
        // an array was given, assume array of elements
        else if (Array.isArray(this.els)) {
          attachTo = this.els
        }
      }
      // if the selector matched nothing in the DOM, delegate
      else {
        deferredToParentElement = true
        attachTo = [document] // TODO change this to fullsize-app
      }
    }

    // if we are deferring to the document
    if (deferredToDocument) {
      // the document won't listen for a certain event type (eg. click, hover) until at least 1 deferred event handler has been
      // registered. this will register that listener when the first listener for an event type is encountered.
      if (!window.__delegations.hasOwnProperty(eventType)) {
        window.__delegations[eventType] = []
        
        // attach an eventListener to `document` listening for the event type
        // there is only ONE listener for each eventType on document. on that event type, it checks the real target.
        for (let deferredTo of attachTo) {
          // the "proxy" function
          const forwarderFunction = (event) => {
            // check if any handler selectors match the element that fired this event
            for (let deferredItem of window.__delegations[eventType]) {
              // Caveat: 'mouseenter' would be deferred to window.document like all other events, which would trigger
              // immediately every time the mouse enters the browser, which ends the 'mouseenter' callback
              // before the mouse can reach the real element. Using 'mouseover' instead ensures that the deferred callback
              // checks for every element it passes over, not just the first one it entered.
              // Caveat 2: 'document' doesn't have a .matches() method, so this will also catch other problematic events,
              // but so far the only one is 'mouseenter'.
              if (event.target === document) {
                console.warn('Problematic delegated event:', eventType)
                continue
              }

              let matches = false
              let realElementOfDeferredHandler

              // if the exact element interacted with is the target element
              if (event.target.matches(deferredItem.selector)) {
                matches = true
                realElementOfDeferredHandler = event.target
              }

              // if the exact element interacted with is the child of the target element (simulated bubble)
              let parentMatches = __(event.target).parents(deferredItem.selector)

              if (parentMatches.els.length) {
                matches = true

                if (parentMatches.els.length === 1) {
                  realElementOfDeferredHandler = parentMatches.els[0]
                } else {
                  realElementOfDeferredHandler = parentMatches.els
                }
              }

              // trigger the callback if this delegated event target matches the real event target of this delegated event
              if (matches) {
                //console.log('found match for', deferredItem.selector, `on ${eventType} of`, event.target)
                //console.log(event)
                //deferredItem.cb(event)
                deferredItem.cb.call(realElementOfDeferredHandler, event)
              }
            }
          }

          window.__delegationForwarders[eventType] = forwarderFunction
          deferredTo.addEventListener(eventType, forwarderFunction)
        }
      }

      // don't add duplicates selectors
      for (let handler of window.__delegations[eventType]) {
        if (handler.selector === this.selector) {
          throw new Error('Spaghetti error: You tried to add a duplicate delegated event handler, maybe try to remove the old one first? Selector: ' + handler.selector, eventType)
        }
      }
      
      window.__delegations[eventType].push({
        selector: this.selector,
        cb: cb
      })
    }
    // if we are not deferring to the document, add a regular event listener on each element in the set of elements
    else {
      if (deferredToParentElement) {
        // attached to a parent element
        for (let matchedEl of attachTo) {
          matchedEl.addEventListener(eventType, (event) => {
            // if the exact target element is the desired element
            if (event.target.matches(this.selector)) {
              cb.call(event.target, event)
            }
            // simulated bubble
            else {
              let parent = event.target.closest(this.selector)
              if (parent) {
                cb.call(parent, event)
              }
            }
          })
        }
      } else {
        // regular event handlers
        for (let matchedEl of attachTo) {
          matchedEl.addEventListener(eventType, (event) => {
            cb.call(matchedEl, event)
          })
        }
      }
    }
  }

  /**
   * Removes an event handler that was delegated to the document by `on()`.
   * Note: the CSS selector must match exaclty when using `on()` and `off()`.
   * For example:
   *
   *     __('table tbody tr').on('click', true, cb)
   *     __('table tbody tr').off('click', cb) // works
   *
   *     __('table tbody tr').on('click', true, cb)
   *     __('table tr').off('click', cb) // doesn't work, even though the selector technically matches (some of) the same elements
   *
   * @param {string} eventType - The type of event to listen for, ie. "click",
   * "submit", "keydown" etc.
   * @param {Function} cb - The callback function that was delegated with
   * `on()`.
   */
  off(eventType, cb) {
    if (!(eventType in window.__delegations)) {
      throw new Error(`Trying to remove delegated event handler that doesn't exist: ${eventType}`)
    }

    for (let index in window.__delegations[eventType]) {
      let delegatedEvent = window.__delegations[eventType][index]

      if (delegatedEvent.selector === this.selector && cb === delegatedEvent.cb) {
        window.__delegations[eventType].splice(index, 1)
      }
    }
    
    // maybe remove the event property if there are no more events for it
    if (!window.__delegations[eventType].length) {
      delete window.__delegations[eventType]

      // also remove the listener on the document
      document.removeEventListener(eventType, window.__delegationForwarders[eventType])
    }
  }

  /**
   * Add a class to the elements.
   *
   * @param {...String} className - Any number of class names to add.
   */
  addClass(...args) {
    for (let className of args) {
      this.each((el) => {
        el.classList.add(className)
      })
    }

    return this
  }

  /**
   * Remove a class from the elements.
   *
   * @param {...String} className - Any number of class names to remove.
   */
  removeClass(...args) {
    for (let className of args) {
      this.each((el) => {
        el.classList.remove(className)
      })
    }

    return this
  }

  /**
   * Toggles a class on all of the elements.
   * 
   * @param {...String} className - Any number of class names to toggle.
   */
  toggleClass(...args) {
    for (let className of args) {
      this.each((el) => {
        if (el.classList.contains(className)) {
          el.classList.remove(className)
        } else {
          el.classList.add(className)
        }
      })
    }
  }

  /**
   * Checks if **any** of the elements in the set of elements has the given class.
   * 
   * @param {string} className - The class name to check for.
   * @return {boolean}
   */
  hasClass(className) {
    let matchFound = false

    this.each((el) => {
      if (el.classList.contains(className)) {
        matchFound = true
        return
      }
    })

    return matchFound
  }

  /**
   * Gets, creates, or edits an attribute on one or more elements.
   *
   * If no value is given, and the set only contains one element, the element's
   * attribute's value will be returned. If the attribute does not exist,
   * `undefined` will be returned. If if exists but is empty, then `null` will
   * be returned.
   *
   * If the set of elements contains multiple elements, an array of non-empty
   * attribute values will be returned.
   *
   * If a value is given, then the attribute is updated for each element in the
   * set.
   *
   * @param {string} name - The attribute name to get, create, or edit.
   * @param {Number} [value] - The value to set the attribute to. Chainable
   * when a value is given.
   * @returns {mixed} The attribute value, undefined if the attribute didn't
   * exist, and null if exists but is empty.
   */
  attr(name, value) {
    // if value is undefined, we are doing an attribute lookup
    if (value === undefined) {
      // if we only have 1 element in this __Object, then return its value
      if (this.els.length === 1) {
        // if attribute doesn't exist
        if (!this.els[0].hasAttribute(name)) {
          return undefined
        } else {
          let valueToReturn = this.els[0].getAttribute(name)

          if (typeof valueToReturn === 'string' && valueToReturn === '') {
            return null
          } else {
            return this._readAttrValue(valueToReturn)
          }
        }
      }
      // if the __Object contains more than 1 element, return an array of their attribute values
      else {
        let allValues = []

        this.each((el) => {
          if (el.hasAttribute(name) && el.getAttribute(name) !== '') {
            allValues.push(this._readAttrValue(el.getAttribute(name)))
          }
        })

        return allValues
      }
    }
    // if a value was given, we are setting that value to that attribute on each element
    else {
      this.each((el) => {
        el.setAttribute(name, this._prepareForAttr(value))
      })

      return this
    }
  }

  /**
   * Returns true if all Elements in the set of matched Elements has the given attribute, otherwise returns false.
   * **Not chainable.**
   * 
   * @param {string} attribute - The attribute name to check for.
   */
  hasAttr(attribute) {
    let result = true

    this.each((el) => {
      if (!el.hasAttribute(attribute)) {
        result = false
      }
    })

    return result
  }

  /**
   * Removes an attribute from the set of elements.
   *
   * @param {string} name - The attribute name to remove.
   */
  removeAttr(name) {
    this.each((el) => {
      el.removeAttribute(name)
    })

    return this
  }

  /**
   * This method will create MutationObserves that will watch for attribute
   * changes on each of the elements in the set of matched elements. **Not
   * chainable**. This was created in order to avoid rapidfire callback issues
   * when init-ing a custom element with static attributes.
   *
   * @param {array} attrs - An array of sttributes to watch.
   * @param {Function} cb - Callback on attribute change. The callback first
   * param is the array of mutations, and the second param is the Element who's
   * attributes were changed.
   */
  watchAttrs(attrs, cb) {
    this.each((el) => {
      let observer = new MutationObserver((mutations) => {
        cb(mutations, el)
      })
      
      observer.observe(el, {
        'attributes': true,
        'attributeOldValue': true,
        'attributeFilter': attrs
      })
    })
  }

  /**
   * Same as attr but for values on form fields.
   *
   * When used on an input[type="file"], it will look in where Electron saves
   * selected filepaths.
   *
   * @param {string} [value] - If present, this will update the value of all
   * Elements in the set of matches Elements.
   * @returns {(*|array|__Object)} If performing a lookup, this returns the
   * Element value, or an array of Element values. If setting the value, this
   * returns the __Object for chaining.
   *
   * TODO add radios
   */
  value(value) {
    // perform a lookup
    if (value === undefined) {
      let results = []

      this.each((el) => {
        // if file input, Electron adds a .files property to the Element
        if (el.matches('input[type="file"]')) {
          // if the FileList is not empty, return it
          if (el.files instanceof FileList && el.files.length) {
            results.push(el.files)
          }
          // if the file input has a data-value attribute
          else if (el.hasAttribute('data-value')) {
            results.push(el.getAttribute('data-value'))
          }
          // if no file is selected, return an empty string. this is more
          // consistent with textual inputs than returning undefined
          else {
            results.push('')
          }
        }
        // if checkbox
        else if (el.matches('input[type="checkbox"]')) {
          results.push(el.checked)
        }
        // if multi select
        else if (el.matches('select[multiple]')) {
          let checkedOptions = el.querySelectorAll('option:checked')
          for (let checkedOptionEl of Array.from(checkedOptions)) {
            results.push(checkedOptionEl.value)
          }
        }
        // all other field types have their value in the .value property
        else {
          results.push(el.value)
        }
      })

      if (!results.length) {
        return undefined
      }
  
      // unwrap the array if there's only a single result
      if (results.length === 1) {
        results = results[0]
      }

      return results
    }
    // set the value
    else {
      this.each((el) => {
        el.value = value
      })

      return this
    }
  }

  /**
   * Prepares a value for insertion into a DOM attribute.
   * 
   * @private
   */
  _prepareForAttr(value) {
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }

    return value
  }

  /**
   * Reads a value after being pulled from a DOM attribute, and converts it to an
   * object if needed.
   * 
   * @private
   */
  _readAttrValue(value) {
    if (value === null || value === undefined) {
      return value
    }

    // check if the string is a valid Number
    if (!isNaN(value)) {
      return Number(value)
    }

    let convertedJSON
    
    try {
      convertedJSON = JSON.parse(value)
    } catch (e) {
      // return original value if parse failed
      return value
    }

    return convertedJSON
  }

  /**
   * If a string is given, then that CSS property will be returned.
   *
   * If an object is given, key:value will be mapped to CSS property:value.
   * Converts CSS values that are numbers to a string ending in "px".
   *
   * **Overwrites the style attribute on every use.**
   *
   * @param {(object|string)} css
   * @returns {mixed} An array or a string when doing a lookup, or an __Object
   * when setting.
   */
  css(css) {
    // perform a lookup
    if (typeof css === 'string') {
      let found = []

      this.each((el) => {
        let prop = window.getComputedStyle(el)[css]

        if (typeof prop === 'string' && prop.includes('px')) {
          prop = Number(prop.replace('px', ''))
        }

        found.push(prop)
      })

      if (found.length === 1) {
        return found[0]
      } else {
        return found
      }
    }
    // we are setting the values
    else if (typeof css === 'object') {
      let str = ''

      for (let property in css) {
        let value = css[property]
  
        if (typeof value === 'number') {
          value = `${value}px`
        }

        str += `${property}:${value};`
      }
  
      this.each((el) => {
        el.setAttribute('style', str)
      })
  
      return this
    }
  }

  /**
   * Returns a new __Object of matching element children.
   * 
   * @param {string} selector
   * @returns {__Object} __Object instance
   */
  find(selector) {
    let results = []
    
    this.each((el) => {
      let found = el.querySelectorAll(selector)
      
      if (found.length) {
        results = [...results, ...found]
      }
    })

    return __(results)
  }

  /**
   * Gets the first child of every element in the given set of elements.
   *
   * @returns {__Object} A new __Object instantiated with the found first
   * childen, or null.
   */
  firstChild() {
    let firstChildren = []

    this.each((el) => {
      let firstElementChild = el.firstElementChild

      if (firstElementChild !== null) {
        firstChildren.push(firstElementChild)
      }
    })

    if (firstChildren.length) {
      return __(firstChildren)
    } else {
      return null
    }
  }

  /**
   * Gets the first child of every element in the given set of elements.
   *
   * @returns {__Object} A new __Object instantiated with the found first
   * childen, or null.
   */
  lastChild() {
    let lastChildren = []

    this.each((el) => {
      let lastElementChild = el.lastElementChild

      if (lastElementChild !== null) {
        lastChildren.push(lastElementChild)
      }
    })

    if (lastChildren.length) {
      return __(lastChildren)
    } else {
      return null
    }
  }

  /**
   * Returns all parent nodes matching a selector
   * 
   * @param {string} selector - Optional CSS3 selector to filter by
   */
  parents(selector) {
    let matchedParents = []

    this.each((el) => {
      if (el === document) {
        return this
      }

      let parentEl = el.parentElement

      while (parentEl !== null) {
        // if there's a selector to match
        if (selector !== undefined) {
          if (parentEl.matches(selector)) {
            matchedParents.push(parentEl)
          }
        }
        // no selector means we are getting all parents
        else {
          matchedParents.push(parentEl)
        }
        
        // make the parent of this parent the next parent to loop
        parentEl = parentEl.parentElement
      }
    })

    return __(matchedParents)
  }

  /**
   * Checks if any of the Elements in the matched set of Elements has the given
   * parent. **Not chainable.**
   *
   * @param {(Element|string)} givenParent - An Element, or a CSS string to
   * match against.
   * @returns {boolean}
   */
  hasParent(givenParent) {
    if (!this.els.length) throw new Error('Cannot call __().hasParent() on __Object without matched elements.')

    let parentMatch = false

    this.each((el) => {
      // match may have already been found with previous element
      if (parentMatch) return

      let parents = __(el).parents()

      // element has no parents
      if (!parents.els.length) return

      // check each parent element for a match against the given parent
      parents.each((parentEl) => {
        // if the given parent is an Element
        if (givenParent instanceof Element && givenParent === parentEl) {
          parentMatch = true
        }
        // if the given parent is a CSS string
        else if (typeof givenParent === 'string' && parentEl.matches(givenParent)) {
          parentMatch = true
        }
      })
    })

    return parentMatch
  }

  /**
   * Mimics the native Element.closest() method. If the set of Elements contains
   * more than one Element, each of their closest parent will be included in the
   * returned __Object.
   *
   * @param {string} selector - CSS selector for finding the closest parent.
   * @returns {__Object} A new __Object with the parental matches.
   */
  closest(selector) {
    let results = []
    
    this.each((el) => {
      let closest = el.closest(selector)

      if (closest) {
        results.push(closest)
      }
    })

    return __(results)
  }

  /**
   * Get the previous, next, or all siblings relative to a DOM element.
   *
   * @param {string} [direction] - `prev`, `next`, or `all`. Defaults to 'all'.
   * When `next` or `prev` are used, the given element will not be included in
   * the results (because you are not your own sibling). When 'all' is used (or
   * this param is omitted), the given selector will be included (because you
   * are a sibling among others).
   * @param {string} [selectorFilter] - Optionally filter the siblings with a
   * CSS3 filter.
   * @returns {__Object} An __Object for chaining.
   */
  siblings(direction, selectorFilter) {
    let siblings = []

    this.each((el) => {
      if (direction === 'prev') {
        siblings = [...siblings, ...this._getPrevSiblings(el, selectorFilter)]
      } else if (direction === 'next') {
        siblings = [...siblings, ...this._getNextSiblings(el, selectorFilter)]
      } else if (direction === 'all') {
        siblings = [...siblings, ...this._getAllSiblings(el, selectorFilter)]
      }
      // for when no params at all are passed
      else {
        siblings = [...siblings, ...this._getAllSiblings(el)]
      }
    })

    return __(siblings)
  }

  /**
   * Used interally to find all element siblings relative to a node. Use
   * `siblings()` publically instead.
   *
   * @private
   * @param {Element} el - A DOM node
   * @param {string} selectorFilter - Optionally filter with a CSS3 selector.
   * @returns {array} An array of Elements ordered by their position relative to
   * the parent. Includes the given element.
   */
  _getAllSiblings(el, selectorFilter) {
    return [
      ...this._getPrevSiblings(el, selectorFilter).reverse(),
      el,
      ...this._getNextSiblings(el, selectorFilter)
      ]
  }

  /**
   * Used interally to find all element siblings that come before a node. Use
   * `siblings()` publically instead.
   *
   * @private
   * @param {Element} el - A DOM node
   * @param {string} selectorFilter - Optionally filter with a CSS3 selector.
   * @returns {array} An array of Elements in order from closest to furthest.
   */
  _getPrevSiblings(el, selectorFilter) {
    let siblings = []
    let prevSibling = el.previousElementSibling

    while (prevSibling) {
      // maybe filter by css3 selector
      if (selectorFilter !== undefined) {
        if (prevSibling.matches(selectorFilter)) {
          siblings.push(prevSibling)
        }
      } else {
        siblings.push(prevSibling)
      }

      prevSibling = prevSibling.previousElementSibling
    }

    return siblings
  }

  /**
   * Used interally to find all element siblings that come after a node. Use
   * `siblings()` publically instead.
   *
   * @private
   * @param {Element} el - A DOM node
   * @param {string} selectorFilter - Optionally filter with a CSS3 selector.
   * @returns {array} An array of Elements in order from closest to furthest.
   */
  _getNextSiblings(el, selectorFilter) {
    let siblings = []
    let nextSibling = el.nextElementSibling

    while (nextSibling) {
      // maybe filter by css3 selector
      if (selectorFilter !== undefined) {
        if (nextSibling.matches(selectorFilter)) {
          siblings.push(nextSibling)
        }
      } else {
        siblings.push(nextSibling)
      }

      nextSibling = nextSibling.nextElementSibling
    }

    return siblings
  }

  /**
   * Removes all elements in the set from the DOM. Not chainable.
   */
  remove() {
    this.each((el) => {
      el.remove()
    })
  }

  /**
   * Delete all the child nodes of each element in the set.
   * 
   * @returns {__Object} Returns the same __Object instance.
   */
  removeChildren() {
    this.each((el) => {
      el.innerHTML = ''
    })

    return this
  }

  /**
   * Replaces the .innerHTML of each element in the set of elements.
   * 
   * @content {string} content - HTML string.
   */
  html(content) {
    this.each((el) => {
      el.innerHTML = content
    })

    return this
  }

  /**
   * Replaces the .innerText of each element in the set of elements.
   * 
   * @content {string} content - String.
   */
  text(content) {
    this.each((el) => {
      el.innerText = content
    })

    return this
  }

  /**
   * Alias for _insertHtml().
   * 
   * @returns {__Object}
   * @since 0.0.1
   */
  prependHtml(template) {
    return this._insertHtml(template, 'prepend')
  }

  /**
   * Alias for _insertHtml().
   * 
   * @returns {__Object}
   * @since 0.0.1
   */
  appendHtml(template) {
    return this._insertHtml(template, 'append')
  }

  /**
   * Inserts HTML markup before each element in the matched set of elements, or
   * returns all of the directly preceeding elements of all the elements in the
   * set of matched elements.
   *
   * @param {string} [markup]
   * @returns {__Object}
   */
  before(markup) {
    if (markup) {
      return this._insertHtml(markup, 'before')
    }

    let prevSiblings = []

    this.each((el) => {
      prevSiblings.push(el.previousElementSibling)
    })

    return __(prevSiblings)
  }

  /**
   * Inserts HTML markup after each element in the matched set of elements, or
   * returns all of the directly next elements of all the elements in the set of
   * matched elements.
   *
   * @param {string} markup
   * @returns {__Object}
   */
  after(markup) {
    if (markup) {
      return this._insertHtml(markup, 'after')
    }

    let nextSiblings = []

    this.each((el) => {
      nextSiblings.push(el.nextElementSibling)
    })

    return __(nextSiblings)
  }

  /**
   * Moves all of the Elements in the set of matched Elements to the reference
   * node given as the first parameter.
   *
   * @param {Element} destinationEl - Reference to the destination Element.
   * @param {string} position - `beforebegin`, `afterbegin`, `beforeend`,
   * `afterend`
   * @returns {__Object} Returns the original `__Object` that contains the
   * elements that were moved.
   */
  moveTo(destinationEl, position = 'afterbegin') {
    this.each((el) => {
      destinationEl.insertAdjacentElement(position, el)
    })

    return this
  }

  /**
   * Inserts a template literal, a document fragment, or a live Element node as
   * either the first or last children of an element.
   *
   * @param {Element} tempate - HTML string to nodes to insert.
   * @param {string} [position=prepend] - Prepend, append, before, or after.
   * @returns {mixed} - If the template was a string and position=append, then a
   * new __Object with the first child nodes of all the elements in the set.
   * Same for string template and prepending, but instead the last nodes. If a
   * document fragment was given, then nothing is returned.
   * @private
   */
  _insertHtml(template, position = 'prepend') {
    let newNodes = []

    this.each((el) => {
      if (position === 'prepend') {
        // prepend document fragment
        if (template instanceof DocumentFragment || template instanceof Element) {
          newNodes.push(el.insertBefore(template, el.firstChild))
        }
        // prepend html string
        else if (typeof template === 'string') {
          el.insertAdjacentHTML('afterbegin', template)
          newNodes.push(el.firstElementChild)
        }
      } else if (position === 'append') {
        // append document fragment
        if (template instanceof DocumentFragment || template instanceof Element) {
          newNodes.push(el.appendChild(template))
        }
        // append html string
        else if (typeof template === 'string') {
          el.insertAdjacentHTML('beforeend', template)
          newNodes.push(el.lastElementChild)
        }
      } else if (position === 'before') {
        // append html string
        if (typeof template === 'string') {
          el.insertAdjacentHTML('beforebegin', template)
          newNodes.push(el.previousElementSibling)
        }
      } else if (position === 'after') {
        // append html string
        if (typeof template === 'string') {
          el.insertAdjacentHTML('afterend', template)
          newNodes.push(el.nextElementSibling)
        }
      }
    })

    return __(newNodes)
  }

  /**
   * Wraps all elements in the set of elements with given text markup. Event
   * handers are preserved.
   *
   * @param {string} into - Text HTML, single dimensional.
   * @returns {__Object}
   */
  wrapInto(into) {
    this.each((el) => {
      // inject text markup into document fragment and pull it out
      let template = document.createElement('template')
      template.innerHTML = into
      
      // insert empty wrapper el before the el we are going to wrap
      el.parentNode.insertBefore(template.content, el)

      // move el into wrapper
      el.previousSibling.appendChild(el)
    })

    return this
  }

  /**
   * Removes an element from the DOM but keeps its children. Event handlers on the children are preserved.
   */
  unwrap() {
    this.each((el) => {
      let fragment = document.createDocumentFragment()

      while (el.firstChild) {
        fragment.appendChild(el.firstChild)
      }

      el.parentNode.replaceChild(fragment, el)
    })
  }

  /**
   * Standard library function that returns a random string from a pool of
   * characters. Can't be chained, and doesn't require any elements in `.els`.
   *
   * @param {Integer} length - Number of characters to return.
   * @param {string} pool - Valid characters for the string.
   */
  randomStr(length = 5, pool = 'abcdefghijklmnopqrstuvwxyz1234567890') {
    let arr = pool.split('')
    let picks = []

    for (let i = 1; i <= length; i++) {
      picks.push(arr[Math.floor(Math.random() * arr.length)])
    }

    return picks.join('')
  }

  /**
   * Standard library function that returns a random number between two numbers.
   *
   * @param {number} min - The lower boundary.
   * @param {number} max - The ligher boundary.
   */
  randomNumberBetween(min, max) {
    return Math.round(Math.random() * (max - min) + min)
  }

  /**
   * Returns a random item from an array.
   *
   * If the randomly selected item in the array is an `object` (and not null),
   * or an array, then a new clone of that object will be returned to avoid
   * having a reference to the pool object.
   *
   * All other data types are returned untouched.
   *
   * @param {array} array - An array with >=1 items.
   * @returns {*} Returns a random item from the array.
   */
  randomFromArray(array) {
    let chosen = array[Math.floor(Math.random() * array.length)]

    if (typeof chosen === 'object' && chosen !== null) {
      return {...chosen}
    } else if (Array.isArray(chosen)) {
      return [...chosen]
    } else {
      return chosen
    }
  }

  /**
   * Returns a single random item from a given object of odds.
   *
   * Example:
   * ```
   * // 2/20 chance of returing "rare", 18/20 chance of "common"
   * {
   *   'rare': '2/20',
   *   'common': '18/20'
   * }
   * ```
   *
   * Note: the fractions must add up to 1/1 and must all have the same
   * denominator. If not, the results will be unpredictable. If the string
   * "__UNFILLED__" is in the pool, your fractions don't add up to 1/1. You can
   * use the `returnPool` argument to examine the pool.
   *
   * @param {object} oddsObj - An object of items and their odds. Items must be
   * strings or numbers.
   * @param {boolean} returnPool - Whether to return the pool of items instead
   * of the results. Useful to test if the fractions are working properly.
   */
  odds(oddsObj, returnPool = false) {
    let pool = []
    let outOf = Object.values(oddsObj)[0].split('/').pop()

    // build an array that will get populated with items
    for (let i = 0; i <= outOf - 1; i++) {
      pool.push('__UNFILLED__')
    }

    if (returnPool) {
      return pool
    }

    let runningIndex = 0
    
    // replace all __UNFILLED__ items with real items
    for (let [item, odds] of Object.entries(oddsObj)) {
      let itemOdds = odds.split('/')[0]
      
      for (let i = 1; i <= itemOdds; i++) {
        pool[runningIndex] = item
        runningIndex++
      }
    }

    return this.randomFromArray(pool)
  }

  /**
   * Shuffles an array. The returned array is not guarenteed to be in a
   * different order than the given array. No element selector is required.
   *
   * https://stackoverflow.com/a/6274398/1595848
   *
   * @param {array} arrayToShuffle - The array to be shuffled.
   * @returns {array}
   */
  shuffle(arrayToShuffle) {
    let counter = arrayToShuffle.length

    while (counter > 0) {
      let index = Math.floor(Math.random() * counter)

      counter--

      let temp = arrayToShuffle[counter]
      arrayToShuffle[counter] = arrayToShuffle[index]
      arrayToShuffle[index] = temp
    }

    return arrayToShuffle
  }

  /**
   * Returns the contents of a HTML file. Only works in Electron.
   *
   * @param {string} path - The path to the template from the theme root.
   * @param {object} [replacement] - Additional merge tags for the HTML
   * template.
   * @param {boolean} [bypassCache] - Set to true to skip the cache and perform
   * the file lookup. Defaults to false.
   * 
   * TODO remove
   */
  getHtmlFromFile(path, replacements = {}, bypassCache = false) {
    return new Promise(async (resolve, reject) => {
      console.warn('Deprecated function. Switch to html.js.')
      return 'DEPRACATED'

      try {
        let fileContents = await this.getFileContents(path, bypassCache)
        let parsed = await html(fileContents, replacements)
        
        resolve(parsed)
      } catch (err) {
        console.warn(err)
        reject()
      }
    })
  }

  /**
   * Returns the contents of a .json file. Only works in Electron. This function
   * will **not** parse `{{}}` merge tags like `getHtmlFromFile()` does.
   *
   * @param {string} path - The path to the template from the theme root.
   * @param {boolean} [asString=false] - Return the string contents of the file
   * rather than parsing it.
   * @param {boolean} [flattened=false] - If asString is true, this can be used
   * to trim whitespace from the JSON string.
   * 
   * TODO remove
   */
  getJSONFromFile(path, asString = false, flattened = false, bypassCache = false) {
    return new Promise(async (resolve, reject) => {
      console.warn('Deprecated function. Switch to html.js.')
      return 'DEPRACATED'

      try {
        let fileContents = await this.getFileContents(path, bypassCache)
        
        // fileContents returns as a string with all whitespace, maybe return that
        if (asString && !flattened) {
          resolve(fileContents)
          return
        }

        let json = JSON.parse(fileContents.trim())
        
        // when returning a flattened string, the most reliable way is to convert to JSON and back again
        // instead of regexing the original fileContents string
        if (asString && flattened) {
          resolve(JSON.stringify(json))
          return
        }
        
        resolve(json)
      } catch (e) {
        console.log(e)
        throw new Error('JSON.parse error with file' + path)
      }
    })
  }

  /**
   * Returns the raw contents of a file. Will cache file contents after first
   * lookup in `window.__fileCache`.
   *
   * @param {string} path - File path from the theme root.
   * @param {boolean} bypassCache - Set to true to skip the cache and perform
   * the file lookup.
   * @returns {string}
   */
  getFileContents(path, bypassCache = false) {
    return new Promise((resolve, reject) => {
      if (typeof require !== 'function') {
        throw new Error('__ does not have access to the file system')
      }
      
      const fs = require('fs')
      
      if (typeof fs !== 'object') {
        throw new Error('__ does not have access to the file system')
      }

      if (!('__fileCache' in window)) {
        window.__fileCache = {}
      }

      if (!(path in window.__fileCache) || bypassCache) {
        try  {
          let fileContents = fs.readFileSync(__dirname + path, 'utf8')

          window.__fileCache[path] = fileContents
          
          resolve(fileContents)
        } catch (err) {
          console.warn(err)
          reject()
        }
      } else {  
        resolve(window.__fileCache[path])
      }
    })
  }

  /**
   * Returns the first `<template>` that matches the selector it finds in any of
   * the elments in the set. This is by design - this function only gets the
   * contents of a single <template> element.
   *
   * This function does not technically return the exact DocumentFragment from
   * the <template> element. Instead, it copies the <template>.innerHTML as a
   * string, and injects it into a new DocumentFragment. Otherwise, the
   * <template> would only have one use, because DocumentFragment nodes are
   * live.
   *
   * @param {string} [selector=] - Optional CSS3 selector for the template.
   * Usage with the selector looks like
   * '__('body').getTemplate('#some-template')'. Usage without the selector
   * looks like `__('#some-template').getTemplate()`
   */
  getTemplate(selector) {
    if (!this.els.length) {
      return null
    }

    let templateHtmlString = ''

    // using it like: __('#templateID').getTemplate()
    if (this.els[0].matches('template')) {
      templateHtmlString = this.els[0].innerHTML
    } else {
      // using it like: __('body').getTemplate('#some-template')
      for (let el of this.els) {
        let found = el.querySelector(`template${selector}`)

        if (found) {
          templateHtmlString = found.innerHTML
        }
      }
    }

    if (templateHtmlString === '') {
      console.warn(`Could not find <template> for given selector: ${selector}`)
      return null
    }

    return document.createRange().createContextualFragment(templateHtmlString)
  }

  /**
   * Expects a single Element in the set of matches elements. Returns its width.
   *
   * @returns {Number}
   */
  width() {
    if (this.els.length !== 1) throw new Error('__().width() expects exacly 1 item in the set of matches elements')

    return this.el().offsetWidth
  }

  /**
   * Expects a single Element in the set of matches elements. Returns its
   * height.
   *
   * @returns {Number}
   */
  height() {
    if (this.els.length !== 1) throw new Error('__().height() expects exacly 1 item in the set of matches elements')

    return this.el().offsetHeight
  }

  /**
   * Returns the x,y coordinates for an element on the page relative to the
   * window. Not chainable.
   *
   * @returns {(array|object)} - Either a pair of coordinates, or an array of
   * pairs, depending if multiple elements were given.
   */
  position() {
    if (this.els.length === 0) {
      return []
    }

    let coords = []

    this.each((el) => {
      let rect = el.getBoundingClientRect()

      coords.push({'x': rect.left, 'y': rect.top})
    })
    
    if (coords.length === 1) {
      return coords[0]
    }

    return coords
  }

  /**
   * Animates an element using CSS classes, and invokes the callback function
   * after. Can be chained, and the chain will be delayed while waiting for
   * animations to complete.
   *
   * @param {string} animation - Animate.css class name
   * @param {(Number|Function)} [speed] - "slow", "slower", "fast", "faster", or
   * "speed-1s" (1s through 5s)
   * @param {(Number|Function)} [delay] - "delay-1s", "delay-2s", "delay-3s",
   * "delay-4s", "delay-5s" 
   * @returns {Promise} A promise that resolves into an __Object
   */
  animate(animation, speed, delay) {
    return new Promise((resolve, reject) => {
      // for each element in the set, apply the animation classes and add a listener
      this.each((el) => {
        // remove previous animation data
        if (el.getAttribute('data-animation')) {
          el.classList.remove('animated', el.getAttribute('data-animation'))
        }

        let speedAttr = typeof speed === 'string' ? speed : undefined
        let delayAttr = typeof delay === 'string' ? delay : undefined

        if (speedAttr) {
          el.classList.add(speedAttr)
        }

        if (delayAttr) {
          el.classList.add(delayAttr)
        }

        // keep track of the animation that was used by saving it in a data attr
        el.setAttribute('data-animation', animation)
        el.classList.add('animated', animation)

        el.addEventListener('animationend', () => {
          el.classList.remove('animated', animation, speedAttr, delayAttr)
          resolve(this)
        })
      })
    })
  }

  /**
   * Shows all elements that match the given selector.
   * 
   * @param {string} display - The CSS 'display' attribute value.
   * @returns {__Object}
   */
  show(display = 'block') {
    this.each((el) => {
      el.style.display = display
    })
    
    return this
  }

  /**
   * Hides all elements that match the given selector.
   * 
   * @returns {__Object}
   */
  hide() {
    this.each((el) => {
      el.style.display = 'none'
    })

    return this
  }

  /**
   * This helper is designed to be the first thing invoked when singleton custom
   * elements are created in the DOM, and it will instantly remove the extra
   * copy of the element and show an error in the console so that the offending
   * code can be fixed.
   *
   * Make sure this is the first code called in the element init.
   *
   * @param {string} elName - Element name as a string, not an actual Element.
   * @param {Element} el - Reference to the custom element being created.
   * @returns {boolean} True if the element had to be deleted, false if nothing
   * had to be enforced.
   */
  enforceSingleton(elName, el) {
    // 2 because this will be called on custom element creation, and at that point the
    // original singleton will exist, and this extra copy will exist, but it's ok we are
    // about to delete it before it can render itself.
    if (__(elName).els.length === 2) {
      __(el).remove()
      console.error(`${elName} is a singleton custom element; an extra copy was blocked from being created.`)
      return true
    }

    return false
  }

  /**
   * Triggers a basic event for the given eventType.
   * 
   * @param {string} eventType - Click, keydown, etc.
   * 
   * TODO support keyboard events
   */
  trigger(eventType) {
    let simulated = new MouseEvent(eventType, {
      view: window,
      bubbles: true,
      cancelable: true
    })

    this.each((el) => {
      el.dispatchEvent(simulated)
    })
  }

  /**
   * Implements the workaround for the Electron Issue raised here:
   * https://github.com/electron/electron/issues/23435
   *
   * All file paths that go to the appdata folder to retreive an image that is
   * to be used in a CSS background-image must use this workaround in order to
   * load on Windows.
   *
   * TODO remove this when Electron is fixed.
   */
  __doubleSlashesOnWindowsOnly(str) {
    if (__('#app').attr('os') === 'win32') {
      return str.replace(/\\/g, '\\\\')
    }

    return str
  }

  /**
   * Converts a number of a seconds to hh:mm:ss.
   *
   * @param {number} seconds
   * @param {boolean} trimHours - Whether to trim the hours if they are 00.
   * @param {boolean} trimMinutes - Whether to trim the leading zero from
   * whatever time is returned.
   */
  convertSecondsToHHMMSS(seconds, trimHours = true, trimLeadingZero = true) {
    let date = new Date(null)
    date.setSeconds(seconds)
    let hhmmss = date.toISOString().substr(11, 8)

    // if less than 1 hour, trim the hours off
    if (trimHours && hhmmss.substr(0, 3) === '00:') {
      hhmmss = hhmmss.slice(3)
    }

    // trim leading 0 from the minutes
    if (trimLeadingZero && hhmmss[0] === '0') {
      hhmmss = hhmmss.slice(1)
    }

    return hhmmss
  }

  /**
   * Returns the values that intersect between two arrays.
   * 
   * Example: [1,5,8,17] and [3,5,8,14] returns [5,8]
   * 
   * @param {array} a - First array.
   * @param {array} b - Second array.
   * @returns {array}
   */
  getArrayIntersection(a, b) {
    return a.filter(value => b.includes(value))
  }

  /**
   * This function expects only a single Element in the set of matched Elements,
   * and it will add a scroll listener on `.view-content` that triggers the
   * given callback when it's time to load more content in the given Element.
   *
   * @param {Function} cb - Callback function.
   * @param {string} scrollParent - CSS selector for the element on which to
   * attach the scroll listener. Defaults to `.view-content`.
   * @returns {Function} Returns the scroll listener function, so that it can be
   * unregistered later.
   */
  infiniteScroll(cb, scrollParent = '.view-content') {
    if (this.els.length !== 1) throw new Error('__().infiniteScroll() expects exactly 1 Element in the set of matched Elements')

    const el = this.els[0]
    const viewEl = document.querySelector(scrollParent)
    const bottomOffset = 600

    const onScroll = (event) => {
      if (el.getBoundingClientRect().bottom <= viewEl.getBoundingClientRect().bottom + bottomOffset) {
        cb()
      }
    }

    viewEl.addEventListener('scroll', onScroll)

    return onScroll
  }

  /**
   * Calculates how many items there are per row in a rendered Element. This
   * function expects exactly 1 Element in the set of given Elements.
   *
   * Note that if your rows children are not equal heights, the results of this
   * will be unreliable.
   *
   * Example: let itemsPerRow = __('#parent').itemsPerRow('.childrenToCount')
   *
   * @param {string} selector - CSS selector for the child item to count per
   * row.
   * @returns {array} Returns an array with the number of children per row.
   * Index 0 is the number of children on row 1, etc.
   */
  itemsPerRow(selector) {
    if (this.els.length !== 1) throw new Error('__().itemsPerRow() expects exactly 1 Element in the set of matched Elements')
    
    let children = this.find(selector)

    // no children found
    if (!children.els.length) return {0: 0}

    // create an array with the Y coordinate of every child
    let coords = []

    children.each((el) => {
      coords.push(__(el).position().y)
    })
    
    // count the y coord duplicated
    let coordCount = {}

    for (let y of coords) {
      coordCount[y] = (coordCount[y] || 0) + 1
    }

    return Object.values(coordCount)
  }

  /**
   * Finds the shortest (smallest pixel height, including padding and borders
   * but not margin) Element in the set of matched Elements.
   *
   * @returns {__Object} Returns a new __Object for chaining that contains only
   * the shortest Element.
   */
  getShortest() {
    if (!this.els.length) throw new Error('__().getShortest() expects at least one Element in the set of matched Elements')

    let smallestHeight = null
    let indexOfSmallestHeight = null

    for (let index in this.els) {
      let height = this.els[index].offsetHeight

      if (height < smallestHeight || smallestHeight === null) {
        smallestHeight = height
        indexOfSmallestHeight = index
      }
    }

    return __(this.els[indexOfSmallestHeight])
  }

  /**
   * Prevents the tab key from focusing outside of the given element. There can
   * only be one element in the set of matched elements. You must use a string
   * selector for this (as opposed to an Element).
   *
   * @param {string} containerSelector - CSS selector for the element to keep
   * focus within.
   */
  keepFocusWithin(containerSelector) {
    if (!containerSelector) throw new Error('__().keepFocusWithin() expects a CSS selector')

    // save the callback in a global variable. it's temporary and there can only be one
    window.__focusTrap = (event) => {
      if (event.code !== 'Tab') return

      // everything that can be potantially tabbed to
      let visibleElementSelectors = [
        `a`,
        `button`,
        `select`,
        `input`,
        `textarea`,
      ]

      // make an array of elements in their DOM order
      let childElements = __(containerSelector).find(visibleElementSelectors.join(','))
      let visibleElements = []

      // filter out hidden elements
      childElements.each((el) => {
        let size = el.getBoundingClientRect()

        if (size.width !== 0 && size.height !== 0) {
          visibleElements.push(el)
        }
      })

      // cycle points
      let firstVisibleElement = visibleElements[0]
      let lastVisibleElement = visibleElements[visibleElements.length - 1]

      // if the container element is a modal or some other element that didn't already
      // have focus, this will reroute the focus into the container
      if (event.target.closest(containerSelector) === null) {
        event.preventDefault()
        firstVisibleElement.focus()
        return
      }

      // tab + noshift while on last element = reroute to the first
      if (!event.shiftKey && event.target === lastVisibleElement) {
        event.preventDefault()
        firstVisibleElement.focus()
      }

      // tab + shift while on the first element = reroute to the last
      if (event.shiftKey && event.target === firstVisibleElement) {
        event.preventDefault()
        lastVisibleElement.focus()
      }

      // none of the above if-statements triggered? let the browser handle the tab event, which
      // we can now assume is witin the focus container.
    }

    document.addEventListener('keydown', window.__focusTrap)
  }

  /**
   * There can only be one focus trap at a time, this function will delete it.
   * No element selector is required.
   */
  releaseFocus() {
    document.removeEventListener('keydown', window.__focusTrap)
  }

  /**
   * Returns a debouncer function. Usage:
   * 
   * ````
   * let debouncer = __().debouncer(() => {}, 1000)
   * 
   * // will only first at most once after x time, no matter how many clicks within x time
   * element.addEventListener('click', debouncer)
   * ````
   */
  debouncer(cb, wait, immediate) {
    let timeout

    return function() {
      const args = arguments

      let later = function() {
        console.log('later')
        timeout = null
        if (!immediate) cb.apply(null, args)
      }

      let callNow = immediate && !timeout

      clearTimeout(timeout)
      timeout = setTimeout(later, wait)

      if (callNow) cb.apply(null, args)
    }
  }

  /**
   * Returns a throttler function. Usage:
   * 
   * ````
   * let throttler = __().throttler(() => {}, 1000)
   * 
   * // first click will fire immediately, then no clicks for x time
   * element.addEventListener('click', throttler)
   * ````
   */
  throttler(cb, limit) {
    let waiting = false

    return function () {
      if (!waiting) {
        cb.apply(null, arguments)

        waiting = true

        setTimeout(() => {
            waiting = false
        }, limit)
      }
    }
  }

  /**
   * Checks if a number is between two other numbers.
   * 
   * @param {number} numberToCheck - The number to check.
   * @param {number} min - The lower limit.
   * @param {number} max - The upper limit.
   * @param {boolean} [inclusive] - Whether the min and max themselves are
   * considered valid numbers for the numberToCheck to be. Defaults to ture.
   */
  numberIsBetween(numberToCheck, min, max, inclusive = true) {
    let realMin = min
    let realMax = max

    if (!inclusive) realMin = min + 1
    if (!inclusive) realMax = max - 1

    return numberToCheck >= realMin && numberToCheck <= realMax
  }

  /**
   * Chunks an array into smaller arrays of equal size, except for maybe the
   * last array chunk.
   * 
   * @param {number} chunkLength
   */
  chunk(array, chunkLength = 10) {
    let result = array.reduce((resultArray, item, index) => { 
      let chunkIndex = Math.floor(index/chunkLength)

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []
      }

      resultArray[chunkIndex].push(item)

      return resultArray
    }, [])

    return result
  }
}