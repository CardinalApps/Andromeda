/**
 * The <control-group> component is a collection of buttons or controls for the view of another element.
 * It requires the parameter `for`, who's value is a CSS selector. All elements matched
 * by the selector will be controlled by this group. When controls are interacted with within the 
 * <control-group>, those changes are automatically set as data-* attributes on the elements being controlled.
 */
import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

export class ControlGroup extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  onSpawn() {
    // default to active=false on every spawn
    __(this).attr('active', false)

    __(this).watchAttrs(['items'], () => {
      this.render()
    })
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/control-group/control-group.html')

    let items = __(this).attr('items')

    if (typeof items !== 'object') {
      return
    }
    
    // items is an array of objects, each one being a set of controls
    for (let item of items) {
      switch (item.type) {
        // the buttons group is a group of textual buttons, only one of which can be active a time
        case 'buttons':
          // add the label for this group
          __(this).appendHtml(/*html*/`<p class="label">${item.label}</p>`)

          // add a <ul> to the end of the control group
          __(this).appendHtml(/*html*/`<ul data-group="${item.group}" data-aria-change-announcement="${item.ariaAssertiveChangeMessage}"></ul>`)

          // add each <li>
          for (let buttonValue in item.buttons) {
            let template = __(this).find('template.li-item').getTemplate()

            __(template).find('li').attr('data-value', buttonValue)
            __(template).find('li button').html(item.buttons[buttonValue])

            // add the <li> to the <ul>
            __(this).find(`ul[data-group="${item.group}"]`).appendHtml(template)
          }
          break

        // cycle-buttons are floating icons that, when clicked on, cycle through their given options
        case 'cycle-button':
          let template = __(this).find('.icon-item').getTemplate()

          // build the <button> for the icon
          __(template).find('button')
          .attr('title', item.title)
          .attr('data-cycle', item.cycle)
          .attr('data-current-icon', item.cycle[0].icon)
          .attr('data-current-values', item.cycle[0].values)

          // set the icon
          __(template).find('i').addClass('fas', `fa-${item.cycle[0].icon}`)

          // add the icon to the <control-group>
          __(this).appendHtml(template)
          break
      }
    }
  }

  /**
   * After the inner HTML has rendered.
   */
  onLoad() {
    // attach listeners directly to newly rendered elements
    this.registerEventListeners()
    this.setKeyboardListeners()
  }

  /**
   * Registers event handlers on this instance.
   */
  registerEventListeners() {
    // on click on textual buttons
    __(this).find('li').each((li) => {
      /**
       * Handle the click of each textual button.
       */
      li.addEventListener('mouseup', (event) => {
        let group = event.target.closest('[data-group]')

        this.handleTextualButtonClick(event, group)
      })
    })


    // all handlers for each .icon-button
    __(this).find('button.icon-button').each((el) => {
      // save reference to this el because we need to rescope `this` below to the clicked element
      let controlGroup = this

      /**
       * On mouseodonw, add a class that performs a small animation.
       */
      el.addEventListener('mousedown', function(event) {
        // ignore right click
        if (event.button === 2) return

        __(this).addClass('mousedown')
      })

      /**
       * On mouseup, trigger the click of the icon.
       */
      el.addEventListener('mouseup', function(event) {
        // ignore right click
        if (event.button === 2) return

        __(this).removeClass('mousedown')

        // save the values of the clicked icon button
        __(controlGroup).attr('last-used-icon-button-values', __(this).attr('data-current-values'))

        controlGroup.cycleIconButton(this)
        controlGroup.sendControlStateToAllBeingControlled(this)
      })

      /**
       * On mouseleave, ensure that the .mousedown class is gone.
       */
      el.addEventListener('mouseleave', function(event) {
        __(this).removeClass('mousedown')
      })
    })
  }

  /**
   * Automatically called after rendering, this will set keyboard liseners for the buttons.
   */
  setKeyboardListeners() {
    // redirect spacebar on textualButton <button> to <li>
    __(this).find('li button').each((el) => {
      el.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
          __(event.target.closest('li')).trigger('mouseup')
        }
      })
    })
  }

  /**
   * Invoked when the user clicks on one of the textual buttons in a group.
   */
  handleTextualButtonClick(event, groupEl) {
    // ignore right click
    if (event.button === 2) {
      return
    }

    // if the active item was clicked, deactivate it
    if (__(event.target).hasClass('active')) {
      __(event.target).removeClass('active')

      this.sendControlStateToAllBeingControlled()

      let groupName = __(groupEl).closest('[data-group]').attr('data-group')
      this.ariaAnnounce(i18n('aria.announcement.control-group.all-buttons-unclicked').replace('{{group}}', groupName))

      return
    }

    // find and remove .active
    __(groupEl).find('.active').removeClass('active')

    // add active to clicked item
    __(event.target).addClass('active')

    this.sendControlStateToAllBeingControlled()

    // announce the change to screen readers
    let newActiveItem = __(event.target).attr('data-value')
    let ariaAnnouncement = __(groupEl).attr('data-aria-change-announcement').replace('{{order}}', newActiveItem)

    this.ariaAnnounce(ariaAnnouncement)
  }

  /**
   * Steps through a specific icon button cycle once.
   * 
   * @param {Element} el - The button
   */
  cycleIconButton(el) {
    let currentCycleIcon = __(el).attr('data-current-icon')
    let cycle = __(el).attr('data-cycle')
    let spot

    // find our spot in the cycle
    cycle.forEach((item, index) => {
      if (item.icon === currentCycleIcon) {
        spot = index
      }
    })

    let nextStep

    // end of cycle, go back to the first
    if (spot + 1 === cycle.length) {
      nextStep = cycle[0]
    }
    // anywhere else in the cycle
    else {
      nextStep = cycle[spot + 1]
    }

    // change the icon within the button
    __(el).html(/*html*/`<div class="animated rotateIn"><i tabindex="-1" class="fas fa-${nextStep.icon}"></div>`)

    // update the attrs on this icon-button
    __(el).attr('data-current-icon', nextStep.icon)
    __(el).attr('data-current-values', nextStep.values)

    // announce the change to screen readers
    let announcement = cycle[spot].ariaAssertiveChangeMessage
    this.ariaAnnounce(announcement)
  }

  /**
   * Invoked on every interaction with the this <control-group>, this will sync the values of
   * the controls into the attrs of what we control.
   */
  sendControlStateToAllBeingControlled() {
    let controlledElements = __(__(this).attr('for'))
    let state = this.getState()

    // for every matched element that we are controlling, set the state as attr=value
    controlledElements.each((el) => {
      for (let attr in state) {
        __(el).attr(attr, state[attr])
      }
    })
  }

  /**
   * Parses the DOM and builds an object that represents the current state of the controls.
   */
  getState() {
    let state = {}

    // gather all textual button groups.
    // each group represents a single key:value
    __(this).find('[data-group]').each((btnGoup) => {
      let group = __(btnGoup).attr('data-group')
      let active = __(btnGoup).find('.active')
      let activeValue

      if (active.els.length) {
        activeValue = active.attr('data-value')
      } else {
        activeValue = ''
      }

      state[group] = activeValue
    })

    // we only want the icon button that was last clicked
    let values = __(this).attr('last-used-icon-button-values')

    for (let attr in values) {
      state[attr] = values[attr]
    }

    return state
  }

  /**
   * Updates the aria-live="assertive" DOM node for this control-group, which gets read to the screen reader immediately.
   */
  ariaAnnounce(message) {
    __(this).find('.aria-control-announcer').html(message)
  }
}