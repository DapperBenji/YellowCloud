// Global variables
const body = document.getElementById('body'),
submit = document.getElementById('submit'),
setGlobalSettings = {},
getGlobalSettings = ["darkMode", "listenerMode", "fullwidthMode", "moreActionMenu", "settingsMenus", "disableDiscoverToggle", "hideSidebar", "hideBranding", "displayType", "removePreviews", "removePlaylists", "removeLongTracks", "removeUserActivity", "removeReposts", "tagsArray", "filter", "hiddenOutline", "profileImages", "disableUnfollower", "discoverModules"];

// Detect dark mode
chrome.storage.sync.get(getGlobalSettings, get => {
   if (get.darkMode === "on") body.setAttribute("darkmode", "");
});

// Populate settings dialogbox
const darkModeInput = document.querySelector('#darkMode'),
fullwidthModeInput = document.querySelector('#fullwidthMode'),
listenerModeInput = document.querySelector('#listenerMode'),
hideHeaderMenuInput = document.querySelector('#hideHeaderMenu'),
hideFooterMenuInput = document.querySelector('#hideFooterMenu'),
hideSidebarInput = document.querySelector('#hideSidebar'),
hideTheUploadInput = document.querySelector('#hideTheUpload'),
hideBrandingInput =  document.querySelector('#hideBranding'),
displayTypeInput = document.querySelectorAll('input[name="displayType"]'),
removePreviewsInput = document.querySelector('#removePreviews'),
removePlaylistsInput = document.querySelector('#removePlaylists'),
removeLongTracksInput = document.querySelector('#removeLongTracks'),
removeUserActivityInput = document.querySelector('#removeUserActivity'),
removeRepostsInput = document.querySelector('#removeReposts'),
hiddenOutlineInput = document.querySelector('#hiddenOutline'),
profileImagesInput = document.querySelector('#profileImages'),
relatedActionMenuInput = document.querySelector('#relatedActionMenu'),
tagActionMenuInput = document.querySelector('#tagActionMenu'),
artistActionMenuInput = document.querySelector('#artistActionMenu'),
trackActionMenuInput = document.querySelector('#trackActionMenu'),
disableUnfollowerInput = document.querySelector('#disableUnfollower'),
disableDiscoverToggleInput = document.querySelector('#disableDiscoverToggle');

chrome.storage.sync.get(getGlobalSettings, get => {
   if (get.darkMode === "on") darkModeInput.checked = true;
   if (get.fullwidthMode === "on") fullwidthModeInput.checked = true;
   if (get.listenerMode === "on") listenerModeInput.checked = true;
   if (get.removeSettingsBtn === "on") removeSettingsBtnInput.checked = true;
   if (get.hideSidebar === "on") hideSidebarInput.checked = true;
   if (get.hideTheUpload === "on") hideTheUploadInput.checked = true;
   if (get.hideBranding === "on") hideBrandingInput.checked = true;
   if (get.oldUserProfile === "on") oldUserProfileInput.checked = true;
   if (get.displayType === "list") displayTypeInput[1].checked = true;
   else if (get.displayType === "grid") displayTypeInput[2].checked = true;
   else displayTypeInput[0].checked = true;
   if (get.removePreviews === "on") removePreviewsInput.checked = true;
   if (get.removePlaylists === "on") removePlaylistsInput.checked = true;
   if (get.removeLongTracks === "on") removeLongTracksInput.checked = true;
   if (get.removeUserActivity === "on") removeUserActivityInput.checked = true;
   if (get.removeReposts === "on") removeRepostsInput.checked = true;
   if (get.hiddenOutline === "on") hiddenOutlineInput.checked = true;
   if (get.profileImages === "on") profileImagesInput.checked = true;
   if (get.disableUnfollower === "on") disableUnfollowerInput.checked = true;
   if (get.disableDiscoverToggle === "on") disableDiscoverToggleInput.checked = true;
   if (get.moreActionMenu) {
      if (get.moreActionMenu.relatedActionMenu === "on") relatedActionMenuInput.checked = true;
      if (get.moreActionMenu.tagActionMenu === "on") tagActionMenuInput.checked = true;
      if (get.moreActionMenu.artistActionMenu === "on") artistActionMenuInput.checked = true;
      if (get.moreActionMenu.trackActionMenu === "on") trackActionMenuInput.checked = true;
   }
   if (get.settingsMenus) {
      if (get.settingsMenus.hideHeaderMenu === "on") hideHeaderMenuInput.checked = true;
      if (get.settingsMenus.hideFooterMenu === "on") hideFooterMenuInput.checked = true;
   }
});

submit.addEventListener("click", ()=> {
   const length = displayTypeInput.length, moreActionMenuObject = {}, sceButtonObject = {};
   for (let i = 0; i < length; i++)
      if (displayTypeInput[i].checked) displayTypeInput.value = displayTypeInput[i].value;

   if (darkModeInput.checked != true) darkMode.value = "off";
   if (fullwidthModeInput.checked != true) fullwidthMode.value = "off";
   if (listenerModeInput.checked != true) listenerMode.value = "off";
   if (hideSidebarInput.checked != true) hideSidebar.value = "off";
   if (hideBrandingInput.checked != true) hideBranding.value = "off";
   if (removePreviewsInput.checked != true) removePreviews.value = "off";
   if (removePlaylistsInput.checked != true) removePlaylists.value = "off";
   if (removeLongTracksInput.checked != true) removeLongTracks.value = "off";
   if (removeUserActivityInput.checked != true) removeUserActivity.value = "off";
   if (removeRepostsInput.checked != true) removeReposts.value = "off";
   if (hiddenOutlineInput.checked != true) hiddenOutline.value = "off";
   if (profileImagesInput.checked != true) profileImages.value = "off";
   if (disableUnfollowerInput.checked != true) disableUnfollower.value = "off";
   if (disableDiscoverToggleInput.checked != true) disableDiscoverToggle.value = "off";

   // More action menu
   if (relatedActionMenuInput.checked != true) moreActionMenuObject.relatedActionMenu = "off";
   else moreActionMenuObject.relatedActionMenu = "on";
   if (tagActionMenuInput.checked != true) moreActionMenuObject.tagActionMenu = "off";
   else moreActionMenuObject.tagActionMenu = "on";
   if (artistActionMenuInput.checked != true) moreActionMenuObject.artistActionMenu = "off";
   else moreActionMenuObject.artistActionMenu = "on";
   if (trackActionMenuInput.checked != true) moreActionMenuObject.trackActionMenu = "off";
   else moreActionMenuObject.trackActionMenu = "on";

   // SCE Buttons
   if (hideHeaderMenuInput.checked != true) sceButtonObject.hideHeaderMenu = "off";
   else sceButtonObject.hideHeaderMenu = "on";
   if (hideFooterMenuInput.checked != true) sceButtonObject.hideFooterMenu = "off";
   else sceButtonObject.hideFooterMenu = "on";

   setGlobalSettings.darkMode = darkMode.value;
   setGlobalSettings.fullwidthMode = fullwidthMode.value;
   setGlobalSettings.listenerMode = listenerMode.value;
   setGlobalSettings.hideSidebar = hideSidebar.value;
   setGlobalSettings.hideBranding = hideBranding.value;
   setGlobalSettings.displayType = displayTypeInput.value;
   setGlobalSettings.removePreviews = removePreviews.value;
   setGlobalSettings.removePlaylists = removePlaylists.value;
   setGlobalSettings.removeLongTracks = removeLongTracks.value;
   setGlobalSettings.removeUserActivity = removeUserActivity.value;
   setGlobalSettings.removeReposts = removeReposts.value;
   setGlobalSettings.hiddenOutline = hiddenOutline.value;
   setGlobalSettings.profileImages = profileImages.value;
   setGlobalSettings.disableUnfollower = disableUnfollower.value;
   setGlobalSettings.disableDiscoverToggle = disableDiscoverToggle.value;
   setGlobalSettings.moreActionMenu = moreActionMenuObject;
   setGlobalSettings.settingsMenus = sceButtonObject;

   // Store all options in chrome
   chrome.storage.sync.set(setGlobalSettings, ()=> {
      if (chrome.runtime.lastError) alert('Error settings:\n\n'+chrome.runtime.lastError);
      else location.reload();
   });
});
