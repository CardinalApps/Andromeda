import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

/**
 * The <track-table> is the custom element used for showing and sorting any number of tracks.
 * 
 * ### Public attributes:
 * 
 * - `cols`: An array of columns to use for the table header. Use column names from the database.
 * Some fields will automatically have their data morphed, eg. source will be shown as an icon. When omitted,
 * reasonable defaults will be used.
 */
export class TrackTable extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    this.boundNewTrackListener = this.onNewTrack.bind(this)
    this.boundColumnHeaderClick = this.onColumnHeaderClick.bind(this)
    this.boundTableRowPlay = this.onTableRowPlay.bind(this)

    // flag for when the table is executing a SQL query for the next page of tracks
    this.pageIsLoading = false

    // @listens new-track
    Bridge.ipcListen('new-track', this.boundNewTrackListener)

    this.Query = await new Query(this.buildQueryObj())

    // start manually observing attributes
    this.watchAttr(['ids', 'cols', 'order', 'orderby'], async (changes) => {
      __(this).attr('data-pages-loaded', 0)
      this.Query = await new Query(this.buildQueryObj())
      this.build()
    })
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/track-table/track-table.html')
    
    // reset the table
    __(this).find('tbody').html('')
    __(this).removeAttr('data-pages-loaded')

    this.renderTableHead()

    // nothing to show
    if (!this.Query.results.length) {
      return
    }
    
    this.insertBodyTracks(this.Query.results)

    // default attributes
    __(this).attr('data-pages-loaded', 1)

    // create the illusion of the page being totally loaded on first render
    let rowHeight = __(this).find('tbody tr:first-of-type').height()
    __('.track-table-outer').removeAttr('style')
    __('.track-table-outer').css({'min-height': rowHeight * this.Query.totalResults})
    __('.view-content').el().scrollTop = 0
  }

  /**
   * After the inner HTML has rendered.
   */
  onLoad() {
    this.registerEventListeners()
    this.attachEventHandlersToAllExistingChildren()
  }

  /**
   * When the element is removed from the DOM.
   */
  onRemoved() {
    // __('track-table thead th').off('click', this.boundColumnHeaderClick)
    // __('track-table tbody tr').off('dblclick', this.boundTableRowPlay)
    Bridge.removeListener('new-track', this.boundNewTrackListener)
  }

  /**
   * Builds the queryObj based on the Element attributes.
   */
  buildQueryObj() {
    let orderByAttr = __(this).attr('orderby')
    let orderAttr = __(this).attr('order')

    // if there is no data-pages-loaded attribute, set to 0
    let currentPage = __(this).attr('data-pages-loaded') || Number(0)

    let queryObj = {
      'table': 'music_tracks',
      'itemsPerPage': 175,
      'page': currentPage + 1,
      'join': [
        {
          'table': 'music_artists',
          'on': {
            'track_artist_id': 'id'
          }
        },
        {
          'table': 'music_releases',
          'on': {
            'track_release_id': 'id'
          }
        }
      ]
    }

    // we are ordering by a certain column, default to ASC
    if (orderByAttr) {
      queryObj.orderBy = {[orderByAttr]: orderAttr || 'ASC'}
    }

    return queryObj
  }

  /**
   * Registers the event listeners for this instance.
   * Event listeners for table rows and headers are attached directly to Elements as the
   * table renders.
   */
  registerEventListeners() {
    // register the infinite scroll handler
    this.supportInfiniteScroll(() => {
      this.onInfiniteScroll()
    }, '.view-content', 2000)
  }

  /**
   * Only called when the table was loaded from the cache.
   */
  attachEventHandlersToAllExistingChildren() {
    // all exisitng column headers
    __(this).find('thead th').each((el) => {
      el.addEventListener('click', this.boundColumnHeaderClick)
    })
  }

  /**
   * Whenever a new track is added to the database, add a new <tr> to the top of the
   * grid, regardless of sorting.
   */
  async onNewTrack(row, event) {
    let albumQuery = await new Query({
      'table': 'music_releases',
      'itemsPerPage': -1,
      'columns': {
        'id': row.track_release_id
      }
    })

    let artistQuery = await new Query({
      'table': 'music_artists',
      'itemsPerPage': -1,
      'columns': {
        'id': row.track_artist_id
      }
    })

    if (albumQuery.results.length) {
      row = {...albumQuery.results[0], ...row}
    }

    if (artistQuery.results.length) {
      row = {...artistQuery.results[0], ...row}
    }

    this._insertTbodyRow(row, 'top')
  }

  /**
   * Some columns show formatted data which doesn't sort well. This function takes that column name
   * and returns the column name that contains the same data but meant for sorting.
   * 
   * @param {string} colName - Database column name.
   * @returns {string} Returns the sortable column name if there is one, or the given name.
   */
  getSortableColName(colName) {
    if (colName === 'track_title') {
      return 'track_plaintext_title'
    } 
    else if (colName === 'trackartist_name') {
      return 'artist_plaintext_name'
    } 
    else if (colName === 'trackrelease_title') {
      return 'release_plaintext_title'
    } 
    else if (colName === 'track_duration_formatted') {
      return 'track_duration'
    }

    return colName
  }

  /**
   * Function fired when the column header is clicked.
   */
  onColumnHeaderClick(event) {
    if (__(event.target).hasClass('noclick')) return

    let clickedColValue = __(event.target).attr('data-col')

    // remove old classes
    __(this).find('thead .asc, thead .desc').removeClass('asc', 'desc')

    // for these columns, use the version meant for comparisons instead
    clickedColValue = this.getSortableColName(clickedColValue)

    let currentTableOrder = __(this).attr('order')
    let newTableOrder

    if (!currentTableOrder || currentTableOrder === '' || currentTableOrder === 'DESC') {
      newTableOrder = 'ASC'
    } else {
      newTableOrder = 'DESC'
    }

    // triggers a rerender
    __(this).attr('order', newTableOrder).attr('orderby', clickedColValue)
  }

  /**
   * When a table row is played, start playing that song.
   */
  onTableRowPlay(event) {
    console.log('DBL CLICK')
    let clickedTr = event.target

    if (!event.target.matches('tr')) {
      clickedTr = event.target.closest('tr')
    }

    Player.play([__(clickedTr).attr('data-id')])
  }

  /**
   * Triggered every time the user scrolls far enough down to trigger a load point.
   */
  async onInfiniteScroll() {
    // do nothing if already loading a page
    if (this.pageIsLoading) return

    this.pageIsLoading = true
    
    let pageToLoad = __(this).attr('data-pages-loaded') + 1

    // we have loaded all pages
    if (pageToLoad > this.Query.pages) {
      this.pageIsLoading = false
      return
    }
    
    // load the next page of results
    await this.Query.goToPage(pageToLoad)
    
    // inject the tracks of this page
    this.insertBodyTracks(this.Query.results)

    // update the attribute
    __(this).attr('data-pages-loaded', pageToLoad)

    this.pageIsLoading = false
  }

  /**
   * Returns the cols as set by the `cols` attribute, or false if explicitly set to false, or a
   * reasonable default if the attribute is omitted.
   */
  determineTableCols() {
    let cols = __(this).attr('cols')

    if (Array.isArray(cols)) {
      return cols
    }

    return ["track_title", "track_duration_formatted", "artist_name", "release_title", "track_source"]
  }

  /**
   * Renders the table head (column names). Will not render anything is `cols` is set to false.
   */
  renderTableHead() {
    let cols = this.determineTableCols()
    let thead = __(this).find('table thead')
    let currentlySorting = false

    if (__(this).attr('orderby') !== undefined) {
      currentlySorting = true
    }

    thead.html('<tr></tr>')
    let tr = thead.find('tr')

    for (let col of cols) {
      let filterResults = this._filterCol(col)
      let extraClasses = []

      // maybe don't render any text in the col
      if (!filterResults.clickable) {
        extraClasses.push('noclick')
      }

      // wrap non-empty names in a span
      if (filterResults.name !== '') {
        filterResults.name = /*html*/`<span>${filterResults.name}</span>`
      }

      // as we render the th's, make sure to visually show which one is applying the current sort
      if (currentlySorting) {
        let currentOrder = __(this).attr('order')
        let currentOrderby = __(this).attr('orderby')

        if (currentOrderby === this.getSortableColName(col)) {
          extraClasses.push(currentOrder.toLowerCase())
        }
      }

      let th = tr.appendHtml(/*html*/`<th class="${extraClasses.join(' ')}" data-col="${col}">${filterResults.name}</th>`)

      th.on('click', this.boundColumnHeaderClick)
    }
  }

  /**
   * Renders the table head (column names)
   */
  insertBodyTracks(tracks) {
    for (let track of tracks) {
      this._insertTbodyRow(track)
    }
  }

  /**
   * Inserts a single row into the table.
   * 
   * @param {object} track - Track row.
   * @param {string} position - Where to insert the row - `top` or `bottom`.
   */
  _insertTbodyRow(track, position = 'bottom') {
    let tbody = __(this).find('table tbody')
    let cols = this.determineTableCols()

    // this is here to prevent the infinite scroll from injecting duplicate tracks while the importer is running
    if (tbody.find(`tr[data-id="${track.id}"]`).els.length) {
      return
    }

    // inject the track row
    let trHtml = /*html*/`<tr data-id="${track.id}"></tr>`
    let tr

    if (position === 'top') {
      tr = tbody.prependHtml(trHtml)
    } else if (position === 'bottom') {
      tr = tbody.appendHtml(trHtml)
    }

    // add each cell into the row
    for (let col of cols) {
      let morphedContent = this._morphCellContent(col, track[col])

      tr.appendHtml(/*html*/`<td title="${morphedContent.title}" data-col="${col}">${morphedContent.content}</td>`)
    }

    // attach event handler to each tr
    tr.on('dblclick', this.boundTableRowPlay)
  }

  /**
   * Filters every column title (each <th>) while rendering to handle special cases.
   * 
   * @param {string} col - The column to be filterd.
   * @returns - An object with the string to use as the column name, and the key `clickable`,
   */
  _filterCol(col) {
    // defaults that get overwritten
    let returnObj = {
      'name': col,
      'clickable': true
    }

    switch (col) {
      case 'track_num':
        // track_num col has no name and is not clickable when showing all tracks
        if (__(this).attr('ids') === '*') {
          returnObj.name = ''
          returnObj.clickable = false
        }
        // and when showing anything else, it has no name but is clickable
        else {
          returnObj.name = ''
        }
        break

      // by default, all cols are clickable and use their name from i18n
      default:
        returnObj.name = i18n(`column.${col}`)
        break
    }

    return returnObj
  }

  /**
   * Morphs every column title (each <th>) while rendering to handle special cases.
   * 
   * @param {string} col - The column name.
   * @param {string} cellContent - The raw database value that might need to be filtered.
   * @returns - An object that contains the modified cell content, and a suitable title attribute for it.
   */
  _morphCellContent(col, cellContent) {
    let morphedCellContent
    let title

    switch (col) {
      // convert the source to an icon
      case 'track_source':
        if (cellContent === 'local') {
          morphedCellContent = /*html*/`<i class="fas fa-hdd" title="${i18n('source-icon.local.title')}"></i>`
          title = cellContent
        }
        break

      // by default, don't modify the cell content
      default:
        morphedCellContent = cellContent
        title = cellContent
        break
    }

    return {
      'content': morphedCellContent,
      'title': title
    }
  }
}