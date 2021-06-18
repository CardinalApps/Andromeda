/**
 * @file - General keyboard listeners that aren't better suited for a more specific custom element.
 */
import __ from '../../../node_modules/double-u/index.js'

/**
 * when keyboard is focused on an icon button and space is pressed, simulate the click on the child icon
 */
const onIconButtonKeyDown = function(event) {
  if (event.code === 'Space') {
    __(event.target).find('i').trigger('mouseup')
  }
}

/**
 * When an <a> is focused, it can dictate which element should get the focus if spacebar is pressed.
 */
const transferFocusToKeydown = function(event) {
  if (event.code === 'Space') {
    // focus the new element on the next tick, allows other handers on the button to run first
    setTimeout(() => {
      transferFocus(this)
    }, 0)
  }
}

/**
 * When a <button> is focused, it can dictate which element should get the focus when the button is
 * clicked or spacebarred.
 */
const transferFocusToClick = function(event) {
  // focus the new element on the next tick, allows other handers on the button to run first
  setTimeout(() => {
    transferFocus(this)
  }, 0)
}

/**
 * Registers and delegates all keyboard helpers.
 */
export function register(el) {
  __('button.icon-button').on('keydown', el, onIconButtonKeyDown)
  __('a[data-transfer-focus-to]').on('keydown', el, transferFocusToKeydown)
  __('button[data-transfer-focus-to]').on('click', el, transferFocusToClick)
}

/**
 * Transfers the focus to the element selector given in the data attribute `data-transfers-focus-to` of the
 * element that is given as the first parameter. If the selector matches more than a single element, the first
 * match will be used.
 * 
 * @param {(Element)} currentlyFocusedEl - The element that currently has focus and wishes to transfer focus. This
 * is the element that must have the data attribute `data-transfer-focus-to`.
 */
function transferFocus(currentlyFocusedEl) {
  let parentEl = __(currentlyFocusedEl).attr('data-transfer-focus-to-child') ? currentlyFocusedEl : 'music-app'
  let newFocusTarget = __(currentlyFocusedEl).attr('data-transfer-focus-to')
  let matchedEls = __(parentEl).find(newFocusTarget)

  if (matchedEls.els.length) {
    setTimeout(() => {
      matchedEls.el().focus()
    }, 0)
  }
}