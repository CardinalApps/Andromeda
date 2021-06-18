import __ from '../../node_modules/double-u/index.js'

export class Tooltip {
  /**
   * @param {object} data - Accepts an object with the follwing keys:
   * position: 'mouse' || 'elementTopCenter',
   */
  constructor(event, data) {
    let top = 0
    let left = 0
    let distanceBetweenTooltipAndElementTop = 15
    let appRoot = 'music-app'
    
    if (data.position === undefined || data.position === 'mouse') {
      top = event.clientY - distanceBetweenTooltipAndElementTop
      left = event.clientX
    } else if (data.position === 'elementTopCenter') {
      let elPos = __(event.target).position()

      top = elPos.y - distanceBetweenTooltipAndElementTop
      left = elPos.x + (event.target.offsetWidth / 2)
    }

    __(appRoot).appendHtml(/*html*/`
      <div id="${data.id}" class="the-tooltip">
        <div class="inner">
          ${data.message}
        </div>
      </div>
    `)

    __('#'+data.id)
    .css({
      'top': top,
      'left': left
    })
    .addClass('show')
  }
}

export function registerGlobalTooltipListener() {
  __('.tooltip').on('mouseover', __('music-app').el(), toolTipMouseoverListener)
}

function toolTipMouseoverListener(event) {
  new Tooltip(event, {
    'id': 'hover-tooltip',
    'position': 'elementTopCenter',
    'message': __(event.target).attr('data-tooltip')
  })

  // instead of listening for mouseleave, listen to the document for a hover on any other element,
  // because mouseleave wont trigger if the element is deleted while the tooltip is still open
  const mouseOffListener = (event) => {
    if (!event.target.matches('.tooltip')) {
      __('.the-tooltip#hover-tooltip').remove()
      document.removeEventListener('mouseover', mouseOffListener)
    }
  }

  document.addEventListener('mouseover', mouseOffListener)
}