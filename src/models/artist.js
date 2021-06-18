import __ from '../../node_modules/double-u/index.js'
import Query from '../../node_modules/sqleary.js/index.js'

/**
 * Returns an object representation of a track database row, plus a few other keys.
 * 
 * `albumImg`: A string contraining the entire <img> element for the album cover, or an empty string
 * if there is no cover.
 * 
 * `relatedAlbumsArray`: A stringified array of albums by the same artist, meant for an <album-grid> attribute.
 */
export async function modelFunction() {
  let contextId = Router.currentViewParams.id || null
  
  if (!contextId) throw new Error('Model could not determine context')

  // get single artist
  let artistQuery = await new Query({
    'table': 'music_artists',
    'columns': {
      'id': contextId
    }
  })
  
  if (!artistQuery.results.length) throw new Error('Model could not find artist in the database')

  let returnObj = artistQuery.results[0]
  returnObj.genres = JSON.stringify(await getGenres(contextId))
  returnObj.topTracks = JSON.stringify(await getTopTracks(contextId))

  if (returnObj.artist_photo) {
    let imagePath = __().__doubleSlashesOnWindowsOnly(returnObj.artist_photo.full)
    returnObj.artistBg = /*html*/`<div class="artist-bg" style="background-image: url('${imagePath}');"></div>`
  } else {
    returnObj.artistBg = ''
  }

  return returnObj
}

/**
 * If the user has playback history for this artist, get the most listened to
 * songs. If there's no playback history for this artist, get random songs.
 * 
 * @param {number} contextId - Artist ID.
 * @returns {array} An array of track ID's.
 */
async function getTopTracks(contextId) {
  let numTopTracks = 6
  let topTracksFromHistory = await Bridge.httpApi('/media-api', 'POST', {
    'fn': 'getArtistMostPlayedTracks',
    'args': [contextId]
  })

  let topTracksFromHistoryIds = topTracksFromHistory.response.map(topTrack => topTrack.id)
  
  // if we enough tracks from the history
  if (topTracksFromHistoryIds.length >= numTopTracks) {
    return topTracksFromHistoryIds.slice(0, numTopTracks)
  }

  // find other songs to that we have 12
  let mixedTopTrackIds = [...topTracksFromHistoryIds]
  
  let anyTracksQuery = await new Query({
    'table': 'music_tracks',
    'itemsPerPage': numTopTracks - mixedTopTrackIds.length,
    'columns': [
      {
        'id': mixedTopTrackIds,
        'equalityOperator': 'NOT IN'
      },
      {
        'track_artist_id': contextId,
        'equalityOperator': '='
      }
    ]
  })

  if (anyTracksQuery.results.length) {
    mixedTopTrackIds = [...mixedTopTrackIds, ...anyTracksQuery.results.map(trackRow => trackRow.id)]
  }
  
  return mixedTopTrackIds
}

/**
 * Returns all of the genres that an artist belongs to.
 * 
 * @param {number} contextId - Artist ID.
 * @returns {array} An array of genre ID's.
 */
async function getGenres(contextId) {
  let allTracksByArtistQuery = await new Query({
    'table': 'music_tracks',
    'itemsPerPage': -1,
    'columns': {
      'track_artist_id': contextId,
    }
  })
  
  // no tracks
  if (!allTracksByArtistQuery.results.length) return []

  // get all the track's genres
  let allGenresOfTheTracksQuery = await new Query({
    'table': 'music_track_meta',
    'itemsPerPage': -1,
    'columns': [
      {
        'meta_key': 'genre',
        'equalityOperator': '='
      },
      {
        'meta_object_id': allTracksByArtistQuery.results.map(row => row.id),
        'equalityOperator': 'IN'
      }
    ]
  })

  // no genres
  if (!allGenresOfTheTracksQuery.results.length) return []
  
  let genreIds = new Set()

  // add genre id's to the Set
  for (let trackMetaRow of allGenresOfTheTracksQuery.results) {
    genreIds.add(trackMetaRow.meta_value)
  }

  return Array.from(genreIds)
}