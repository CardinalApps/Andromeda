import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'
import * as forms from '../../../node_modules/cardinal-forms/index.js'

/**
 * Designed as a screen-locking overlay that the music-app decides when to show,
 * this allows the user to input server information and will save the
 * information in the database afterwards.
 */
export class ServerConnect extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    this.formSelector = 'form#create-server-connection'
    this.defaultServer = await __('music-app').el().getDefaultServer()

    let allServersQuery = await new Query({
      'table': 'servers',
      'itemsPerPage': -1,
      'mode': 'ipc',
      'prefix': 'music_'
    })
    this.allServers = allServersQuery.results
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/server-connect/server-connect.html')
  }

  /**
   * After the inner HTML has rendered.
   */
  async onLoad() {
    forms.prepare(this.querySelector('#create-server-connection'))

    __(this.formSelector).el().addEventListener('submit', this.onConnectionFormSubmit.bind(this))
    
    if (__(this).attr('message')) {
      this.setMessage(__(this).attr('message'))
    }

    this.autoFillForm()
  }

  /**
   * After this instance is removed.
   */
  async onRemoved() {

  }

  /**
   * Automatically fills the form with the host and IP if the user has already
   * given server details.
   */
  autoFillForm() {
    if (!this.defaultServer) return
    
    let defaultServerObj = this.allServers.filter(row => row.id === this.defaultServer.id)
        
    if (defaultServerObj.length) {
      defaultServerObj = defaultServerObj[0]
    } else {
      return
    }

    __(this).find('input[name="host"]').value(defaultServerObj.server_host)
    __(this).find('input[name="port"]').value(defaultServerObj.server_port_http)
  }

  /**
   * Handler for the submit event of the connection form.
   */
  async onConnectionFormSubmit(event) {
    event.preventDefault()

    this.hideMessage()

    if (!forms.validate(this.formSelector)) {
      return
    }

    // enter loading state
    __(this.formSelector).addClass('loading')

    const formValues = forms.getValues(__(this.formSelector).el())
    const musicApp = document.querySelector('music-app')
    
    console.log(`Attempting to connect to server at ${formValues.host}:${formValues.port}`)

    // attempt to connect to the server using the info the user gave
    const connectionSuccess = await musicApp.connectToServer(formValues.host, formValues.port)
    
    // short circuit if connection failed
    if (!connectionSuccess) {
      console.log('Connection failed')
      __(this.formSelector).removeClass('loading')
      this.setMessage('connection-failed')
      return
    }
    
    // check if these server details already exist in the db
    let existingServerInDbQuery = await new Query({
      'table': 'servers',
      'columns': {
        'server_host': formValues.host,
        'server_port_http': formValues.port
      },
      'mode': 'ipc',
      'prefix': 'music_'
    })

    let serverId

    // server doesn't exist in db? create it
    if (!existingServerInDbQuery.results.length) {
      let serverRow = await this.saveServerDetails(formValues.host, formValues.port)
      serverId = serverRow.id
      console.log('Saved server details in database')
    }
    // server exists in db? grab the id
    else {
      serverId = existingServerInDbQuery.results[0].id
    }

    console.log('server-connect using server ID', serverId)

    // if no default server exists in the options, set this one as the default
    if (!await musicApp.getDefaultServer()) {
      await Bridge.ipcAsk('set-option', {'option': 'default_server', 'value': serverId})
    }

    // exit loading state, enter success state
    __(this.formSelector).removeClass('loading').addClass('success')

    setTimeout(() => {
      this.reloadApp()
    }, 1000)
  }

  /**
   * Saves the server details after it was connected to.
   * 
   * @param {string} host
   * @param {string} port
   * @returns {object} Returns the new database row.
   */
  async saveServerDetails(host, port) {
    let created = await Bridge.ipcAsk('db-api', {
      'fn': 'createRow',
      'args': [
        'servers',
        {
          'server_name': null,
          'server_host': host,
          'server_port_http': port,
          'server_port_websockets': parseInt(port) + 1,
          'server_first_connected': Date.now(),
          'server_last_connected': Date.now()
        }
      ]
    })

    return created
  }

  /**
   * Reloads the app. Designed to be used after a successful connection. If the
   * connection was not successful and this was used, the app will reload and
   * the connection screen will end up showing again.
   */
  reloadApp() {
    console.log('Reloading app after successful server connection')
    // calling this will destroy this element since it's part of the app
    document.querySelector('music-app').render()
  }

  /**
   * Sets the message that the user sees when something happens.
   * 
   * @param {string} message - A predefined message.
   */
  setMessage(message) {
    this.hideMessage()

    switch (message) {
      // shown when the previously connected server could not be automatically
      // connected to on app startup
      case 'autoconnect-failed':
        __(this).find('.autoconnect-failed-message').show()
        break

      // shown when a new connection fails to the server that the user just typed in
      case 'connection-failed':
        __(this).find('.connection-failed-message').show()
        break
    }
  }

  /**
   * Hides whatever message is currently showing (if any).
   */
  hideMessage() {
    __(this).find('.message').hide()
  }
}