/**
 * @file
 * 
 * Special items in the context menu are items that provide extra functionality beyond just triggering
 * a callback function.
 */
import __ from '../../../node_modules/double-u/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'

/**
 * Add to playlist special item. This item renders a list of all playlists from the database into a dropdown,
 * and when one is clicked, tracks will be added to that playlist.
 * 
 * @param {object} options - An object of options with the following keys:
 * - `el` -  The `.context-menu-item` to render into in an existing `<context-menu>`.
 * - `idsToAdd` - An ID or array of ID's to add to the playlist that the user selects.
 */
export async function addToPlaylist(options = {}) {
  let menuItem = __(options.el)

  // wrap a numerical ID into a single item array
  if (typeof options.idsToAdd === 'number') {
    options.idsToAdd = [options.idsToAdd]
  }

  if (menuItem.find('.submenu').els.length) {
    return
  }

  // inject the submenu with a loading icon
  menuItem.appendHtml(/*html*/`
    <div class="submenu-box entry-animation">
      <ol class="submenu">
        ${await __().getFileContents('/images/loading.svg')}
      </ol>
    </div>
  `)

  let subMenu = menuItem.find('.submenu')
  let contextMenu = menuItem.closest('context-menu')

  // fetch all playlists
  let playlistsQuery = await new Query({
    'table': 'music_playlists',
    'itemsPerPage': -1
  })

  // remove loading svg
  menuItem.find('.loading').remove()

  menuItem.addClass('open')

  // user has no playlists, show a "create playlist" button
  if (!playlistsQuery.results.length) {
    let createPlaylistC2A = contextMenu.find('template.menu-item').getTemplate()
    __(createPlaylistC2A).find('a').attr('href', '/playlists').addClass('router-link')
    __(createPlaylistC2A).find('span[tabindex="-1"]').html(i18n('playlist-list.empty-message'))

    subMenu.appendHtml(createPlaylistC2A)
    return
  }

  // show all playlists in the drop down
  for (let playlist of playlistsQuery.results) {
    let newButton = subMenu.appendHtml(/*html*/`
      <button type="button" class="add context-menu-item" data-playlist-id="${playlist.id}">
        <span tabindex="-1">${playlist.playlist_name}</span>
      </button>
    `)

    // add an event listener to the new button
    const addToPlaylistHandler = async (event) => {
      event.preventDefault()
      event.stopPropagation()

      // if keyboard, enter or space only
      if (event instanceof KeyboardEvent) {
        if (event.code !== 'Space' && event.code !== 'Enter') {
          return
        }
      }

      let playlistTracks = playlist.playlist_track_ids

      if (!Array.isArray(playlistTracks)) {
        playlistTracks = []
      }

      for (let newId of options.idsToAdd) {
        playlistTracks.push(newId)
      }

      // perform the update
      let success = await Bridge.httpApi('/db-api', 'POST', {
        'fn': 'update',
        'args': [
          'music_playlists',
          playlist.id,
          {'playlist_track_ids': playlistTracks}
        ]
      })

      if (success) {
        ContextMenu.closeAllContextMenus()
      } else {
        throw new Error('Error updating database with new playlist tracks')
      }
    }    

    newButton.on('click', addToPlaylistHandler)
    newButton.on('keydown', addToPlaylistHandler)
  }
}