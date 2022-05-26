import { KeyVal } from './types'
import { getGlobalSettings } from './constants'

const setGlobalSettings = {} as KeyVal

export const matched = (x: unknown) => ({
   on: () => matched(x),
   otherwise: () => x
})

export const match = (x: unknown) => ({
   on: (pred: Function, fn: Function) => (pred(x) ? matched(fn(x)) : match(x)),
   otherwise: (fn: Function) => fn(x)
})

// Insert Element node after a reference node
export const insertAfter = (newNode: HTMLElement, referenceNode: HTMLElement) => {
   referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling)
}

// Fetching data from local browser storage
export const getLocalStorage = (callback: () => void, localSettings?: string[]) => {
   const getSettings = localSettings || getGlobalSettings
   chrome.storage.local.get(getSettings, callback)
}

// Sending data to local browser storage
export const setLocalStorage = (callback: () => void, localSettings?: string[]) => {
   const setSettings = localSettings || setGlobalSettings
   const formattedCallback = () => {
      if (chrome.runtime.lastError) alert('Error settings:\n\n' + chrome.runtime.lastError)
      else if (callback) callback()
   }
   chrome.storage.local.set(setSettings, formattedCallback)
}

// Factory resets all YellowCloud created local browser storage
export const resetLocalStorage = (callback: () => void) => {
   chrome.storage.local.remove(getGlobalSettings, callback)
}

// Fetches browser cookie data by cookie name
export const getCookie = (cookieName: string) => {
   const name = `${cookieName}=`
   const cookies = document.cookie.split(';')
   const cookiesLength = cookies.length

   for (let i = 0; i < cookiesLength; i++) {
      let cookie = cookies[i]
      while (cookie.charAt(0) == ' ') cookie = cookie.substring(1)
      if (cookie.indexOf(name) == 0) return cookie.substring(name.length, cookie.length)
   }
}