import __ from '../../packages/double-u/index.js'
import i18n from '../../i18n.js'
import Query from '../../packages/Query.js/index.js'
import Lowrider from '../../packages/Lowrider.js/index.js'
import * as forms from '../../forms.js'
import * as modal from '../../modal.js'

/**
 * The metadata-editor presents forms to the user for editing music metadata.
 * The editor typically exists in a floating modal, but can be used anywhere.
 *
 * Form data is validated by the editor, then sent to the main process
 * collection API updater functions, which handle data processing.
 *
 * Only one form can exist at a time per metadata-editor instance.
 *
 * The metadata-editor supports the following attributes:
 *
 * - `albumid`: (Unique) The ID of the album to edit.
 * - `artistid`: (Unique) The ID of the artist to edit.
 * - `trackid`: (Unique) The ID of the track to edit.
 */
export class MetadataEditor extends Lowrider {
  /**
   * On spawn.
   */
  async onSpawn() {
    // only register once
    if (!this.isWatching) {
      this.watchAttr(['artistid', 'albumid', 'trackid', 'playlistid'], () => {
        this.render()
      })

      this.isWatching = true
    }
  }

  /**
   * Renders the correct form based on the instance attributes.
   */
  async onBuild() {
    let artistIdAttr = __(this).attr('artistid')
    let albumIdAttr = __(this).attr('albumid')
    let trackIdAttr = __(this).attr('trackid')
    let playlistIdAttr = __(this).attr('playlistid')
    let genreIdAttr = __(this).attr('genreid')

    if (artistIdAttr) {
      this.thingType = 'artist'
      this.thingId = artistIdAttr
      this.renderArtistForm()
    } else if (albumIdAttr) {
      this.thingType = 'album'
      this.thingId = albumIdAttr
      this.renderAlbumForm()
    } else if (trackIdAttr) {
      this.thingType = 'track'
      this.thingId = trackIdAttr
      this.renderTrackForm()
    } else if (playlistIdAttr) {
      this.thingType = 'playlist'
      this.thingId = playlistIdAttr
      this.renderPlaylistForm()
    } else if (genreIdAttr) {
      this.thingType = 'genre'
      this.thingId = genreIdAttr
      this.renderGenreForm()
    }
  }

  /**
   * Overwrites instance contents with the artist editing form.
   */
  async renderArtistForm() {
    let artistId = __(this).attr('artistid')

    let artistQuery = await new Query({
      'table': `artists`,
      'columns': {
        'id': artistId
      }
    })
  
    if (!artistQuery.results.length) throw new Error('Metadata editor could not find context in database.')

    let artist = artistQuery.results[0]
    
    // make database row and other vars available to the form template
    let replacements = {
      'modalTitle': i18n('metadata-editor.editing-artist.title'),
      'artworkPath': artist.artist_photo ? artist.artist_photo['full'] : '',
      ...artist
    }

    this.innerHTML = await __().getHtmlFromFile('/elements/metadata-editor/forms/edit-artist.html', replacements)

    this.props.subtitle = artist.artist_name
    let formEl = this.querySelector('form')

    // build form elements
    forms.prepare(formEl)

    // register submit handler on the form
    formEl.addEventListener('submit', this.formSubmitHandler.bind(this))
  }

  /**
   * Overwrites instance contents with the album editing form.
   */
  async renderAlbumForm() {
    let albumId = __(this).attr('albumid')

    let albumQuery = await new Query({
      'table': `albums`,
      'columns': {
        'albums.id': albumId
      },
      'join': {
        'table': 'music_artists',
        'on': {
          'album_artist_id': 'id'
        }
      }
    })
  
    if (!albumQuery.results.length) throw new Error('Metadata editor could not find context in database.')

    let album = albumQuery.results[0]
    
    // make database row and other vars available to the form template
    let replacements = {
      'modalTitle': i18n('metadata-editor.editing-album.title'),
      'artworkPath': album.album_artwork ? Object.values(album.album_artwork)[0]['full'] : '',
      ...album
    }

    this.innerHTML = await __().getHtmlFromFile('/elements/metadata-editor/forms/edit-album.html', replacements)

    this.props.subtitle = album.release_title
    let formEl = this.querySelector('form')

    // build form elements
    forms.prepare(formEl)

    this.highlightGuesses()

    // register submit handler on the form
    formEl.addEventListener('submit', this.formSubmitHandler.bind(this))
  }

  /**
   * Overwrites instance contents with the track editing form.
   */
  async renderTrackForm() {
    let trackId = __(this).attr('trackid')

    let trackQuery = await new Query({
      'table': `tracks`,
      'columns': {
        'tracks.id': trackId
      },
      'join': [
        {
          'table': 'music_releases',
          'on': {
            'track_release_id': 'id'
          }
        },
        {
          'table': 'music_artists',
          'on': {
            'track_artist_id': 'id'
          }
        }
      ]
    })
  
    if (!trackQuery.results.length) throw new Error('Metadata editor could not find context in database.')

    let trackRow = trackQuery.results[0]
    
    // make database row and other vars available to the form template
    let replacements = {
      'modalTitle': i18n('metadata-editor.editing-track.title'),
      'genreIds': JSON.stringify(trackRow.track_genre_ids),
      ...trackRow
    }

    // we need to explode the discs object
    if (typeof trackRow.track_disc === 'object' && trackRow.track_disc !== null) {
      replacements.thisDisc = trackRow.track_disc.no
      replacements.totalDiscs = trackRow.track_disc.of
    }

    //console.log(replacements)

    this.innerHTML = await __().getHtmlFromFile('/elements/metadata-editor/forms/edit-track.html', replacements)

    this.props.subtitle = trackRow.track_title
    let formEl = this.querySelector('form')

    // build form elements
    forms.prepare(formEl)

    this.highlightGuesses()

    // register submit handler on the form
    formEl.addEventListener('submit', this.formSubmitHandler.bind(this))
  }

  /**
   * Overwrites instance contents with the artist editing form.
   */
  async renderPlaylistForm() {
    let playlistId = __(this).attr('playlistid')

    let playlistQuery = await new Query({
      'table': `playlists`,
      'columns': {
        'id': playlistId
      }
    })
  
    if (!playlistQuery.results.length) throw new Error('Metadata editor could not find context in database.')

    let playlist = playlistQuery.results[0]
    
    // make database row and other vars available to the form template
    let replacements = {
      'modalTitle': i18n('metadata-editor.editing-playlist.title'),
      ...playlist
    }

    this.innerHTML = await __().getHtmlFromFile('/elements/metadata-editor/forms/edit-playlist.html', replacements)

    this.props.subtitle = playlist.playlist_name
    let formEl = this.querySelector('form')

    // build form elements
    forms.prepare(formEl)

    // register submit handler on the form
    formEl.addEventListener('submit', this.formSubmitHandler.bind(this))
  }

  /**
   * Overwrites instance contents with the artist editing form.
   */
  async renderGenreForm() {
    let genreId = __(this).attr('genreid')

    let genreQuery = await new Query({
      'table': `genres`,
      'columns': {
        'id': genreId
      }
    })
  
    if (!genreQuery.results.length) throw new Error('Metadata editor could not find context in database.')

    let genre = genreQuery.results[0]
    
    // make database row and other vars available to the form template
    let replacements = {
      'modalTitle': i18n('metadata-editor.editing-genre.title'),
      ...genre
    }

    this.innerHTML = await __().getHtmlFromFile('/elements/metadata-editor/forms/edit-genre.html', replacements)

    this.props.subtitle = genre.genre_name
    let formEl = this.querySelector('form')

    // build form elements
    forms.prepare(formEl)

    // register submit handler on the form
    formEl.addEventListener('submit', this.formSubmitHandler.bind(this))
  }

  /**
   * A copy of this method gets attached directly as the submit handler function
   * for all forms, with the metadata-editor instance bound as `this`. Do not
   * call this method directly, as it is designed to be used only as an event
   * handler.
   *
   * When any metadata-editor form is submitted, this handler will validate the
   * form, and if valid, send the form data to the collection API in the main
   * process, which will handle updating the database.
   *
   * @param {Event} event - Submit event generated by the browser.
   */
  async formSubmitHandler(event) {
    event.preventDefault()

    // if the user is trying to edit the currently playing track, prevent it
    if (this.thingType === 'track' && this.thingId === Player.currentlyPlayingId) {
      alert(i18n('metadata-editor.cannot-edit-currently-playing-song-warning'))
      return
    }

    let form = __(this.querySelector('form'))

    // prevent submission while loading and while in success state
    if (form.hasClass('loading') || form.hasClass('success')) {
      return
    }

    // enter loading state
    form.addClass('loading')

    // validate the form. will automatically show validations errors in the form
    let valid = form.validate()
    console.log('form is valid?', valid)

    if (!valid) {
      form.removeClass('loading')
      return
    }

    let formValues = form.getFormValues()
    let apiFn

    switch(this.thingType) {
      case 'artist':
        apiFn = 'updateArtist'
        break

      case 'album':
        apiFn = 'updateAlbum'
        break

      case 'track':
        apiFn = 'updateTrack'
        break
      
      case 'playlist':
        apiFn = 'updatePlaylist'
        break

      case 'genre':
        apiFn = 'updateGenre'
        break
    }

    //console.log('form values', formValues)

    // send the form values to the main process API
    let updateResult = await Bridge.ipcAsk('media-api', {
      'fn': apiFn,
      'args': [this.thingId, formValues]
    })

    //console.log('update result', updateResult)

    form.removeClass('loading')

    if (updateResult.success) {
      form.addClass('success')
      this.onUpdateSuccess(updateResult)
    } else {
      // main process can ask for approval during edit; if the user cancels
      // then exit loading state without an error
      if ('reason' in updateResult && updateResult.reason === 'user-cancel') {
        form.removeClass('loading')
      } 
      // if the edit failed without user cancel, there must've been an error
      else {
        form.addClass('error')
        form.find('.editing-title').after(/*html*/`<div class="submission-error">${i18n('metadata-editor.api-update-failed')}</div>`)
      }
    }
  }

  /**
   * After a form (any form) is successfully updated, this will look for other
   * components in the document that now need to be rerendered or removed.
   *
   * The goal is to avoid a full page refresh, but on some views, depending what
   * the user edits, we have no choice but to refresh or navigate away.
   *
   * @param {object} updateResults - Update results object from the main
   * process.
   */
  onUpdateSuccess(updateResults) {
    // if the thing we are editing was deleted, we need to reload the form with
    // the new ID
    if ('deleted' in updateResults) {
      let tableName = this.thingType + 's'
      
      // if this form thing ID was deleted
      if (
          (Array.isArray(updateResults.deleted[tableName]) && updateResults.deleted[tableName].includes(this.thingId))
          || updateResults.deleted[tableName] === this.thingId
         ) {
        // wait 2 seconds for the success animation to finish
        setTimeout(() => {
          let newId = Array.isArray(updateResults.deleted[tableName]) ? updateResults.updated[tableName][0] : updateResults.updated[tableName]
          __(this).attr(`${this.thingType}id`, newId)
        }, 2000)
      }
    }

    // if we are on the single-whatever layout for this object that we just
    // edited, we need to refresh the page.
    if (Router.currentRoute.includes(`/${this.thingType}/:id`)) {
      Router.refresh()

      // updating the page will refresh all view Elements, no need to proceed
      return
    }

    // remove deleted things from the document
    if ('deleted' in updateResults) {
      for (let [deletedTableNameWithoutPrefix, deletedIdsInTable] of Object.entries(updateResults.deleted)) {
        // wrap singular values in an array
        if (typeof deletedIdsInTable === 'string' || typeof deletedIdsInTable === 'number') {
          deletedIdsInTable = [deletedIdsInTable]
        }

        // delete Elements, except this one
        for (let deletedId of deletedIdsInTable) {
          // depluralize the table name
          let thing = deletedTableNameWithoutPrefix.slice(0, -1)

          __(`[${thing}id="${deletedId}"]`).each((el) => {
            if (el !== this) {
              __(el).remove()
            }
          })
        }
      }
    }

    // rerender all updated things in the document, except this form
    if ('updated' in updateResults) {
      for (let [updatedTableNameWithoutPrefix, updatedIdsInTable] of Object.entries(updateResults.updated)) {
        // wrap singular ID's in an array
        if (typeof updatedIdsInTable === 'string' || typeof updatedIdsInTable === 'number') {
          updatedIdsInTable = [updatedIdsInTable]
        }

        // update Elements, except this one
        for (let updatedId of updatedIdsInTable) {
          // depluralize the table name
          let thing = updatedTableNameWithoutPrefix.slice(0, -1)

          __(`[${thing}id="${updatedId}"]`).each((el) => {
            if ('render' in el && el !== this) {
              el.render()
            }
          })
        }
      }
    }

    // if a track number or track disc number was updated, refresh all track-lists's
    if ('tracks' in updateResults.updated) {
      if (
        (updateResults.rowBeforeUpdate.track_num !== updateResults.rowAfterUpdate.track_num) ||
        (JSON.stringify(updateResults.rowBeforeUpdate.track_disc) !== JSON.stringify(updateResults.rowAfterUpdate.track_disc))
        ) {
        __('track-list').each(el => el.render())
      }
    }

    // if track genres were updated, refresh all album-blocks that are in the
    // "full" layout
    if ('tracks' in updateResults.updated) {
      if (JSON.stringify(updateResults.rowBeforeUpdate.track_genre_ids) !== JSON.stringify(updateResults.rowAfterUpdate.track_genre_ids)
        ) {
        __('album-block[layout="full"]').each(el => el.render())
      }
    }

    let newSubtitle = __(this).find('input.use-as-subtitle')

    // update the subtitle using form data instead of doing a new query.
    if (newSubtitle.els.length) {
      this.props.subtitle = newSubtitle.value()
    }

    // cached views may now contain stale data, always clear the view cache
    Router.deleteViewCache()
  }

  /**
   * Checks the database for Smart Fill Guesses that might have been made for
   * this form, and highlights the appropiate fields.
   *
   * The artist edit form does not show guessed fields, because it's impossible
   * to tell exactly when an artist was created during import, and whether it
   * was a guess at the time. For example, "Green Day" might have been guessed,
   * but then later during that same import, a file with the correct "Green Day"
   * metadata might have been encountered, which renders the previous guess
   * irrelevent even though technically the artist "Green Day" was created on a
   * guess.
   *
   * The same is technically true for albums, but I figure that it's far less
   * likley to be a problem since people tend to obtain all tracks for an album
   * at the same time and thus the metadata should be the same between tracks.
   * Regardless, album guesses are pulled from the first track of the album
   * that's encountered during import.
   */
  async highlightGuesses() {
    if (this.thingType === 'album') {
      this.highlightAlbumGuesses()
    } else if (this.thingType === 'track') {
      this.highlightTrackGuesses()
    }
  }

  /**
   * Highlights guesses for the album edit form.
   */
  async highlightAlbumGuesses() {
    // get the guesses that were made during import (if any) from the first song
    // on the album. it's not possible to know which exact song metadata
    // resulted in the creation of a particular album during import. that data
    // isn't kept (it's just whichever file the importer encounters first on the
    // local disk) and it would only serve to complicate anyway.
    let firstSongOnAlbumQuery = await new Query({
      'table': 'music_tracks',
      'itemsPerPage': 1,
      'columns': {
        'track_release_id': this.thingId
      }
    })

    if (!firstSongOnAlbumQuery.results.length) return

    let firstSongRowOnAlbum = firstSongOnAlbumQuery.results[0]
    let guessesQuery = await new Query({
      'table': 'meta',
      'columns': {
        'meta_object_id': firstSongRowOnAlbum.id,
        'meta_object_type': 'track',
        'meta_key': 'smart-fill-guesses'
      }
    })

    // no guesses were made
    if (!guessesQuery.results.length) return

    let guesses = guessesQuery.results[0].meta_value
    let fieldsWithGuesses = []
    let form = __(this).find('form')

    if ('release_title' in guesses) {
      fieldsWithGuesses = [...fieldsWithGuesses, form.find('[name="release_title"]').els]
    }

    if ('albumartist' in guesses) {
      fieldsWithGuesses = [...fieldsWithGuesses, form.find('[name="foreign_artist_name"]').els]
    }

    if (fieldsWithGuesses.length) {
      for (let fieldEl of fieldsWithGuesses) {
        this.decorateSmartFillGuessField(fieldEl)
      }
    }
  }

  /**
   * Highlights guesses for the track edit form.
   */
  async highlightTrackGuesses() {
    // get the guesses that were made during import (if any)
    let guessesQuery = await new Query({
      'table': 'meta',
      'columns': {
        'meta_object_id': this.thingId,
        'meta_object_type': 'track',
        'meta_key': 'smart-fill-guesses'
      }
    })

    // no guesses were made
    if (!guessesQuery.results.length) return

    let guesses = guessesQuery.results[0].meta_value
    let fieldsWithGuesses = []
    let form = __(this).find('form')

    if ('title' in guesses) {
      fieldsWithGuesses = [...fieldsWithGuesses, form.find('[name="track_title"]').els]
    }

    if ('release_title' in guesses) {
      fieldsWithGuesses = [...fieldsWithGuesses, form.find('[name="track_release_id"]').els]
    }

    if ('albumartist' in guesses) {
      fieldsWithGuesses = [...fieldsWithGuesses, form.find('[name="track_artist_id"]').els]
    }

    if ('track_num' in guesses) {
      fieldsWithGuesses = [...fieldsWithGuesses, form.find('[name="track_num"]').els]
    }

    if (fieldsWithGuesses.length) {
      for (let fieldEl of fieldsWithGuesses) {
        this.decorateSmartFillGuessField(fieldEl)
      }
    }
  }

  /**
   * Injects the brain icon into the fields that have been guessed.
   */
  decorateSmartFillGuessField(fieldEl) {
    let icon = /*html*/`<i class="fas fa-brain tooltip smart-fill-guess-icon" data-tooltip="${i18n('metadata-editor.smart-fill-guess.tooltip')}"></i>`

    __(fieldEl).closest('.field').addClass('smart-fill-guess').find('.label-text').appendHtml(icon)
  }
}