import { modelFunction as albumModelFunction } from './music-release.js'
import { modelFunction as artistModelFunction } from './artist.js'
import { modelFunction as genreModelFunction } from './music-genre.js'
import { modelFunction as playlistModelFunction } from './playlist.js'

const models = {
  'music-release': albumModelFunction,
  'artist': artistModelFunction,
  'music-genre': genreModelFunction,
  'playlist': playlistModelFunction
}

export default models