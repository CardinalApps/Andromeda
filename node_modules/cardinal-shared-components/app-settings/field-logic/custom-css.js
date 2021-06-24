/**
 * Callback function for when the custom_css field in the settings panel changes.
 * 
 * This function is designed to be given directly to
 * <settings-panel>.registerCallback()
 *
 * @param {string} optionName
 * @param {string} newValue
 * @param {object} event
 */
 export function onCustomCssChange(optionName, newValue, event) {
  if (optionName !== 'custom_css') return

  window.localStorage.setItem('custom_css', newValue)

  // Bridge.ipcAsk('set-option', {
  //   'option': 'accent_color',
  //   'value': color
  // })
      
  document.querySelector('#app').injectCustomCss()
}