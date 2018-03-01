export default function(nextHandler, prevHandler, addHandler, repeatHandler) {
  document.onkeydown = e => {
    if (e.target.localName.toLowerCase() === 'input') return
    switch (e.keyCode) {
      case 39: // 'right'
      case 40: // 'down'
        nextHandler()
        break
      case 37: // 'left'
      case 38: // 'top'
        prevHandler()
        break
      case 67: // alt + 'c'
        if (e.altKey) addHandler()
        break
      case 86: // alt + 'v'
        if (e.altKey) repeatHandler()
        break
      default:
        break
    }
  }
}
