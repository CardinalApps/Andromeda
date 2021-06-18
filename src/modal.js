import __ from '../node_modules/double-u/index.js'
import { html } from '../node_modules/html.js/index.js'

/**
 * Injects a new modal.
 * 
 * @param {(element|string)} parent - Element in which to inject the modal.
 * @param {(string|Element)} content - Stringified HTML content for the modal,
 * or an Element to insert as the modal content (will be copied as .innerHTML).
 * @param {object} [options] - Options object:
 * - `id`: A ID to use in the ID attribute. If omitted, a random one will be generated.
 * - `mode`: `locked` or `floating`. Defaults to locked.
 * - `position`: Only used in `floating` mode. Can be `top-left`, `top-right`, `bottom-left`, `bottom-right`
 * - `onClose`: Callback function.
 */
export async function show(parent, content = '', options = {}) {
  // default to a random ID
  if (!('id' in options)) {
    options.id = __().randomStr(12, 'abcdefghijklmnopqrstuvwxyz')
  }

  // default to locked mode
  if (!('mode' in options)) {
    options.mode = 'locked'
  }

  // default to bottom-right position
  if (!('position' in options)) {
    options.position = 'bottom-right'
  }

  // if an Element was given as the content, copy its innerHTML
  if (content instanceof Element) {
    content = content.innerHTML
  }

  if (options.mode === 'floating') {
    await injectFloatingModal(parent, content, options)
  } else {
    await injectLockedModal(parent, content, options)
  }
}

/**
 * Injects a floating modal. Same args as show(), but with these required options:
 * 
 * - options.id
 * - options.position
 */
async function injectFloatingModal(parent, content, options = {}) {
  __(parent).addClass('floating-modal-open')

  let modal = __(parent).prependHtml(await html(/*html*/`
    <div id="${options.id}" class="modal animated bounceIn" data-mode="floating" data-position="${options.position}">
      <div class="grab"></div>
      <div class="modal-content">
        <button class="close-modal icon-button clicks" title="{i18n{close}}">
          <span tabindex="-1">
            <i class="fas fa-times-circle"></i>
          </span>
        </button>

        ${content}
      </div>
    </div>
  `))

  registerModalInstanceEventHandlers(modal.attr('id'))
  enterFloatingState(modal.el(), modal.find('.grab').el())
  attachModalInstanceCallbacks(modal.attr('id'), options)
}

/**
 * Injects a locked modal. Same args as show(), but with these required options:
 * 
 * - options.id
 */
async function injectLockedModal(parent, content, options = {}) {
  __(parent).addClass('locked-modal-open')

  let modal = __(parent).appendHtml(await html(/*html*/`
    <div id="${options.id}" class="modal" data-mode="locked">
      <div class="modal-content animated bounceIn">
        <button class="close-modal icon-button clicks" title="{i18n{close}}">
          <span tabindex="-1">
            <i class="fas fa-times-circle"></i>
          </span>
        </button>

        ${content}
      </div>
    </div>
  `))

  registerModalInstanceEventHandlers(modal.attr('id'))
  attachModalInstanceCallbacks(modal.attr('id'), options)
  
  __().keepFocusWithin(`#${options.id}.modal`)
}

/**
 * Registers event handlers for specific modal instance.
 * 
 * @param {string} id - ID attribute of the modal Element.
 */
function registerModalInstanceEventHandlers(id) {
  let modal = __(`#${id}`)

  const closeHandler = function(event) {
    // must be spacebar if keyboard event
    if (event instanceof KeyboardEvent && event.code !== 'Space') return

    let id = __(this).closest('.modal').attr('id')
    close(id)
  }

  modal.find('button.close-modal').on('click', closeHandler)
  modal.find('button.close-modal').on('keydown', closeHandler)
}

/**
 * Saves references to callback functions within the modal DOM node.
 * 
 * @param {string} id - Modal ID attribute.
 * @param {object} options - Modal options as given to show().
 */
function attachModalInstanceCallbacks(id, options) {
  let modal = __(`#${id}`)

  modal.el().modalCallbacks = {}

  if ('onClose' in options) {
    modal.el().modalCallbacks['onClose'] = options.onClose
  }
}

/**
 * Adds event listeners to the floating modal that allow the user to move it between corners.
 * This function is written to work with any Element in the document, but currently only the
 * floating modal implements the required CSS.
 * 
 * A floating element will allow the user to drag it around the screen, and when the user releases
 * the mouse button, the floating element will animate smoothly to the nearest corner.
 * 
 * @param {Element} moveEl - The Element to make moveable.
 * @param {Element} [grabEl] - Optionally use this Element as the grab area of the moveable Element.
 */
function enterFloatingState(moveEl, grabEl = el) {
  if (!(moveEl instanceof Element)) throw new Error('enterFloatingState() requires an Element')

  let moveable = __(moveEl)

  // on MOUSEDOWN of the grabEl, register temporary mousemove and mouseup listeners that exist
  // only for the duration of this drag
  grabEl.addEventListener('mousedown', (mouseDownEvent) => {
    // remove classes that might conflict with floating animations
    moveable.removeClass('bounceIn', 'fadeIn', 'animated')

    // attach event listeners to the document using handlers that are defined below
    document.addEventListener('mouseup', mouseUpListener)
    document.addEventListener('mousemove', mouseMoveListener)

    // enter moving state. the element must use this class to set all transition durations to 0,
    // otherwise the element will have a drag delay
    moveable.addClass('moving')

    // add MOUSEMOVE listener that moves the moveable element with transform:translate.
    // this will exist until the next mouseup.
    function mouseMoveListener(mouseMoveEvent) {
      let xDiff = mouseMoveEvent.x - mouseDownEvent.x
      let yDiff = mouseMoveEvent.y - mouseDownEvent.y
      moveable.attr('style', `transform: translate(${xDiff}px, ${yDiff}px);`)
    }

    // on MOUSEUP, the user is done moving the element, so move to the corner
    function mouseUpListener(mouseUpEvent) {
      moveToCorner()
    }

    // when the user is done moving a moveable element, this will move it to the nearest corner
    // and handle all cleanup
    function moveToCorner() {
      // event handlers must be removed first, otherwise the mousemove listener may continue to fire
      // and mess up the animation if the user releases the button while dragging
      document.removeEventListener('mouseup', mouseUpListener)
      document.removeEventListener('mousemove', mouseMoveListener)

      // determine which corner is closest to the element center
      let closestCorner = getClosestCorner(moveEl)

      if (closestCorner === null) throw new Error('Moveable Element could not determine which corner is closest')

      // The transform on the element is relative to the corner that the element is FROM.
      // To have the element move smoothly to the NEW corner, we need to update the transform
      // to be relative to the NEW corner, so that the CSS engine can transisiton to 0,0.
      let oldCorner = moveable.attr('data-position')

      // if we need to change the corner
      if (closestCorner !== oldCorner) {
        let newTransform = getTransformRelativeToCorner(moveEl, closestCorner)
        let newTransformRelativeToNewCorner = `transform: translate(${newTransform.x}px, ${newTransform.y}px)`

        // position the element relative to the new corner (order is important!)
        moveable.attr('style', newTransformRelativeToNewCorner)
        moveable.attr('data-position', closestCorner)
      }

      // a small delay make it feel less grippy
      setTimeout(() => {
        moveable.removeClass('moving') // reenable animation transitions
        moveable.removeAttr('style') // removing the style attr will send the modal "back" to its corner
      }, 20)
    }
  })
}

/**
 * Finds the closest corner of the four custom defined app corners for any element in the document.
 * Uses the center of the element.
 * 
 * @param {Element} el - Any element in the document.
 * @returns {string} Returns the corner name that can be used with getCornerPosition(). Null if no corner was found.
 */
function getClosestCorner(el) {
  let elCoords = el.getBoundingClientRect()
  let center = {
    'x': elCoords.right - (elCoords.width / 2),
    'y': elCoords.bottom - (elCoords.height / 2),
  }

  let cornersToCheck = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
  let closestCorner = null
  let closestCornerDistance = null

  for (let corner of cornersToCheck) {
    let cornerCoords = getCornerPosition(corner)
    let averageDistanceApart = (Math.abs(center.x - cornerCoords.x) + Math.abs(center.y - cornerCoords.y)) / 2

    if (averageDistanceApart < closestCornerDistance || closestCornerDistance === null) {
      closestCornerDistance = averageDistanceApart
      closestCorner = corner
    }

    // uncomment to show the corners
    // let test = document.createElement('div')
    // test.setAttribute('style', `position:absolute; top:${y}px; left:${x}px; width:20px; height:20px; background:red; z-index: 20000;`)
    // test.setAttribute('class', 'moveable-corner')
    // test.setAttribute('data-corner', corner)
    // document.body.appendChild(test)
  }

  return closestCorner
}

/**
 * Returns the coordinates for a single corner.
 * 
 * @param {string} corner: `top-left` | `top-right` | `bottom-left` | `bottom-right`
 * @returns {object} An object with properties `x` and `y`.
 */
function getCornerPosition(corner) {
  let style = getComputedStyle(document.body)
  
  // all corners are custom positioned using CSS variables
  const corners = {
    'top-left': {
      'x': parseInt(style.getPropertyValue('--floating-left-space')),
      'y': parseInt(style.getPropertyValue('--floating-top-space'))
    },
    'top-right': {
      'x': window.innerWidth - parseInt(style.getPropertyValue('--floating-right-space')),
      'y': parseInt(style.getPropertyValue('--floating-top-space'))
    },
    'bottom-left': {
      'x': parseInt(style.getPropertyValue('--floating-left-space')),
      'y': window.innerHeight - parseInt(style.getPropertyValue('--floating-bottom-space'))
    },
    'bottom-right': {
      'x': window.innerWidth - parseInt(style.getPropertyValue('--floating-right-space')),
      'y': window.innerHeight - parseInt(style.getPropertyValue('--floating-bottom-space'))
    }
  }

  return corners[corner]
}

/**
 * Given any Element in the document, this will calculate the X and Y offsets from any corner
 * of the app, as shown in the diagram:
 * 
 * 
 *                    X
 *           |⎻ ⎻ ⎻ ⎻ ⎻ ⎻ ⎻ ⎻ •      // <--- app corner (top-right in this case)
 *         Y |
 *           | 
 *           •     // <--- any element in the document
 * 
 * 
 * The returned values are intented to be used directly as CSS transform:translate values,
 * so that the element can be positioned relative to the given corner.
 * 
 * For this to work, the element needs to implement CSS positioning with the corners, like the
 * floating modal does.
 * 
 * @param {Element} el - Any Element in the document, but only integrated with the floating modals so far.
 * @param {string} corner - `top-left` | `top-right` | `bottom-left` | `bottom-right`.
 * @returns {object} An object with properties `x` and `x` and Number values (pixels).
 */
function getTransformRelativeToCorner(el, corner) {
  // coords of the floating element
  let moveElCoords = el.getBoundingClientRect()

  // it is surely possible to do this mathematically, but given that the transform origin can be changed,
  // and that corners are custom positioned, it is easier to clone the element and render it in
  // its corner and grab the final coordinates from the clone.
  let clone = el.cloneNode(true)
  __(clone).removeAttr('id') // remove duplicate ID
  __(clone).attr('style', 'opacity: 0;') // overwrite inline transformation and set opacity to 0
  __(clone).attr('data-position', corner) // move the element to the corner. non-modal elements will need to implement CSS support for this
  el.insertAdjacentElement('afterend', clone) // inject it into the parent element, it will render transparently in the new corner

  // grab the new coords from the clone
  let coordsWhenInCorner = clone.getBoundingClientRect()

  // the clone has done its job, remove it
  __(clone).remove()

  // calculate new x,y transform values based on the difference between the coordinates of the
  // element that the user dragged and the one that was cloned into the final corner position
  let newX = 0
  let newY = 0

  // x
  if (moveElCoords.x > coordsWhenInCorner.x) {
    newX = moveElCoords.x - coordsWhenInCorner.x
  } else {
    newX = Math.abs(moveElCoords.x) - coordsWhenInCorner.x
  }
  
  // y
  if (moveElCoords.y > coordsWhenInCorner.y) {
    newY = moveElCoords.y - coordsWhenInCorner.y
  } else {
    newY = Math.abs(moveElCoords.y) - coordsWhenInCorner.y
  }

  return {
    'x': newX,
    'y': newY
  }
}

/**
 * Close a modal. You'll need to have given your modal an ID to do this.
 * 
 * @param {string) id - The ID attribute.
 */
export function close(id) {
  let modal = __(`#${id}`)

  if (typeof modal.el().modalCallbacks['onClose'] === 'function') {
    modal.el().modalCallbacks.onClose(id)
  }

  // we need to check if this is the last floating modal before we remove it
  if (modal.closest('.floating-modal-open').find('.modal[data-mode="floating"]').els.length === 1) {
    modal.closest('.floating-modal-open').removeClass('floating-modal-open')
  }

  // we need to check if this is the last locked modal before we remove it
  if (modal.closest('.locked-modal-open').find('.modal[data-mode="locked"]').els.length === 1) {
    modal.closest('.locked-modal-open').removeClass('locked-modal-open')
  }

  __().releaseFocus()
  __(`#${id}.modal`).remove()
}

/**
 * Closes all modals.
 */
export function closeAll() {
  __('.modal').each((el) => {
    let id = __(el).attr('id')
    close(id)
  })
}