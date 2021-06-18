import __ from '../../../node_modules/double-u/index.js'
import i18n from '../../../node_modules/i18n.js/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

export class SearchBar extends Lowrider {
  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/search-bar/search-bar.html')
  }

  /**
   * After the HTML has rendered.
   */
  onLoad() {
    this.registerEventListeners()

    this.querySelector('input[type="search"]').addEventListener('focus', (event) => {
      __(event.target).parents('.input-outer').addClass('focused')
    })

    this.querySelector('input[type="search"]').addEventListener('blur', (event) => {
      __(event.target).parents('.input-outer').removeClass('focused')
    })
  }

  /**
   * Registers the event listeners for this instance.
   */
  registerEventListeners() {
    let input = this.querySelector('input[type="search"]')

    /**
     * On KEYUP of the search input
     */
    input.addEventListener('keyup', async (event) => {
      let value = input.value.trim()

      // if value is empty or less than 2 characters, restore the default sidebar state
      if (value === '' || value.length < 2) {
        this.restoreDefaultSidebarState()
        return
      }

      let results = await this.query(value)

      this.renderResults(results)
    })

    /**
     * on FOCUS of the search input: show the results if they exist from a previous search
     */
    input.addEventListener('focus', (event) => {
      if (__('#nav-pillar #search-typing-results .results, #nav-pillar #search-typing-results .no-results').els.length) {
        __('#nav-pillar').addClass('showing-search-results')
      }

      // when the search input is focused, create a new mousedown event hander on the document
      // that checks for when to hide the sidebar results. if the user clicked "outside" to blur,
      // hide the search results and delete this event handler
      const clickOutside = (event) => {
        // if the click was outsdie the <search-bar> and #search-typing-results elements
        if (
          !event.target.matches('search-bar') 
          && !event.target.closest('search-bar')
          && !event.target.matches('#search-typing-results') 
          && !event.target.closest('#search-typing-results')
          ) {
          __('#nav-pillar').removeClass('showing-search-results')
          document.removeEventListener('mousedown', clickOutside)
        }
      }

      document.addEventListener('mousedown', clickOutside)
    })

    /**
     * On SUBMIT of the search form.
     */
    __(this).find('form#search').on('submit', (event) => {
      event.preventDefault()
    })
  }

  /**
   * Performs a search for a string of text and returns the results.
   * 
   * @param {string} string - Any string of text to searh for.
   * @returns {object} An object of tracks, music releases, artists, etc.
   */
  async query(query) {
    let response = await Bridge.httpApi(`/search?q=${query}`)
    
    if (response.status !== 200) {
      console.warn('Something went wrong when searching.')
      return
    }

    return response.response
  }

  /**
   * Restores the default state of the sidebar.
   */
  restoreDefaultSidebarState() {
    __('#nav-pillar').removeClass('showing-search-results')
    __('#nav-pillar #search-typing-results').html('')
    //__('#nav-pillar search-bar input[type="search"]').el().value = ''
  }

  /**
   * Renders search results
   * 
   * @param {object} results - An object of search results, as returned by this.query()
   */
  renderResults(results) {
    const __navPillar = __('#nav-pillar')
    const __resultsDiv = __navPillar.find('#search-typing-results')

    //console.log('rendering results', results)

    // change UI to search results mode
    __navPillar.addClass('showing-search-results')

    // erase old results
    __resultsDiv.html('')

    // if the results are empty, just show a message
    let emptyResults = true

    for (let group in results) {
      if (Array.isArray(results[group]) && results[group].length) {
        emptyResults = false
      }
    }

    if (emptyResults) {
      __resultsDiv.appendHtml(/*html*/`<h5 class="no-results">${i18n('search.no-results')}</h5>`)
      return
    }

    const injectionOrder = ['genres', 'artists', 'musicReleases', 'playlists', 'tracks']

    // inject each group of results
    for (let group of injectionOrder) {
      // the results object must be an object that has a non empty results array
      if (!Array.isArray(results[group]) || !results[group].length) {
        continue
      }

      // create the group container and title
      __resultsDiv.appendHtml(/*html*/`
        <div class="results" data-group="${group}">
          <h5 class="group-title">${i18n(`search.group-title.${group}`)}</h5>
        </div>
      `)

      // inject each result into the container
      for (let obj of results[group]) {
        this._injectSingleResult(obj, group)
      }
    }
  }

  /**
   * Called by renderResults for each item that gets injected into the sidebar.
   */
  _injectSingleResult(dbRow, group) {
    let __group = __(`#search-typing-results .results[data-group="${group}"]`)

    switch (group) {
      case 'artists':
        __group.appendHtml(/*html*/`
          <p class="result">
            <a href="/artist/${dbRow.id}" class="router-link">
              <span tabindex="-1">${dbRow.artist_name}</span>
            </a>
          </p>
        `)
        break

      case 'musicReleases':
        __group.appendHtml(/*html*/`
          <p class="result">
            <a href="/music-release/${dbRow.id}" class="router-link">
              <span tabindex="-1">${dbRow.release_title}</span>
            </a>
          </p>
        `)
        break

      case 'tracks':
        __group.appendHtml(/*html*/`
          <p class="result">
            <a href="/music-release/${dbRow.track_release_id}" class="router-link">
              <span tabindex="-1">${dbRow.track_title}</span>
            </a>
          </p>
        `)
        break

      case 'genres':
        __group.appendHtml(/*html*/`
          <genre-tag genreid="${dbRow.id}" small></genre-tag>
        `)
        break

      case 'playlists':
        __group.appendHtml(/*html*/`
          <p class="result">
            <a href="/playlist/${dbRow.id}" class="router-link">
              <span tabindex="-1">${dbRow.playlist_name}</span>
            </a>
          </p>
        `)
        break
    }
  }
}