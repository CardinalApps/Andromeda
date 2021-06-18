/**
 * Callback function for when the color_swatch field in the settings panel changes.
 * 
 * This function is designed to be given directly to
 * <settings-panel>.registerCallback()
 *
 * @param {string} optionName
 * @param {string} newValue
 * @param {object} event
 */
 export function onAccentColorChange(optionName, newValue, event) {
  if (optionName !== 'accent_color') return

  window.localStorage.setItem('accent_color', newValue)

  // Bridge.ipcAsk('set-option', {
  //   'option': 'accent_color',
  //   'value': color
  // })
  
  let active = event.target.closest('.settings-panel').querySelector('.swatches .active')
  if (active) {
    active.classList.remove('active')
  }
  
  event.target.closest('label').classList.add('active')
  document.documentElement.style.setProperty('--accent-color', newValue)
}