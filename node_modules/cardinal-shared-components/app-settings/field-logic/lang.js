/**
 * Callback function for when the language field in the settings panel changes.
 * The moment the language is changed, the entire <music-app> becomes stale and
 * must be rerendered.
 * 
 * This function is designed to be given directly to
 * <settings-panel>.registerCallback()
 *
 * @param {string} optionName
 * @param {string} newValue
 * @param {object} event
 */
export function onLangChange(optionName, newValue, event) {
  if (optionName !== 'lang') return

  console.log('Rerendering #app to change language')

  // set the new lang, the app will read this value on rerender
  Router.setLang(newValue)

  // the app is a Lowrider component
  const app = document.querySelector('#app')

  app.classList.remove('settings-open')
  app.render()
}