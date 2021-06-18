const { webFrame } = require('electron')

/**
 * Prints to the console the webFrame memory usage.
 * 
 * @param {number} seconds
 */
export function printWebFrameResourceUsage(seconds = 5) {
  console.log(`Now printing webFrame memory usage every ${seconds} seconds`)

  function format(str) {
    return str + ' | '
  }
  
  function getMemory() {
    function logMemDetails(x) {
      function toMb(bytes) {
        return (bytes / (1000.0 * 1000)).toFixed(2)
      }
  
      console.log(
        format(x[0]),
        format(x[1].count),
        format(toMb(x[1].size) + "MB"),
        format(toMb(x[1].liveSize) +"MB")
      )
    }
  
    console.log(
      format("object"),
      format("count"),
      format("size"),
      format("liveSize")
    )

    Object.entries(webFrame.getResourceUsage()).map(logMemDetails)
    console.log('------')
  }
  
  setInterval(getMemory, seconds * 1000)
}

/**
 * Clears the webFrame cache.
 */
export function clearWebFrameCache() {
  console.log('Clearing Electron webFrame cache')
  webFrame.clearCache()
}