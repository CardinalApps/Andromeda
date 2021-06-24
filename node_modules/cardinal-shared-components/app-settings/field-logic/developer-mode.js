/**
 * Callback function for when the developer_mode field in the settings panel changes.
 * 
 * This function is designed to be given directly to
 * <settings-panel>.registerCallback()
 *
 * @param {string} optionName
 * @param {string} newValue
 * @param {object} event
 */
 export function onDeveloperModeChange(optionName, newValue, event) {
  if (optionName !== 'developer_mode') return

  window.localStorage.setItem('developer_mode', newValue)
      
  document.querySelector('#app').maybeEnableDeveloperMode()
}