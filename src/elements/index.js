import Lowrider from '../../node_modules/lowrider.js/index.js'

/**
 * <music-app>
 */
import { MusicApp } from './music-app/MusicApp.js'
Lowrider.register('music-app', MusicApp)

/**
 * <server-connect>
 */
import { ServerConnect } from './server-connect/ServerConnect.js'
Lowrider.register('server-connect', ServerConnect)

/**
 * <music-settings>
 */
import { MusicSettings } from './music-settings/MusicSettings.js'
Lowrider.register('music-settings', MusicSettings)
//window.MusicSettings = MusicSettings // TODO needed?

/**
 * <context-menu>
 */
import { ContextMenu } from './context-menu/ContextMenu.js'
Lowrider.register('context-menu', ContextMenu)

// a global ContextMenu ref is better than having almost every element import
// the context-menu for what feels like app-centric functionality
window.ContextMenu = ContextMenu

/**
 * <search-bar>
 */
import { SearchBar } from './search-bar/SearchBar.js'
Lowrider.register('search-bar', SearchBar)

/**
 * <dot-menu>
 */
import { DotMenu } from './dot-menu/DotMenu.js'
Lowrider.register('dot-menu', DotMenu)

/**
 * <playback-controls>
 */
import { PlaybackControls } from './playback-controls/PlaybackControls.js'
Lowrider.register('playback-controls', PlaybackControls)

/**
 * <playback-queue>
 */
import { PlaybackQueue } from './playback-queue/PlaybackQueue.js'
Lowrider.register('playback-queue', PlaybackQueue)

/**
 * <system-menu>
 */
import { SystemMenu } from './system-menu/SystemMenu.js'
Lowrider.register('system-menu', SystemMenu)

/**
 * <play-button>
 */
import { PlayButton } from './play-button/PlayButton.js'
Lowrider.register('play-button', PlayButton)

/**
 * <control-group>
 */
import { ControlGroup } from './control-group/ControlGroup.js'
Lowrider.register('control-group', ControlGroup)

/**
 * <track-table>
 */
import { TrackTable } from './track-table/TrackTable.js'
Lowrider.register('track-table', TrackTable)

/**
 * <track-list>
 */
import { TrackList } from './track-list/TrackList.js'
Lowrider.register('track-list', TrackList)

/**
 * <track-block>
 */
import { TrackBlock } from './track-block/TrackBlock.js'
Lowrider.register('track-block', TrackBlock)

/**
 * <genre-tags>
 */
import { GenreTags } from './genre-tags/GenreTags.js'
Lowrider.register('genre-tags', GenreTags)

/**
 * <genre-tag>
 */
import { GenreTag } from './genre-tag/GenreTag.js'
Lowrider.register('genre-tag', GenreTag)

/**
 * <playlist-list>
 */
import { PlaylistList } from './playlist-list/PlaylistList.js'
Lowrider.register('playlist-list', PlaylistList)

/**
 * <playlist-block>
 */
import { PlaylistBlock } from './playlist-block/PlaylistBlock.js'
Lowrider.register('playlist-block', PlaylistBlock)

/**
 * <album-grid>
 */
import { AlbumGrid } from './album-grid/AlbumGrid.js'
Lowrider.register('album-grid', AlbumGrid)

/**
 * <album-block>
 */
import { AlbumBlock } from './album-block/AlbumBlock.js'
Lowrider.register('album-block', AlbumBlock)

/**
 * <artist-grid>
 */
import { ArtistGrid } from './artist-grid/ArtistGrid.js'
Lowrider.register('artist-grid', ArtistGrid)

/**
 * <artist-block>
 */
import { ArtistBlock } from './artist-block/ArtistBlock.js'
Lowrider.register('artist-block', ArtistBlock)

/**
 * <track-slider>
 */
import { TrackSlider } from './track-slider/TrackSlider.js'
Lowrider.register('track-slider', TrackSlider)

/**
 * <album-slider>
 */
import { AlbumSlider } from './album-slider/AlbumSlider.js'
Lowrider.register('album-slider', AlbumSlider)

/**
 * <release-metadata>
 */
 import { ReleaseMetadata } from './release-metadata/ReleaseMetadata.js'
 Lowrider.register('release-metadata', ReleaseMetadata)

/**
 * <media-feed>
 */
import { MediaFeed } from './media-feed/MediaFeed.js'
Lowrider.register('media-feed', MediaFeed)

/**
 * <media-feed-top-albums>
 */
import { MediaFeedTopAlbums } from './media-feed-top-albums/MediaFeedTopAlbums.js'
Lowrider.register('media-feed-top-albums', MediaFeedTopAlbums)

/**
 * <media-feed-top-tracks>
 */
import { MediaFeedTopTracks } from './media-feed-top-tracks/MediaFeedTopTracks.js'
Lowrider.register('media-feed-top-tracks', MediaFeedTopTracks)

/**
 * <media-feed-shuffle-music>
 */
import { MediaFeedShuffleMusic } from './media-feed-shuffle-music/MediaFeedShuffleMusic.js'
Lowrider.register('media-feed-shuffle-music', MediaFeedShuffleMusic)

/**
 * <media-feed-recently-played-albums>
 */
import { MediaFeedRecentlyPlayedAlbums } from './media-feed-recently-played-albums/MediaFeedRecentlyPlayedAlbums.js'
Lowrider.register('media-feed-recently-played-albums', MediaFeedRecentlyPlayedAlbums)

/**
 * <media-feed-recently-added-albums>
 */
import { MediaFeedRecentlyAddedAlbums } from './media-feed-recently-added-albums/MediaFeedRecentlyAddedAlbums.js'
Lowrider.register('media-feed-recently-added-albums', MediaFeedRecentlyAddedAlbums)

/**
 * <media-feed-albums-with-favorites>
 */
import { MediaFeedAlbumsWithFavorites } from './media-feed-albums-with-favorites/MediaFeedAlbumsWithFavorites.js'
Lowrider.register('media-feed-albums-with-favorites', MediaFeedAlbumsWithFavorites)

/**
 * <media-feed-artist>
 */
import { MediaFeedArtist } from './media-feed-artist/MediaFeedArtist.js'
Lowrider.register('media-feed-artist', MediaFeedArtist)