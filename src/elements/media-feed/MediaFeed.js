import __ from '../../../node_modules/double-u/index.js'
import { html } from '../../../node_modules/html.js/index.js'
import Query from '../../../node_modules/sqleary.js/index.js'
import Lowrider from '../../../node_modules/lowrider.js/index.js'

/**
 * The media feed presents a feed of music or cinema content for the user to consume.
 * 
 * Supported attributes:
 * 
 * - `type`: (required) `music` or `cinema`
 */
export class MediaFeed extends Lowrider {
  /**
   * When an instance of the element is created in the DOM.
   */
  async onSpawn() {
    this.type = __(this).attr('type')
    if (!this.type) throw new Error("<media-feed> requires the 'type' attribute")

    // the template pool holds templates that can be inserted on infinite
    // scroll. as the user scrolls, ID's will get depleted and templates will be
    // removed from this array when there is no content left for them. when this
    // array is empty, the feed has loaded all possible content.
    this.infiniteScrollTemplatePool = [
      'artist',
      'album',
      'genre'
    ]
  }

  /**
   * Builds the inner HTML.
   */
  async onBuild() {
    this.innerHTML = await html('/elements/media-feed/media-feed.html')
  
    // if the user does not have music, or we are waiting for an import to
    // finish, do not render further
    if (__('music-app').hasClass('no-music')) {
      return
    }

    if (!await this.checkIfEnoughMusic()) {
      __(this).attr('message', 'not-enough-music')
    }
  
    await this.insertFeedTop()
  }

  /**
   * After the inner HTML has rendered.
   */
  async onLoad() {
    // uncomment to enable infinite scroll
    // this.supportInfiniteScroll(this.onInfiniteScroll, '.view-content')
  }

  /**
   * After this instance is removed.
   */
  async onRemoved() {
    
  }

  /**
   * The media feed only needs to build once. After blocks are inserted, they
   * manage themselves.
   */
  shouldBuild() {
     if (__(this).find('.media-feed-block').els.length) {
       return false
     } else {
       return true
     }
  }

  /**
   * Triggered every time the user scrolls to the bottom of the feed.
   * 
   * A set of randomly generated blocks gets inserted.
   */
  async onInfiniteScroll() {
    let feed = __(this).find('.content-feed')

    if (feed.hasClass('loading')) return

    // enter loading state
    feed.addClass('loading')

    if (this.type === 'music') {
      await this.insertRandomMusicBlock()
    }

    feed.removeClass('loading')
  }

  /**
   * Checks if the user has added enough music to create a meaningful feed.
   */
  async checkIfEnoughMusic(minAlbums = 10) {
    let query = await new Query({
      'table': 'music_releases',
      'itemsPerPage': minAlbums
    })

    return query.results.length >= minAlbums
  }

  /**
   * Triggers a refresh of each block in the feed. Each block handles its own
   * refresh logic and is not guarenteed to reload any content.
   */
  async refreshFeedBlocks() {
    let blocks = __(this).find('.media-feed-block')

    // we have no blocks to refresh, insert new ones
    if (!blocks.els.length) {
      await this.insertFeedTop()
      return
    }

    // refresh all blocks
    blocks.each((el) => {
      if ('refresh' in el) {
        el.refresh()
      }
    })
  }

  /**
   * Removed the contents of the rendered feed from the document.
   */
  eraseFeed() {
    __(this).find('.content-feed').html('')
  }

  /**
   * Builds the top part of the feed, which is always a statically defined. This
   * will overwrite an existing feed.
   */
  async insertFeedTop() {
    let top = __(this).getTemplate('.static-top')

    this.eraseFeed()

    __(this).find('.content-feed').appendHtml(top)
  }

  /**
   * Returns a random random music block meant for insertion into the feed. The
   * pool of random blocks is limited to ones designed for use with infinite
   * scroll.
   */
  async insertRandomMusicBlock(numBlocks = 1) {
    let feed = __(this).find('.content-feed')

    // feed has already ended
    if (feed.hasClass('end')) return

    // if the template pool is empty, the feed has rendered all possible content
    if (!this.infiniteScrollTemplatePool.length) {
      feed.addClass('end')
      return
    }

    let randomTemplate = __().randomFromArray(this.infiniteScrollTemplatePool)
    let blockTemplate = await this.getBlockTemplate(randomTemplate)

    // if the block template is actually false, it means that all blocks for
    // this type have been rendered. this should happen once per block type.
    // now invoke this method recursively to try and make a new template. the
    // recursion stops when a new template is added, or the template pool is
    // totally empty.
    if (blockTemplate === false) {
      this.insertRandomMusicBlock()
    }

    feed.appendHtml(blockTemplate)
  }

  /**
   * Builds any block for any feed and returns a document fragment that can be
   * inserted directly into the feed.
   * 
   * @returns {(boolean|DocumentFragment)} - Returns a document fragment, or
   * false if all the possible blocks for this template are already showing.
   */
  async getBlockTemplate(templateName) {
    let blockTemplate = __(this).getTemplate(`.${templateName}`)
    
    if (templateName === 'artist') {
      let randomId = await this.getUnusedId('artist', 'music_artists', 'artistid')

      // if all ID's for this template have been used, remove this template from the pool
      if (!randomId) {
        console.log('Exhaused all <media-feed-artist> templates')
        this.infiniteScrollTemplatePool.splice(this.infiniteScrollTemplatePool.indexOf('artist'), 1)
        return false
      }

      // set the ID in the template
      __(blockTemplate).find('media-feed-artist').attr('artistid', randomId)
      
      return blockTemplate

    } else if (templateName === 'album') {
      let randomId = await this.getUnusedId('album', 'music_releases', 'albumid')

      // if all ID's for this template have been used, remove this template from the pool
      if (!randomId) {
        console.log('Exhaused all <media-feed-album> templates')
        this.infiniteScrollTemplatePool.splice(this.infiniteScrollTemplatePool.indexOf('album'), 1)
        return false
      }

      // set the ID in the template
      __(blockTemplate).find('media-feed-album').attr('albumid', randomId)
      
      return blockTemplate
      
    } else if (templateName === 'genre') {
      let randomId = await this.getUnusedId('genre', 'music_genres', 'genreid')

      // if all ID's for this template have been used, remove this template from the pool
      if (!randomId) {
        console.log('Exhaused all <media-feed-genre> templates')
        this.infiniteScrollTemplatePool.splice(this.infiniteScrollTemplatePool.indexOf('genre'), 1)
        return false
      }

      // set the ID in the template
      __(blockTemplate).find('media-feed-genre').attr('genreid', randomId)

      return blockTemplate
    }
  }
  
  /**
   * Returns an object of data about the blocks that currently exist in the feed.
   * 
   * @returns {object}
   */
  getExistingBlockData() {
    let feed = __(this).find('.content-feed')
    let feedBlocks = feed.find('.media-feed-block')
    
    return {
      'allBlocks': feedBlocks.els,
      'numBlocks': feedBlocks.els.length,
      'usedArtists': feed.find('.media-feed-block[artistid]').els.map(el => __(el).attr('artistid')),
      'usedAlbums': feed.find('.media-feed-block[albumid]').els.map(el => __(el).attr('albumid'))
    }
  }

  /**
   * Analyzes the rendered media feed and returns an artist ID that has not been
   * used yet.
   * 
   * @param {string} blockType - The type of block.
   * @param {string} objectType - The database table name.
   * @param {string} idAttrName - The name of the attribute in which the ID is stored..
   * @returns {(number|null)} Returns an ID if one was found, else null.
   */
  async getUnusedId(blockType, objectType, idAttrName) {
    let idsUsedByThisBlock = __(this).find(`media-feed-${blockType}`).els.map(el => __(el).attr(idAttrName))
    let randQuery

    //console.log(blockType, idsUsedByThisBlock)
    
    // no artists yet? use any random artist
    if (!idsUsedByThisBlock.length) {
      randQuery = await new Query({
        'table': objectType,
        'itemsPerPage': 1,
        'orderBy': 'rand'
      })
    } 
    // some blocks already showing? get a random ID that isn't one of their ID's
    else {
      randQuery = await new Query({
        'table': objectType,
        'itemsPerPage': 1,
        'columns': {
          'id': idsUsedByThisBlock
        },
        'equalityOperator': 'NOT IN',
        'orderBy': 'rand'
      })
    }

    if (randQuery.results.length) {
      return randQuery.results[0].id
    } else {
      return null
    }
  }
}