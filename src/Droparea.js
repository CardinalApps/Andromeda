/**
 * @file
 * 
 * A tiny class for implementing file drops into the document. Supportes automatically
 * delegating the 'drop' events. Automatically toggles the class "drop-hovering".
 * 
 * Accepts an object like
 *    {
 *      'el': Element // element on which to listen for drops
 *      'onDrop': () => {} // called when something is dropped on the element
 *    }
 */
import __ from '../node_modules/double-u/index.js'

export default class Droparea {
  constructor(options) {
    this.selector = options.selector
    this.onDrop = options.onDrop

    __(this.selector).each((el) => {
      el.addEventListener('dragover', (event) => {
        event.preventDefault()
      })

      el.addEventListener('dragenter', (event) => {
        event.preventDefault()
        __(this.selector).el().classList.add('drop-hovering')
      })

      el.addEventListener('dragleave', (event) => {
        event.preventDefault()
        __(this.selector).el().classList.remove('drop-hovering')
      })

      el.addEventListener('drop', (event) => {
        let droppedItems = event.dataTransfer.files
    
        __(this.selector).el().classList.remove('drop-hovering')
        
        this.onDrop(event, droppedItems)
      })
    })
  }
}