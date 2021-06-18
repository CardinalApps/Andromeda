import __ from '../../node_modules/double-u/index.js'
import Query from '../../node_modules/sqleary.js/index.js'

/**
 * Returns an object of model data for the single playlist.
 * 
 * @returns {object}
 */
export async function modelFunction() {
  let contextId = Router.currentViewParams.id || null
  
  if (!contextId) throw new Error('Model could not determine context')

  // get single playlist
  let playlistQuery = await new Query({
    'table': 'music_playlists',
    'columns': {
      'id': contextId
    }
  })
  
  if (!playlistQuery.results.length) throw new Error('Model could not find playlist in the database') 

  let returnObj = playlistQuery.results[0]

  return returnObj
}