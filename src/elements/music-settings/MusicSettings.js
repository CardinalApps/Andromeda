import __ from '../../../node_modules/double-u/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import Tabs from '../../tabs/Tabs.js'
import { AppSettings } from '../../../node_modules/cardinal-shared-components/app-settings/AppSettings.js'

export class MusicSettings extends AppSettings {
  /**
   * Spawn
   */
  onSpawn() {
    if (__().enforceSingleton('music-settings', this)) return

    this.boundEscKeyHandler = this.onEscKey.bind(this)
  }

  /**
   * Build
   */
  async onBuild() {
    let globalTemplates = this.getFieldTemplates()
    this.innerHTML = await html('/elements/music-settings/music-settings.html', globalTemplates)
  }

  /**
   * Loaded
   */
  async onLoad() {
    this.setMainDotMenuItems() // add "settings" to the main dot menu

    // init the panel tabs
    this.tabs = new Tabs({
      'selector': '.settings-panel .tabs'
    })

    this.formSetup()

    // on click of close (must be called after Tabs are inited)
    this.querySelector('.close').addEventListener('click', () => {
      this.close()
    })

    // Any item in the DOM can set the attribute [data-settings="tabName"] which, when clicked,
    // opens the settings panel to that tab.
    __('[data-settings]').on('click', this.closest('music-app'), this.boundOnDataSettingsAttrClick)
    
    // esc to close
    window.addEventListener('keyup', this.boundEscKeyHandler)
  }

  /**
   * Removed
   */
  onRemoved() {
    window.removeEventListener('keyup', this.boundEscKeyHandler)
  }

  /**
   * Adds an entry to the main <dot-menu>
   */
  setMainDotMenuItems() {
    if (!document.querySelector('#main-dot-menu')) {
      return
    }

    __('#main-dot-menu').el().addMenuItems('start', {
      'group': i18n('app-name'),
      'items': {
        /**
         * Open Settings
         */
        [i18n('settings.main-dot-menu')]: {
          'icon': 'atom',
          'cb': (rightClickedEl, menuItem) => {
            this.openSettingsPanel()
            ContextMenu.closeAllContextMenus()
          }
        }
      }
    })
  }

  /**
   * When the escape key is pressed while the settings panel is open.
   */
  onEscKey(event) {
    if (event.key === 'Escape' && __(this).find('.settings-panel').hasClass('open')) {
      this.close()
    }
  }

  /**
   * Visually closes the settings panel (does not remove from document).
   */
  close() {
    __('music-app').removeClass('settings-open')
    __('.settings-panel').removeClass('open')

    // trigger all 'onClose' callbacks
    for (let cb of this._callbacks.onClose) {
      cb()
    }

    __().releaseFocus()
  }
}