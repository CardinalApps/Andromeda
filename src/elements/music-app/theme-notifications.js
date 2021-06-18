import __ from '../../../node_modules/double-u/index.js'

const notificationRoot = '#theme-notifications'

/**
 * Creates a theme notification.
 * 
 * @param {object} params - An object with the following optional keys:
 * - `id` (String) - a string to be used as the element ID attribute
 * - `title` (String)
 * - `message` (String)
 * - `level` (Interger) - 1=Normal, 2=Green, 3=Yellow, 4=Red, default is 1
 * - `onClick` (Function) Your function will be given the click `event` as the first arg.
 */
export function create(params) {
  let idAttr = ''
  let levelClass = 'level-1'

  if ('id' in params) {
    idAttr = params.id
  }

  if ('level' in params) {
    levelClass = `level-${params.level}`
  }

  __(notificationRoot).prependHtml(/*html*/`
    <div id="${idAttr}" class="theme-notification ${levelClass}">
      <button class="body">
        <div tabindex="-1">
          <p class="title">${params.title}</p>
          <div class="message">${params.message}</div>
        </div>
      </button>
      <button class="remove"><i class="fas fa-times-circle" tabindex="-1"></i></button>
    </div>
  `)

  let createdEl = __('#theme-notifications').firstChild()

  // listen for clicks on the notificaition body
  if ('onClick' in params) {
    createdEl.el().addEventListener('click', (event) => {
      params.onClick(event)
    })
  }

  // listen for clicks on the remove button of the notification
  createdEl.find('button.remove').el().addEventListener('click', (event) => {
    event.stopPropagation()
    __(event.target).closest('.theme-notification').remove()
  })
}