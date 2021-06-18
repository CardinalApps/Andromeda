import Lowrider from '../../../node_modules/lowrider.js/index.js'

export class CustomElement extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {

  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    // this.innerHTML = await __().getHtmlFromFile('/elements/_example/_example.html')
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

  }

  /**
   * Optionally register a custom render checker
   */
  // shouldRender() { return true }
}