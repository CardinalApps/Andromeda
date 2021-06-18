import __ from '../../node_modules/double-u/index.js'
import Query from '../../node_modules/sqleary.js/index.js'
import i18n from '../../node_modules/i18n.js/index.js'

/**
 * Model for the single genre view.
 */
export async function modelFunction() {
  let contextId = Router.currentViewParams.id || null
  
  if (!contextId) throw new Error('Model could not determine context')

  let genreQuery = await new Query({
    'table': 'music_genres',
    'columns': {
      'id': contextId
    }
  })
  
  if (!genreQuery.results.length) throw new Error('Model could not find genre in the database')

  let returnObj = genreQuery.results[0]
  returnObj.artistGridTitle = i18n('view.genre.artist-grid-title').replace('{{genre}}', returnObj.genre_name)
  returnObj.albumGridTitle = i18n('view.genre.album-grid-title').replace('{{genre}}', returnObj.genre_name)
  
  let tracksInGenreQuery = await new Query({
    'table': 'music_tracks',
    'itemsPerPage': -1,
    'join': {
      'table': 'music_track_meta',
      'on': {
        'id': 'meta_object_id'
      }
    },
    'columns': {
      'meta_key': 'genre',
      'meta_value': returnObj.id
    }
  })

  if (!tracksInGenreQuery.results.length) {
    return returnObj
  }

  returnObj.artistIds = JSON.stringify(getGenreArtists(tracksInGenreQuery.results))
  returnObj.albumIds = JSON.stringify(getGenreAlbums(tracksInGenreQuery.results))
    
  return returnObj
}

/**
 * Returns an array of artist ID's.
 */
function getGenreArtists(genreTracks) {
  let artistIds = new Set()

  for (let trackRow of genreTracks) {
    artistIds.add(trackRow.track_artist_id)
  }

  return Array.from(artistIds)
}

/**
 * Returns an array of album ID's.
 */
function getGenreAlbums(genreTracks) {
  let albumIds = new Set()

  for (let trackRow of genreTracks) {
    albumIds.add(trackRow.track_release_id)
  }

  return Array.from(albumIds)
}