const APP_KEY = 'taggerine-state'

const loadFromLocalStorage = (key = APP_KEY) => {
  const json = window.localStorage.getItem(key)
  const obj = JSON.parse(json)
  return obj
}

const saveToLocalStorage = (state, key = APP_KEY) => {
  const json = JSON.stringify(state)
  return window.localStorage.setItem(key, json)
}

export { loadFromLocalStorage, saveToLocalStorage }
