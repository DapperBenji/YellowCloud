
import { getGlobalSettings } from './constants'
import { SettingType, Setting, KeyVal } from './types'

const body = document.getElementById('body')
const submit = document.getElementById('submit')

const settings: Setting[] = [
   new Setting("darkMode"),
   new Setting("fullwidthMode"),
   new Setting("listenerMode"),
   new Setting("hideHeaderMenu"),
   new Setting("hideFooterMenu"),
   new Setting("hideSidebar"),
   new Setting('hideTheUpload'),
   new Setting('hideBranding'),
   new Setting('input[name="displayType"]', null, SettingType.Display),
   new Setting('removePreviews'),
   new Setting('removePlaylists'),
   new Setting('removeLongTracks'),
   new Setting('removeUserActivity'),
   new Setting('removeReposts'),
   new Setting('hiddenOutline'),
   new Setting('profileImages'),
   new Setting('relatedActionMenu', 'moreActionMenu'),
   new Setting('tagActionMenu', 'moreActionMenu'),
   new Setting('artistActionMenu', 'moreActionMenu'),
   new Setting('trackActionMenu', 'moreActionMenu'),
   new Setting('disableUnfollower', 'settingsMenus'),
   new Setting('disableDiscoverToggle', 'settingsMenus')
]

chrome.storage.sync.get(getGlobalSettings, get => {
   settings.forEach((setting: Setting) => {
      const checkSetting: string = setting.namespace ?
         get[`${setting.namespace}.${setting.selector}`] :
         get[setting.selector]
      
      match(setting.type)
         .on((x: SettingType) => x === SettingType.Default, () => {
            if (checkSetting === 'on') {
               setting.getElement().checked = true
            }
         })
         .on((x: SettingType) => x === SettingType.Display, () => {
            if (get.displayType === "list") setting.getElement(1).checked = true
            else if (get.displayType === "grid") setting.getElement(2).checked = true
            else setting.getElement(0).checked = true
         })
   })
})

// Detect dark mode
chrome.storage.sync.get(['darkMode'], get => {
   
   if (get.darkMode === "on") body.setAttribute("darkmode", "");
});

// Populate settings dialogbox

submit.addEventListener("click", ()=> {
   const setGlobalSettings = {} as KeyVal
   settings.forEach((setting: Setting) => {

      match(setting.type)
         .on((x: SettingType) => x === SettingType.Default, () => {
            if (setting.getElement().checked !== true) {
               setGlobalSettings[setting.selector] = "off"
            }
         })
         .on((x: SettingType) => x === SettingType.Display, () => {
            const elements = [
               setting.getElement(0),
               setting.getElement(1),
               setting.getElement(2)
            ]

            elements.forEach(elm => {
               if (elm.checked === true) {
                  setGlobalSettings[setting.selector] = elm.value
               }
            })
         })
   })

   console.log(setGlobalSettings)

   /*
   // Store all options in chrome
   chrome.storage.sync.set(setGlobalSettings, ()=> {
      if (chrome.runtime.lastError) alert('Error settings:\n\n'+chrome.runtime.lastError);
      else location.reload();
   });*/
});
