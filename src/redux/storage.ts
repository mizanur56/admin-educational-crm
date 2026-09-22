/**
 * Local storage adapter for redux-persist.
 * Vite's CJS interop can break `redux-persist/lib/storage` default export
 * (`storage.getItem is not a function`), which stalls PersistGate forever.
 */
const storage = {
  getItem(key: string) {
    try {
      return Promise.resolve(window.localStorage.getItem(key))
    } catch {
      return Promise.resolve(null)
    }
  },
  setItem(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      /* private mode / quota */
    }
    return Promise.resolve(value)
  },
  removeItem(key: string) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
    return Promise.resolve()
  },
}

export default storage
