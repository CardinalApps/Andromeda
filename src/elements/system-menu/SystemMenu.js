import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

export class SystemMenu extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    this.clickOutsideToCloseListener = this.clickOutsideToClose.bind(this)
    this.type = __(this).attr('type')

    this.watchAttr(['type'], () => this.render())
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/system-menu/system-menu.html')

    let systemMenuArray = JSON.parse(await Bridge.ipcAsk('get-system-menu'))
    let systemMenuEl = __(this).find('ul.system-menu')

    for (let topLevelItem of systemMenuArray) {
      let topLevelTemplate = __(this).getTemplate('.top-level-item')
      __(topLevelTemplate).find('.label').text(topLevelItem.label) // insert top level label

      for (let secondLevelItem of topLevelItem.submenu) {
        if (secondLevelItem.visible === false) continue

        // seperators
        if (secondLevelItem.type === 'separator') {
          let secondLevelTemplate = __(this).getTemplate('.sep')
          __(topLevelTemplate).find('.second-level-menu').appendHtml(secondLevelTemplate)
        } 
        // regular items
        else {
          let secondLevelTemplate = __(this).getTemplate('.second-level-item')

          // insert second level label
          if (secondLevelItem.label) {
            __(secondLevelTemplate).find('.label').text(secondLevelItem.label)
          }

          // insert second level shortcut
          let accel = secondLevelItem['win32-accelerator-label'] || secondLevelItem['accelerator'] || null

          if (accel) {
            __(secondLevelTemplate).find('.accelerator').text(accel)
          }

          __(secondLevelTemplate).find('li.second-level-item').attr('menu-item-id', secondLevelItem.id || '')

          // insert second level item into parent
        __(topLevelTemplate).find('.second-level-menu').appendHtml(secondLevelTemplate)
        }
      }

      // insert top level item with all children
      systemMenuEl.appendHtml(topLevelTemplate)
    }

    this.registerEventListeners()
  }

  /**
   * After the inner HTML has rendered. 
   */
  async onLoad() {
    
  }

  /**
   * After this instance is removed.
   */
  async onRemoved() {
    __('music-app').el().removeEventListener('click', this.clickOutsideToCloseListener)
  }

  /**
   * Event handler that's invoked on music-app click that checks if any open system
   * menu items should be closed.
   */
  clickOutsideToClose(event) {
    // click was within the system menu, ignore it
    if (__(event.target).parents('system-menu').els.length) return

    let openTopLevelItems = __(this).find('.top-level-item.open')

    if (openTopLevelItems.els.length) {
      openTopLevelItems.removeClass('open')
    }
  }

  /**
   * Registers event listeners for this instance.
   */
  registerEventListeners() {
    __('music-app').el().addEventListener('click', this.clickOutsideToCloseListener)

    /**
     * Top level open/close.
     * 
     * Also triggers on click on children of the parent, which will close the menu
     */
    __(this).find('.top-level-item').each((el) => {
      // toggle open/close on SPACEBAR
      el.addEventListener('keyup', function(event) {
        console.log('keyup', event)
        // don't mess with tabs
        if (event.key === 'Tab' || event.key === 'Shift') return

        // prevent a mouse event from firing
        event.stopImmediatePropagation()
        event.stopPropagation()
        event.preventDefault()

        // close other open menus on focus
        let systemMenu = __(this).closest('system-menu')
        systemMenu.el().closeAll()

        if (event.code === 'Space') {
          __(this).addClass('open')
        }
      })

      // toggle open/close on MOUSE CLICK
      el.addEventListener('click', function(event) {
        __(this).toggleClass('open')
      })

      // shift the open menu on hover when a menu was already open
      el.addEventListener('mouseenter', function(event) {
        let systemMenu = __(this).closest('system-menu')
        let alreadyOpen = systemMenu.find('.top-level-item.open')

        if (alreadyOpen.els.length) {
          systemMenu.el().closeAll()
          __(this).addClass('open')
        }
      })
    })

    /**
     * Second level item click.
     */
    __(this).find('.second-level-item[menu-item-id]').each((el) => {
      el.addEventListener('click', function(event) {
        // stop ALL propagation
        event.stopPropagation()
        event.stopImmediatePropagation()
        event.preventDefault()

        let itemId = __(this).attr('menu-item-id')
        Bridge.ipcSay('trigger-system-menu-item', itemId)
        
        __(this).closest('system-menu').el().closeAll()
      })

      el.addEventListener('keyup', function(event) {
        // stop ALL propagation
        event.stopPropagation()
        event.stopImmediatePropagation()
        event.preventDefault()
        
        // don't mess with tabs
        if (event.key === 'Tab' || event.key === 'Shift') return

        let itemId = __(this).attr('menu-item-id')
        Bridge.ipcSay('trigger-system-menu-item', itemId)
      })
    })
  }

  /**
   * Closes all system menu dropdowns in this instance.
   */
  closeAll() {
    __(this).find('.top-level-item.open').removeClass('open')
  }
}