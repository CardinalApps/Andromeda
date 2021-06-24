/**
 * Callback function for when the color_theme field in the settings panel changes.
 * 
 * This function is designed to be given directly to
 * <settings-panel>.registerCallback()
 *
 * @param {string} optionName
 * @param {string} newValue
 * @param {object} event
 */
 export function onColorThemeChange(optionName, newValue, event) {
  if (optionName !== 'color_theme') return

  document.querySelector('#app').setAttribute('color-theme', newValue)
}