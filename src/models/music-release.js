import __ from '../../node_modules/double-u/index.js'
import Query from '../../node_modules/sqleary.js/index.js'

/**
 * Returns an object representation of a album database row, plus a few other keys.
 * 
 * `albumImg`: A string contraining the entire <img> element for the album cover, or an empty string
 * if there is no cover.
 * 
 * `relatedAlbumsArray`: A stringified array of albums by the same artist, meant for an <album-grid> attribute.
 */
export async function modelFunction() {
  let contextId = Router.currentViewParams.id || null
  
  if (!contextId) throw new Error('Model could not determine context')

  let albumQuery = await new Query({
    'table': 'music_releases',
    'join': {
      'table': 'music_artists',
      'on': {
        'release_primary_artist_id': 'id'
      }
    },
    'columns': {
      'music_releases.id': contextId
    }
  })

  if (!albumQuery.results.length) throw new Error('Model could not find album in the database')

  let albumRow = albumQuery.results[0]
  let returnObj = albumRow

  if (!albumQuery.results.length) throw new Error('Model could not find album in the database')

  // related albums attribute value
  returnObj.albumArtist = ''
  returnObj.artistAlbums = JSON.stringify(await getArtistAlbums(albumRow.release_primary_artist_id))

  return returnObj
}

/**
 * Returns all albums by this artist
 * 
 * @param {number} contextId - Album ID.
 * @returns {array}
 */
async function getArtistAlbums(artistId) {
  let albumsQuery = await new Query({
    'table': 'music_releases',
    'itemsPerPage': -1,
    'columns': {
      'release_primary_artist_id': artistId
    },
    'orderBy': {
      'release_year': 'DESC'
    }
  })

  if (!albumsQuery.results.length) throw new Error('The albumsQuery should at least always find the currently showing album')

  return albumsQuery.results.map(trackRow => trackRow.id)
}