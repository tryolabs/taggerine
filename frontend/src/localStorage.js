const APP_KEY = 'taggerine-state'

const loadFromLocalStorage = (key = APP_KEY) => {
  const json = window.localStorage.getItem(key)
  const obj = JSON.parse(json)
  return obj
}

const saveToLocalStorage = (obj, key = APP_KEY) => {
  return window.localStorage.setItem(key, JSON.stringify(obj))
}

const cleanLocalStorage = () => {
  window.localStorage.removeItem(APP_KEY)
}

export { loadFromLocalStorage, saveToLocalStorage, cleanLocalStorage }
