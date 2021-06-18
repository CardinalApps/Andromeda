/**
 * @file
 * 
 * Helper functions for working with system level notifications.
 */

export async function create(title, description, image) {
  if (!await canSendNotification()) return

  
  let userGrantedPermission = window.localStorage.getItem('notification_on_song_change')
  if (!JSON.parse(userGrantedPermission)) return

  new window.Notification(title, {
    'body': description,
    'icon': image,
    'lang': Router.currentLang,
    'silent': true
  })
}

/**
 * Checks if we have permission on the system level to send notifications.
 * 
 * @returns {boolean}
 */
function canSendNotification() {
  return new Promise((resolve, reject) => {

    // if we already have permission
    if (window.Notification.permission === 'granted') {
      resolve(true)
    }

    // ask for permission unless the user exsplicity denied it
    if (window.Notification.permission !== 'denied') {
      window.Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    }
    
  })
}