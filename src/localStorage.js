const APP_KEY = 'taggerine-state'

const loadFromLocalStorage = (key = APP_KEY) => {
  const json = window.localStorage.getItem(key)
  const obj = JSON.parse(json)
  return obj
}

const blacklistedFields = ['images', 'unprocessed', 'processed']

const saveToLocalStorage = (state, key = APP_KEY) => {
  const stateCopy = { ...state }
  blacklistedFields.forEach(field => {
    if (Object.keys(stateCopy).includes(field)) {
      delete stateCopy[field]
    }
  })
  const json = JSON.stringify(stateCopy)
  return window.localStorage.setItem(key, json)
}

const cleanLocalStorage = () => {
  window.localStorage.removeItem(APP_KEY)
}

export { loadFromLocalStorage, saveToLocalStorage, cleanLocalStorage }
