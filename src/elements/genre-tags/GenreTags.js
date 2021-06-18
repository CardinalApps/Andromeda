import __ from '../../../node_modules/double-u/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

export class GenreTags extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    //this.boundNewGenreListener = this.onNewGenre.bind(this)

    // @listens new-album
    //Bridge.ipcListen('new-genre', this.boundNewGenreListener)

    // observe attributes
    this.watchAttr(['ids'], (changes) => {
      this.render()
    })
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    // returns an unordered object of albums that we have to show
    this.Query = await new Query(this.buildQueryObj())
        
    // nothing to show
    if (!this.Query.results.length) {
      __(this).addClass('no-genres')
      return
    }

    for (let genreRow of this.Query.results) {
      __(this).appendHtml(this.createChildGenreTag(genreRow.id))
    }
  }

  /**
   * When this instance is removed from the DOM.
   */
  onRemoved() {
    //Bridge.removeListener('new-genre', this.boundNewGenreListener)
  }

  /**
   * Whenever a new genre is added to the Bridge, add a new genre to the top of the
   * tags, regardless of sorting. Adding to the top makes the action obvious. It would be
   * pointless to add items at the bottom.
   */
  onNewGenre(genre) {
    let isInScope = false

    if (__(this).attr('ids') === '*') {
      isInScope = true
    }

    if (isInScope) {
      __(this).removeClass('no-genres')
      __(this).prependHtml(this.createChildGenreTag(genre.id))
    }
  }

  /**
   * Determines what genres to show based on the attrs. Supported attrs are `ids` which takes an asterisk for 
   * all genres or an array of genre ID's.
   * 
   * @returns {object} An object where the keys are the album ID's and the values are the album meta,
   * in an undefined order.
   */
  buildQueryObj() {
    let queryObj = {
      'table': 'music_genres',
      'itemsPerPage': -1,
      'orderBy': {
        'genre_name': 'ASC'
      }
    }

    // maybe use ids attr
    if (__(this).attr('ids')) {
      let idsInAttr = __(this).attr('ids')

      // ids can be an asterisk, which signifies all genres in the collection
      if (idsInAttr === '*') {
        // do nothing
      }
      // if it's an array, assume an array of album ID's
      else if (Array.isArray(idsInAttr)) {
        queryObj.columns = {
          'id': idsInAttr,
          'equalityOperator': 'IN'
        }
      }
    }

    return queryObj
  }

  /**
   * Returns the markup for a child genre tag. The child genre tag will inherit some attributes
   * of this genre-tags element.
   */
  createChildGenreTag(genreId) {
    let canfavorite = __(this).attr('canfavorite') !== undefined ? 'canfavorite' : ''
    let large = __(this).attr('large') !== undefined ? 'large' : ''

    return /*html*/`<genre-tag genreid="${genreId}" ${large} ${canfavorite}></genre-tag>`
  }
}