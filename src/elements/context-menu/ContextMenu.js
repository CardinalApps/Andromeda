/**
 * @file
 * 
 * The `<context-menu>` is the contextual menu that appears when right clicking or when
 * clicking on a `<dot-menu>`. The `<context-menu>` doesn't exist on the page until it is
 * invoked using the global `ContextMenu.create()` static method.
 * 
 * `<context-menu>`'s will always be injected into the app root.
 * 
 * Any custom element can add the class `has-context-menu-items` to itself, and
 * then implement the `getContextMenuItems()` method, which should return an
 * object of context menu items. All right clicks on child elements will include
 * the parent context menu items.
 */
import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'
import * as specialItems from './special-items.js'

export class ContextMenu extends Lowrider {
  onSpawn() {
    // dot-menu's can store a refernce to themselves in here, which the context-menu will pass back to
    // all context-menu callback functions, so that the callback can determine the dot-menu context.
    this.dotMenuReference = null
    this.view = document.querySelector('.view-content')

    if (this.view) {
      this.view.addEventListener('scroll', this.onViewScroll)
    }

    // attach an observer to this context menu that watches for DROPDOWN menu changes to make visual adjustments
    let observer = new MutationObserver((mutations) => {
      if (this.querySelector('.submenu-box')) {
        this.checkDropdownFit(this.querySelector('.submenu-box'))
      }
    })

    observer.observe(this, {'attributes': false, 'childList': true, 'characterData': false, 'subtree': true})
  }

  /**
   * When the instance is removed.
   */
  onRemoved() {
    if (this.view) { 
      this.view.removeEventListener('scroll', this.onViewScroll)
    }
  }

  /**
   * When the app view is scrolled, close the context menu automatically.
   */
  onViewScroll() {
    ContextMenu.closeAllContextMenus()
  }

  /**
   * This is invoked every time a context-menu is rendered so that listeners can be attached to live nodes.
   * The order of the event registration is important.
   */
  registerEventListeners() {
    /**
     * On CLICK or SPACEBAR of a context menu item, trigger the callback function.
     */
    __(this).find('a.context-menu-item').each((el) => {
      const standardMenuItemHandler = (event) => {
        // if keyboard event, spacebar only
        if (event instanceof KeyboardEvent && event.code !== 'Space') return

        let menuButton = __(el)
        let contextMenu = menuButton.closest('context-menu')
        let group = menuButton.closest('.group-items').attr('data-group')
        let slug = menuButton.attr('data-label')
        let elToGive = window.hasOwnProperty('lastElementRightClicked') ? window.lastElementRightClicked : null

        contextMenu.el().items[group][slug].cb(elToGive, menuButton.el())
      }

      el.addEventListener('click', standardMenuItemHandler)
      el.addEventListener('keydown', standardMenuItemHandler)
    })

    /**
     * On HOVER or SPACEBAR of a context menu item with a dropdown, open/close the dropdown.
     */
    __(this).find('a.context-menu-item.dropdown-item').each((el) => {
      let menuButton = __(el)

      el.addEventListener('mouseenter', (event) => {
        let contextMenu = menuButton.closest('context-menu')
        let group = menuButton.closest('.group-items').attr('data-group')
        let slug = menuButton.attr('data-label')
        let elToGive = window.hasOwnProperty('lastElementRightClicked') ? window.lastElementRightClicked : null

        contextMenu.el().items[group][slug].cb(elToGive, menuButton.el())
      })

      el.addEventListener('mouseleave', (event) => {
        if (menuButton.hasClass('dropdown-item') && menuButton.hasClass('open')) {
          menuButton.find('.submenu-box').remove()
          menuButton.removeClass('open')
          return
        }
      })
    })

    /**
     * On TAB of ALL context menu items, maybe close the menu.
     */
    __(this).find('.context-menu-item').each((el) => {
      el.addEventListener('keydown', (event) => {
        if (event.code === 'Tab') {
          let allButtonsInMenu = __(event.target.closest('context-menu')).find('.context-menu-item')

          // when tabbing out of the menu, close it
          if (event.target === allButtonsInMenu.els.pop()) {
            ContextMenu.closeAllContextMenus()
          }
        }
      })
    })
  }

  /**
   * Builds an object of context menu items based on a node and its ancestors.
   * 
   * @param {Element} el - The Element to invoke the context menu with (typically
   * the right clicked Element).
   * @returns {object} An JSON object of menu items.
   */
  static async buildAncestralMenuItemsObject(el) {
    let menuItems = {}

    let chain = [el, ...__(el).parents().els]

    for (let chainEl of chain) {
      // the Element should have a custom property with the items
      if ('getContextMenuItems' in chainEl) {
        let itemGroups = await chainEl.getContextMenuItems()

        for (let itemGroup of itemGroups) {
          menuItems[itemGroup.group] = {...itemGroup.items, ...menuItems[itemGroup.group]}
        }
      }
    }

    return menuItems
  }

  /**
   * Builds the context menu html and injects it.
   * 
   * @param {Object} items - Object as created by ContextMenu.buildAncestralMenuItemsObject()
   */
  buildHtml(items) {
    return new Promise(async (resolve, reject) => {

      // save the items to this context-menu instance. they will be referenced
      // by the click events
      this.items = items

      //console.log(items)

      this.innerHTML = await html('/elements/context-menu/context-menu.html')
      
      for (let group in items) {
        let groupTemplate = __(this).getTemplate('.group')
        
        // set group name
        __(groupTemplate).find('.group-name').html(group)
        __(groupTemplate).find('.group-items').attr('data-group', group)
        
        // add each context menu item
        for (let [label, options] of Object.entries(items[group])) {
          let itemTemplate = this._buildContextMenuItemHtml(label, options)
          __(groupTemplate).find('.group-items').appendHtml(itemTemplate)
        }
        
        __(this).find('ol').appendHtml(groupTemplate)
      }

      this.checkFit()

      resolve()

    })
  }

  /**
   * Builds the markup for standard menu items. A standard item is just one that triggers the given callback on click.
   * 
   * @returns {DocumentFragment}
   */
  _buildContextMenuItemHtml(label, options) {
    let itemTemplate = __(this).getTemplate('.menu-item')

    let itemHtml = label

    if ('icon' in options) {
      itemHtml = `<i class="fas fa-${options['icon']}"></i>${label}`
    }

    __(itemTemplate).find('.context-menu-item').attr('data-label', label)
    __(itemTemplate).find('.context-menu-item span[tabindex="-1"]').html(itemHtml)
    
    if ('attrs' in options) {
      for (let attr in options.attrs) {
        __(itemTemplate).find('.context-menu-item').attr(attr, options.attrs[attr])
      }
    }

    if ('class' in options) {
      __(itemTemplate).find('.context-menu-item').addClass(options.class)
    }

    return itemTemplate
  }

  /**
   * Renders a special item within an already rendered <context-menu>, and
   * returns a promise that only resolves when the user has selected something
   * in the special item.
   * 
   * @param {string} item - Special item slug.
   * @param {object} options - An object of options for the special item.
   */
  static async renderSpecialItem(item, options) {
    return await specialItems[item](options)
  }

  /**
   * Checks if the context menu physically fits in the location that the
   * user right clicked on, and adjusts it accordingly. Also adjusts origin.
   * 
   * This does not account for submenus, which are all closed on render anyway.
   * 
   * TODO this should be changed to postition() and should include the x,y logic
   * from the event handler in eventHanders.js
   */
  checkFit() {
    let bodyRect = document.body.getBoundingClientRect()
    let menuRect = this.getBoundingClientRect()

    // modify the position based on the origin
    switch (__(this).attr('origin')) {
      case 'top-left':
        // do nothing
        break

      case 'top-right':
        __(this).css({
          'top': menuRect.top,
          'left': menuRect.left - menuRect.width
        })
        
        // get updated values
        bodyRect = document.body.getBoundingClientRect()
        menuRect = this.getBoundingClientRect()
        break
    }

    let bottomOverflow = 0
    let rightOverflow = 0

    if (menuRect.bottom > bodyRect.bottom) {
      bottomOverflow = menuRect.bottom - bodyRect.bottom
    }

    if (menuRect.right > bodyRect.right) {
      rightOverflow = menuRect.right - bodyRect.right
    }

    if (bottomOverflow || rightOverflow) {
      let newTop =  __(this).css('top')
      let newLeft =  __(this).css('left')

      if (bottomOverflow) {
        newTop = newTop - bottomOverflow
      }

      if (rightOverflow) {
        newLeft = newLeft - rightOverflow
      }

      __(this).css({
        'top': newTop,
        'left': newLeft
      })
    }
  }

  /**
   * Checks if the context menu DROPDOWN physically fits in the location it opens into,
   * and makes adjustments accordingly.
   * 
   * @param {Element} el - The `.submenu` Element.
   */
  checkDropdownFit(el) {
    let bodyRect = document.body.getBoundingClientRect()
    let dropdownRect = el.getBoundingClientRect()
    let rightOverflow = 0
    let bottomOverflow = 0
    
    if (dropdownRect.bottom > bodyRect.bottom) {
      bottomOverflow = dropdownRect.bottom - bodyRect.bottom
    }
    
    if (dropdownRect.right > bodyRect.right) {
      rightOverflow = dropdownRect.right - bodyRect.right
    }

    // if the right side is overflowing
    if (rightOverflow) {
      __(el).addClass('shift-left')
    }

    // if the bottom is overflowing
    if (bottomOverflow) {
      // if the dropdown is taller than the window, adjust using the space above.
      // the -15px is so that the menu being exactly on the top edge is considerred "too tall"
      if (dropdownRect.height >= (bodyRect.height - 15)) {
        __(el).addClass('max-height')
        
        let spaceAbove = dropdownRect.top - bodyRect.top
        let newTop

        if (spaceAbove > 0) {
          newTop = '-' + spaceAbove + 'px'
        } else {
          newTop = dropdownRect.top - bodyRect.top
        }

        __(el).css({
          'top': newTop
        })
      }
      // if the dropdown is shorter than the window, adjust using the bottom overlow
      else {
        __(el).css({
          'top': '-' + bottomOverflow - 15 + 'px'
        })
      }
    }
  }

  /**
   * Checks whether a click event should close existing context menus.
   */
  static maybeCloseAllContextMenus(event, selector = '') {
    // clicking within the context menu obviously shouldn't close it
    if (
      event.target.matches(`context-menu${selector}`) ||
      __(event.target).parents(`context-menu${selector}`).els.length
    ) {
      return
    }

    ContextMenu.closeAllContextMenus(selector)
  }

  /**
   * When invoked, this will add event handlers to the given element that listen for right clicks, and create
   * a new <context-menu> when one is detected.
   */
  static listenForRightClicks(el) {
    el.addEventListener('mouseup', (event) => {
      if (event.which !== 3) return

      // don't create context menus within context menus
      if (__(event.target).parents('context-menu').els.length || event.target.matches('context-menu')) {
        return
      }

      window.lastElementRightClicked = event.path[0]

      // close all open context-menus, including ones opened as dot-menu's, before opening a right click context-menu
      ContextMenu.maybeCloseAllContextMenus(event)
      ContextMenu.create(event, {'classes': 'rmb'})

      const rmbClickOutsideToClose = (event) => {
        let allowedElements = ['context-menu']
        let willClose = true
        
        // if the click doesn't happen inside a dot menu or a context menu, close all menu items and remove the handler
        for (let selector of allowedElements) {
          if (__(event.target).parents(selector).els.length || event.target.matches(selector)) {
            willClose = false
          }
        }
  
        if (willClose) {
          ContextMenu.closeAllContextMenus('.rmb')
          el.removeEventListener('click', rmbClickOutsideToClose)
        }
      }

      // now that there's a right-click menu open, start listening for clicks outside
      el.addEventListener('click', rmbClickOutsideToClose)
    })
  }

  /**
   * Removes all context menus from the page.
   * 
   * @static
   */
  static closeAllContextMenus(selector = '') {
    __(`context-menu${selector}`).remove()
    __('dot-menu').removeClass('open')
  }

  /**
   * Injects a context menu using data from a mouse event.
   * 
   * @param {object} event - **Required.** The mouse event that generated the context menu.
   * @param {object} options - An object of options with the following keys:
   *  {object} id - String to use as the context-menu's ID attr.
   *  {object} classes - Additional classes for the context menu.
   *  {array} [position=] - Optional window [x,y] coords to use instead of the event coords.
   *  {string} [origin=] - `top-left` or `top-right`. Defaults to `top-left`.
   *  {object} [items=null] - Optional object of menu items to override the automatic one. See `buildMenuItems()` for an example object.
   *  {boolean} [ctrl=] - Optional ctrl value to use instead of the event.
   *  {boolean} [alt=] - Optional alt value to use instead of the event.
   *  {boolean} [shift=] - Optional shift value to use instead of the event.
   *  {boolean} [show=true] - Set this to `false` to have the Element injected hidden.
   * @static
   */
  //static render(event, classes, position, items = null, ctrl, alt, shift, show = true) {
  static async create(event, options = {}) {
    return new Promise(async (resolve, reject) => {

      let items = ('items' in options) ? options.items : await ContextMenu.buildAncestralMenuItemsObject(event.target)
      let origin = ('origin' in options) ? options.origin : 'top-left'
      let posX = ('position' in options) ? options.position.x : event.clientX
      let posY = ('position' in options) ? options.position.y : event.clientY
      let ctrlKey = ('ctrl' in options) ? options.ctrl : event.ctrlKey
      let altKey = ('alt' in options) ? options.alt : event.altKey
      let shiftKey = ('shift' in options) ? options.shift : event.shiftKey
      let id = ('id' in options) ? options.id : ''
      let classes = ('classes' in options) ? options.classes : ''
      let show = ('show' in options) ? options.show : true

      // if the node tree contains no context menu items
      if (typeof items !== 'object' || !Object.keys(items).length) {
        return
      }

      let contextMenu = __('#app').appendHtml(/*html*/`<context-menu class="${classes}"></context-menu>`)
      
      contextMenu
        .attr('position-x', posX)
        .attr('position-y', posY)
        .attr('ctrl', ctrlKey)
        .attr('alt', altKey)
        .attr('shift', shiftKey)
        .attr('origin', origin)
        .attr('show', show)
        .attr('id', id)
        .css({
          'top': posY,
          'left': posX
        })

      await contextMenu.el().buildHtml(items)

      // add event listeners to the menu
      contextMenu.el().registerEventListeners()

      contextMenu.addClass('show')

      // return the element
      resolve(contextMenu.els[0])

    })
  }
}