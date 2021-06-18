/**
 * @file
 * 
 * The `<dot-menu>` automatically shows the context menus of all parents.
 * 
 * Other elements can add items to `<dot-menu>`'s by using the
 * `.addMenuItem()` method.
 */
import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

/**
 * Use the `.addMenuItem()` method to add menu items. There is no attribute to add context menu items.
 * 
 * Supported attributes:
 * 
 * - `position` - The position of the context menu. Options are `top-left` and `top-right`. Defaults to `top-left`.
 * - `group-name` - Optionally set the group name in the context menu. There can only be one. Defaults to "Menu".
 * - `items` - Statically typed menu items can be added here in a stringified array of single items objects where
 * each key is the callback name and each value is the label. If this attribute is present, the items will be prepended
 * to the context menu before dynamic items.
 */
export class DotMenu extends Lowrider {
  /**
   * Define a custom render checker that always forces a render.
   */
  shouldBuild() {
    return true
  }

  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    this.items = []
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    __(this).removeClass('open')

    this.innerHTML = await html('/elements/dot-menu/dot-menu.html')
    
    this.registerEventHandlers()
  }

  /**
   * Register events handlers for this dot menu.
   * 
   * When the dot menu is clicked and opened, function clickOutsideToClose() is registered as
   * a click listener to the document, which when invoked, will remove the dropdown menu
   * then remove its own event listener to avoid listener pollution.
   */
  registerEventHandlers() {
    /**
     * On CLICK of this dot-menu
     */
    this.addEventListener('click', (event) => {
      this.handleClick(event)
    })

    /**
     * On SPACEBAR of this dot menu, simulate a click then trigger focus of the first menu item.
     */
    this.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
        event.preventDefault()
        this.handleClick(event, true)
      }
    })

    /**
     * The dot-menu supports animations that move the dots around. JS is used to
     * do the animation loop, because CSS has no iteration-delay.
     *
     * This should be attached to the dot with the longest animaton in the
     * animaton loop.
     * 
     * Attaching to the parent dot-menu will capture events from child dots.
     */
    let animationEndHandler = (event) => {
      let dotMenu = __(event.target).closest('dot-menu')

      // always remove the animation
      dotMenu.removeClass('orbit')

      if (dotMenu.hasClass('open')) {
        setTimeout(() => {
          dotMenu.addClass('orbit')
        }, 0)
      }
    }

    this.querySelector('.dot._1').addEventListener('animationend', animationEndHandler)
  }

  async handleClick(event, alsoFocusFirstItem = false) {
    // prevent event bubbling up to document listener that we are about to create
    //event.stopImmediatePropagation()

    // can click inside this dot-menu while it's already open
    if (__(this).hasClass('open') && event.path.includes(this)) {
      return
    }

    // opening a dot-menu dropdown should close all other context-menus and dot-menus
    if (__('context-menu').els.length) {
      __('dot-menu.open').removeClass('open')
      __('context-menu').remove()
    }

    // maybe start an animation loop
    if (__(this).hasClass('animates')) {
      this.startAnimation()
    }

    // inject a context-menu on this dot-menu
    let position = __(this).position()
    let positionAttr = __(this).attr('position') || 'top-left'
    let contextItems = await this.getContextMenuObject()

    // get the center of the dot-menu
    position.x = position.x + (this.offsetWidth * .5)
    position.y = position.y + (this.offsetHeight * .5)

    // maybe give it an ID
    let contextMenuId = ''
    let dotMenuId = __(this).attr('id')

    if (dotMenuId) {
      contextMenuId = 'context-menu-for-' + dotMenuId
    }

    // maybe add some classes
    let contextMenuClasses = ['dot-menu-dropdown']
    let contextMenuExtraClasses = __(this).attr('context-menu-classes')

    if (contextMenuExtraClasses) {
      contextMenuExtraClasses.split(' ').forEach((className) => {
        contextMenuClasses.push(className)
      })
    }

    // inject the dropdown
    await ContextMenu.create(event, {
      'id': contextMenuId,
      'classes': contextMenuClasses.join(' '),
      'position': position,
      'items': contextItems,
      'origin': positionAttr
    })

    // save a refernce to this dot-menu in the context-menu
    __('context-menu.dot-menu-dropdown').el().dotMenuReference = this

    __(this).addClass('open')

    // reusable function
    const clickOutsideToClose = (event) => {
      let allowedElements = ['context-menu', 'dot-menu']
      let willClose = true
      
      // if the click doesn't happen inside this dot menu or a context menu, close all menu items and remove the handler
      for (let selector of allowedElements) {
        if (__(event.target).parents(selector).els.length || event.target.matches(selector)) {
          willClose = false
        }
      }

      if (willClose) {
        ContextMenu.closeAllContextMenus('.dot-menu-dropdown')
        document.removeEventListener('click', clickOutsideToClose)
        __('dot-menu').removeClass('open') // no dot menu in the document will be open
      }
    }

    // create an event handler that will remove the injected context-menu
    document.addEventListener('click', clickOutsideToClose)

    // focus the first context menu item when spacebarred
    if (alsoFocusFirstItem) {
      __('.dot-menu-dropdown').find('.context-menu-item').els[0].focus()
    }
  }

  /**
   * Starts an animation with the dots that continues until the
   * `animationiteration` event handler decides it's time to stop.
   */
  startAnimation() {
    __(this).addClass('orbit')
  }

  /**
   * Returns the context menu of the closest parent .has-context-menu-items.
   * 
   * "standalone" dot-menus don't look upwards for items, instead they wait for
   * other elements to register items on them.
   */
  async getContextMenuObject() {
    let menu = {}

    // always start with the internal items
    if (this.items) {
      for (let group of this.items) {
        // merge groups
        if (group.group in menu) {
          menu[group.group] = {...menu[group.group], ...group.items}
        }
        // create new group
        else {
          menu[group.group] = group.items
        }
      }
    }

    if (!__(this).hasClass('standalone')) {
      let ancestral = await ContextMenu.buildAncestralMenuItemsObject(this)

      menu = {...ancestral, ...menu}
    }
      
    return menu
  }
  
  /**
   * Adds an item to this <dot-menu>.
   * 
   * @param {string} position - `start` or `end`.
   * @param {string} menuItem - Menu item object.
   */
  addMenuItems(position, menuItems) {
    // register the callback with the ContextMenu
    if (position === 'start') {
      this.items.unshift(menuItems)
    } else if (position === 'end') {
      this.items.push(menuItems)
    }
  }

  /**
   * Removes a previously added item from this <dot-menu>.
   */
  removeMenuItem(callbackName) {
    for (let index in this.items) {
      if (this.items[index].callbackName === callbackName) {
        this.items.splice(index, 1)
      }
    }
  }

  /**
   * Triggered by the context menu
   */
  mainDotMenuSettings() {
    __('music-settings').el().invokeModal()
  }
}