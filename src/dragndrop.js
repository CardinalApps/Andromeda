/**
 * @file
 * 
 * DragNDrop is a small library for HTML5 drag 'n drop for Echoes. Registers listeners that automatically manage
 * classes and drag event data.
 */
import __ from '../node_modules/double-u/index.js'

/**
 * Main function that custom elements use to create and register drag n drop event listeners.
 * **Don't forget to set draggable="true" on your draggable elements, otherwise event handlers won't fire.**
 * 
 * @param {object} options - An object with the following properties:
 * - `dragEl` {Element} - **Required.** The Element on which to register the listeners.
 * - `dropEl` {Element} - **Required.** The Element on which to register the drop listeners.
 * - `dragoverEl` {Element} - An Element on which to register dragover listeners.
 * - `dragImage` {Element} - Override the Element that V8 uses as the drag image, or set to false to disable the drag image.
 * - `onDrag` {Function} - Called on element drag. Return false to prevent the drag. The callback function is given the `dragstart` event as the first argument.
 * - `onDragEnd` {Function} - Called on element drag end. The callback function is given the `dragend` event as the first argument.
 * - `onDrop` {Function} - Called when the dragged Element is dropped. The first argument is the drop event, the second is the **new** dropped Element. The dropped Element is a new DOM node, not the same Element that moved.
 */
export function registerDragNDropListeners(options) {
  if (!('dragEl' in options)) throw new Error('DragNDrop requires the dragEl option')
  if (!('dropEl' in options)) throw new Error('DragNDrop requires the dropEl option')

  /**
   * on DRAGSTART of a draggable item: create the dataTransfer object
   */
  options.dragEl.addEventListener('dragstart', (event) => {
    // if there is a onDrag callback, trigger it. if it returns false, don't proceed.
    if ('onDrag' in options && typeof options.onDrag === 'function') {
      if (options.onDrag(event) === false) return
    }

    // maybe disable the html5 dragImage
    if ('dragImage' in options && options.dragImage === false) {
      // create a "visible" transparent 1x1 div to replace the automatic Element drag image created by webkit (there is no way to just disable it)
      const fakeDragImage = document.createElement('div')
      fakeDragImage.style.width = '1px'
      fakeDragImage.style.height = '1px'
      fakeDragImage.style.position = 'fixed'
      fakeDragImage.style.top = 0
      fakeDragImage.style.left = 0
      fakeDragImage.classList.add('fake-drag-image')
      document.body.appendChild(fakeDragImage)
      event.dataTransfer.setDragImage(fakeDragImage, 0, 0)
    }
    // maybe use the given element as the drag image
    else if ('dragImage' in options && options.dragImage instanceof Element) {
      let pos = options.dragImage.getBoundingClientRect()
      event.dataTransfer.setDragImage(options.dragImage, event.pageX - pos.left, event.pageY - pos.top)
    }
    
    // set dataTransfer options
    event.dataTransfer.setData('text/plain', options.dragEl.outerHTML)
    event.dataTransfer.dropEffect = 'move'

    event.target.classList.add('dragging')
  })

  /**
   * if there is a dragoverEl, register dragover and dragleave listeners on it.
   * 
   * on DRAGOVER of a dragover item: add drop zone classes
   */
  if ('dragoverEl' in options) {
    options.dragoverEl.addEventListener('dragover', (event) => {
      const dragoverItem = options.dragoverEl
      const mouseY = event.pageY
      const dragoverItemTop = __(dragoverItem).position().y
      const dragoverItemMiddleY = dragoverItemTop + (dragoverItem.clientHeight / 2)

      if (mouseY < dragoverItemMiddleY) {
        dragoverItem.classList.remove('can-drop-bottom')
        dragoverItem.classList.add('can-drop-top')
      } else {
        dragoverItem.classList.remove('can-drop-top')
        dragoverItem.classList.add('can-drop-bottom')
      }

      // enable drop event on this Element
      event.preventDefault()
    })

    /**
     * on DRAGLEAVE of a dragover item: remove all possible drop zone classes
     */
    options.dragoverEl.addEventListener('dragleave', (event) => {
      options.dragoverEl.classList.remove('can-drop-top')
      options.dragoverEl.classList.remove('can-drop-bottom')
    })
  }

  /**
   * on DRAGEND of a drag item. this triggers on the element that fired the dragstart event. 
   */
  options.dragEl.addEventListener('dragend', (event) => {
    // stops iOS from doing a google search with the dropped element HTML (lol?)
    event.preventDefault()

    // trigger dragend callback
    if ('onDragEnd' in options && typeof options.onDragEnd === 'function') {
      options.onDragEnd(event)
    }

    // cleanup only if the event was cancelled (let the drop event clean up valid drops)
    if (event.dataTransfer.dropEffect === 'none') {
      cleanUp()
    }
  })

  /**
   * on DROP of the dragged item: inject the item into the correct drop zone and remove the old one.
   */
  options.dropEl.addEventListener('drop', (event) => {    
    event.preventDefault()

    const droppedOn = options.dropEl
    const eventData = event.dataTransfer.getData('text/plain')
    let injected

    // inject the dragged item. if no drop zone class exists (because no dragOver event was registered), the item is dropped after.
    if (droppedOn.classList.contains('can-drop-top')) {
      injected = __(droppedOn).before(eventData)
    } else if (droppedOn.classList.contains('can-drop-bottom')) {
      injected = __(droppedOn).after(eventData)
    } else {
      injected = __(droppedOn).after(eventData)
    }
      
    // remove the original element that started the drag event now that it's been cloned into a new node
    __('.dragging').remove()

    injected.animate('fadeIn', 'speed-1s')

    // trigger onDrop callback if one was given
    if ('onDrop' in options && typeof options.onDrop === 'function') {
      options.onDrop(event, injected.el())
    }

    cleanUp()
  })
}

function cleanUp() {
  __('.can-drop-top').removeClass('can-drop-top')
  __('.can-drop-bottom').removeClass('can-drop-bottom')
  __('.dragging').removeClass('dragging')

  if (__('.fake-drag-image').els.length) {
    __('.fake-drag-image').remove()
  }
}