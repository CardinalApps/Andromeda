/**
 * @file
 * 
 * Simple implementation of UI tabs.
 * 
 * Using a HTML structure like this...
 * 
 *     <div class="tabs">
 *       <div class="tab" data-tab-name="" data-tab-icon="">Tab Content</div>
 *       <div class="tab" data-tab-name="" data-tab-icon="">Tab Content</div>
 *       <div class="tab" data-tab-name="" data-tab-icon="">Tab Content</div>
 *     </div>
 * 
 * ...the library will parse the structure and inject a header row of clickable tabs.
 */
import __ from '../../node_modules/double-u/index.js'

export default class Tabs {
  /**
   * Usage:
   * 
   *     new Tabs({
   *       'selector': {string}, // CSS selector
   *       'defaultTab': {(Number|string}}, // tab index or tab name, defualts to the first tab
   *       'animationOut': null,
   *       'animationIn': null,
   *     })
   */
  constructor(options) {
    let defaults = {
      'selector': null,
      'defaultTab': null,
      'animationOut': null,
      'animationIn': null,
    }

    for (let setting in defaults) {
      this[setting] = options[setting] || defaults[setting]
    }

    this.init()
    this.registerEventHandlers()
  }

  /**
   * Instead of registering event handlers on the fly whenever new tabs are init'ed,
   * register a delegated handler for all .flex-tab clicks.
   */
  registerEventHandlers() {
    let tabs = this

    // add click and keyup events for each tab
    __(this.selector).find('.flex-tab').each((el) => {
      el.addEventListener('click', (event) => {
        let clickedIndex = __(el).attr('data-tab-index')
        tabs.showTab(clickedIndex)
      })

      el.addEventListener('keyup', () => {
        if (event.code === 'Space') {
          __(el).trigger('click')
        }
      })
    })
  }

  /**
   * Shows the content of the tab to start with
   */
  init() {
    let tabsRoot = __(this.selector)
    let tabRowItems = []

    // loop each tab
    tabsRoot.find('.tab').each((el, i) => {
      let tab = __(el)

      // console.log('looping a tab')

      // add attrs
      tab.attr('data-tab-index', i+1)

      // collect info about the tab
      tabRowItems.push({
        'icon': tab.attr('data-tab-icon'),
        'name': tab.attr('data-tab-name')
      })
    })

    this.injectTabsHeader(tabRowItems)
    this.hideAll()

    let defaultIndex = 1

    if (typeof this.defaultTab === 'string') {
      defaultIndex = this.tabNameToIndex(this.defaultTab)
    } else if (typeof this.defaultTab === 'number') {
      defaultIndex = this.defaultTab
    }

    this.showTab(defaultIndex)

    // tabs are in the init state, show the parent el
    __(this.selector).addClass('ready')
  }

  /**
   * Injects the tab items that are meant to be clicked on.
   */
  injectTabsHeader(tabs) {
    let tabsRoot = __(this.selector)
    
    let title = tabsRoot.attr('data-tab-row-title')
    let titleHtml = title ? `<h2>${title}</h2>` : ''
    tabsRoot.prependHtml(/*html*/`<header class="tabs-row">${titleHtml}</header>`)

    let tabsRow = tabsRoot.find('header.tabs-row')
    let index = 1
    
    for (let tab of tabs) {
      tabsRow.appendHtml(/*html*/`
        <div class="flex-tab" data-tab-index="${index}">
          <a href="javascript:;">
            <span tabindex="-1">
              <i class="fas fa-${tab.icon}"></i>
              <h6>${tab.name}</h6>
            </span>
          </a>
        </div>
      `)

      index++
    }

    tabsRoot.prependHtml(/*html*/`
      <button type="button" class="close">
        <i tabindex="-1" class="fas fa-times-circle"></i>
      </button>
    `)
  }

  /**
   * Returns the tab index of the given tab name.
   * 
   * @param {string} name - Tab name.
   */
  tabNameToIndex(name) {
    return __(this.selector).find(`.tab[data-tab-slug="${name}"]`).attr('data-tab-index')
  }

  /**
   * Hides all the tabs in this tab group
   */
  hideAll() {
    let tabsRoot = __(this.selector)

    tabsRoot.find('.flex-tab.active').removeClass('active')
    tabsRoot.find('.tab.active').removeClass('active')
  }

  /**
   * Shows a tab.
   * 
   * @param {(Number||string}} index - 1-based index of the tab to show, or the tab name.
   */
  showTab(index = 1) {
    if (typeof index === 'string') index = this.tabNameToIndex(index)

    let tabsRoot = __(this.selector)
    let headerTabToShow = tabsRoot.find(`header.tabs-row .flex-tab[data-tab-index="${index}"]`)
    let tabToShow = tabsRoot.find(`.tab[data-tab-index="${index}"]`)

    this.hideAll()

    // show the right tab
    headerTabToShow.addClass('active')
    tabToShow.addClass('active')
    tabsRoot.attr('data-current-tab', index)
  }
}