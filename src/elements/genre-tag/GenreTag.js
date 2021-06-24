import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'
import * as modal  from '../../modal.js'

export class GenreTag extends Lowrider {
  async onSpawn() {

  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    let genreId = __(this).attr('genreid')
    let genreQuery = await new Query({
      'table': 'music_genres',
      'columns': {
        'id': genreId
      }
    })

    if (!genreQuery.results.length) throw new Error('Could not find genre for <genre-tag>')

    this.genreRow = genreQuery.results[0]

    // cached for use on right click later
    __(this).attr('genre-name', this.genreRow.genre_name)

    this.innerHTML = await html('/elements/genre-tag/genre-tag.html', this.genreRow)

    if (await this.isFavorite()) {
      __(this).addClass('is-favorite')
    }

    //__(this).addClass('has-context-menu-items')
  }

  /**
   * After the inner HTML has rendered.
   */
  onLoad() {
    this.registerEventHandlers()
  }

  /**
   * Registers event handlers for this instance.
   */
  registerEventHandlers() {
    let tag = this

    // on click of the star
    this.querySelector('.toggle-favorite').addEventListener('click', async (event) => {
      // must be left click
      if (event.which !== 1) {
        return
      }

      // this genre is already a favorite, remove it
      if (await this.isFavorite()) {
        await this.removeGenreFromFavorites()
        __(tag).removeClass('is-favorite')
      }
      // it's not already a favorite, add it
      else {
        await this.addGenreToFavorites()
        __(tag).addClass('is-favorite')
      }
    })
  }

  /**
   * Context menu items.
   * 
   * @returns {array}
   */
  // getContextMenuItems() {
  //   let genreId = __(this).attr('genreid')
  //   let genreName = __(this).attr('genre-name')

  //   return [{
  //     'group': genreName,
  //     'items': {
  //       /**
  //        * Edit Genre
  //        */
  //       [i18n('genre-tag.context-menu.edit-genre')]: {
  //         'cb': (rightClickedEl) => {
  //           if (__('#metadata-editor-modal').els.length) {
  //             modal.close('metadata-editor-modal')
  //           }

  //           modal.show(this.closest('music-app'), `<metadata-editor genreid="${genreId}"></metadata-editor>`, {
  //             'id': 'metadata-editor-modal',
  //             'mode': 'floating'
  //           })

  //           ContextMenu.closeAllContextMenus()
  //         }
  //       }
  //     }
  //   }]
  // }

  /**
   * Queries the database for the current favorite genres
   * 
   * @returns {array} An array of genres, maybe empty.
   * 
   * TODO
   */
  async getFavorites() {
    return []
    //let genres = await Bridge.ipcAsk('get-option', 'favorite_genres')

    // no favorites in the db
    if (!genres) {
      return []
    }

    return genres
  }

  /**
   * Checks whether this genre tag is in the favorites.
   */
  async isFavorite() {
    let favorites = await this.getFavorites()

    // empty favorites array in the db
    if (!favorites.length) {
      return false
    }

    let genreId = __(this).attr('genreid')

    if (favorites.includes(genreId)) {
      return true
    }
  }

  /**
   * Adds this genre to the favorites.
   */
  async addGenreToFavorites() {
    let genreId = __(this).attr('genreid')
    let favorites = await this.getFavorites()

    if (!favorites.includes(genreId)) {
      favorites.push(genreId)
      await Bridge.ipcAsk('set-option', {'option': 'favorite_genres', 'value': favorites})
    }
  }

  /**
   * Removes this genre from the favorites.
   */
  async removeGenreFromFavorites() {
    let genreId = __(this).attr('genreid')
    let favorites = await this.getFavorites()

    if (favorites.includes(genreId)) {
      favorites.splice(favorites.indexOf(genreId), 1)
      await Bridge.ipcAsk('set-option', {'option': 'favorite_genres', 'value': favorites})
    }
  }
}