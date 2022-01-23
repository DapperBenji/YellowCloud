const getGlobalSettings = [
   "debug",
   "darkMode", 
   "listenerMode",
   "settingsMenus", 
   "fullwidthMode",
   "moreActionMenu",
   "removeSettingsBtn",
   "disableDiscoverToggle",
   "hideSidebar",
   "hideBranding",
   "displayType",
   "removePreviews", 
   "removePlaylists",
   "removeLongTracks",
   "removeUserActivity",
   "removeReposts",
   "tagsArray",
   "filter",
   "hiddenOutline",
   "profileImages",
   "disableUnfollower",
   "discoverModules"
]
const setGlobalSettings = {}

// Fetching data from local browser storage
export const getLocalStorage = async (callback: () => void, localSettings?: string[]) => {
   const getSettings = localSettings || getGlobalSettings
   await chrome.storage.local.get(getSettings, callback)
};

// Sending data to local browser storage
export const setLocalStorage = async (callback: () => void, localSettings = null) => {
   const setSettings = localSettings || setGlobalSettings;
   const _formattedCallback = () => {
      if (chrome.runtime.lastError) alert('Error settings:\n\n' + chrome.runtime.lastError);
      else if (callback) callback();
   };
   await chrome.storage.local.set(setSettings, _formattedCallback);
};

// Factory resets all YellowCloud created local browser storage
export const resetLocalStorage = async (callback: () => void) => {
   await chrome.storage.local.remove(getGlobalSettings, callback);
};

// Fetches browser cookie data by cookie name
export const getCookie = cookieName => {
   const _name = cookieName + "=",
      _cookies = document.cookie.split(';'),
      _cookiesLength = _cookies.length;
   for (let i = 0; i < _cookiesLength; i++) {
      let cookie = _cookies[i];
      while (cookie.charAt(0) == ' ') cookie = cookie.substring(1);
      if (cookie.indexOf(_name) == 0) return cookie.substring(_name.length, cookie.length);
   }
   return "";
};