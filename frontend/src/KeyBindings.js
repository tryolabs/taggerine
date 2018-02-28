export default function(e, nextHandler, prevHandler, addHandler, repeatHandler) {
  switch (e.keyCode) {
    case 39: // 'right'
    case 40: // 'down'
      nextHandler()
      break
    case 37: // 'left'
    case 38: // 'top'
      prevHandler()
      break
    case 65: // 'a'
    case 67: // 'c'
    case 78: // 'n'
      addHandler()
      break
    case 82: // 'r'
    case 86: // 'v'
    case 190: // '.'
      repeatHandler()
      break
    default:
      break
  }
}
