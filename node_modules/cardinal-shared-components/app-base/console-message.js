export default function consoleMessage() {
  // color index
  console.groupCollapsed('%cC'+'%co'+'%cl'+'%co'+'%cu'+'%cr'+' '+'%cI'+'%cn'+'%cd'+'%ce'+'%cx',
    'font-weight:600; font-size:14px; color:red;',
    'font-weight:600; font-size:14px; color:white;',
    'font-weight:600; font-size:14px; color:red;',
    'font-weight:600; font-size:14px; color:white;',
    'font-weight:600; font-size:14px; color:red;',
    'font-weight:600; font-size:14px; color:white;',
    'font-weight:600; font-size:14px; color:red;',
    'font-weight:600; font-size:14px; color:white;',
    'font-weight:600; font-size:14px; color:red;',
    'font-weight:600; font-size:14px; color:white;',
    'font-weight:600; font-size:14px; color:red;',
  )
  console.log('%cOrange: Main process announcements', 'color:#f39a11;')
  console.log('%cGreen: Bridge object instance', 'color:#5fb64a;')
  console.log('%cBlue: UI Router object instance', 'color:#47aac9;')
  console.log('%cPink: Audio playback', 'color:#d61fd0;')
  console.log('Default: Other')
  console.groupEnd()
}