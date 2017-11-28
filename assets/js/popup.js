// Global variables
var body = document.getElementById('body');
var submit = document.getElementById('submit');
var getGlobalSettings = [];

//Get settings from chrome storage
getGlobalSettings.push('darkMode');
getGlobalSettings.push('removeSettingsBtn');
getGlobalSettings.push('hideSidebar');
getGlobalSettings.push('hideTheUpload');
getGlobalSettings.push('oldUserProfile');
getGlobalSettings.push('displayType');
getGlobalSettings.push('removePreviews');
getGlobalSettings.push('removePlaylists');
getGlobalSettings.push('removeLongTracks');
getGlobalSettings.push('removeUserActivity');
getGlobalSettings.push('removeReposts');
getGlobalSettings.push('tagsArray');
getGlobalSettings.push('relatedContext');
getGlobalSettings.push('bannedContext');
getGlobalSettings.push('hiddenOutline');
getGlobalSettings.push('profileImages');

// Detect dark mode
chrome.storage.sync.get(getGlobalSettings, function(get){
   if(get.darkMode == "on"){
      body.setAttribute("data-theme", "dark");
   }
});

// Populate settings dialogbox
var darkModeInput = document.getElementById('darkMode');
var removeSettingsBtnInput = document.getElementById('removeSettingsBtn');
var hideSidebarInput = document.getElementById('hideSidebar');
var hideTheUploadInput = document.getElementById('hideTheUpload');
var oldUserProfileInput = document.getElementById('oldUserProfile');
var displayTypeInput = document.getElementsByName("displayType");
var removePreviewsInput = document.getElementById("removePreviews");
var removePlaylistsInput = document.getElementById("removePlaylists");
var removeLongTracksInput = document.getElementById("removeLongTracks");
var removeUserActivityInput = document.getElementById("removeUserActivity");
var removeRepostsInput = document.getElementById('removeReposts');
var skipTagsInput = document.getElementById("skipTags");
var relatedContextInput = document.getElementById("relatedContext");
var bannedContextInput = document.getElementById("bannedContext");
var hiddenOutlineInput = document.getElementById("hiddenOutline");
var profileImagesInput = document.getElementById("profileImages");

chrome.storage.sync.get(getGlobalSettings, function(get) {
   if (get.darkMode == "on") {
      darkModeInput.checked = true;
   }
   if (get.removeSettingsBtn == "on") {
      removeSettingsBtnInput.checked = true;
   }
   if (get.hideSidebar == "on") {
      hideSidebarInput.checked = true;
   }
   if (get.hideTheUpload == "on") {
      hideTheUploadInput.checked = true;
   }
   if (get.oldUserProfile == "on") {
      oldUserProfileInput.checked = true;
   }
   if (get.displayType == "list") {
      displayTypeInput[1].checked = true;
   } else if (get.displayType == "grid") {
      displayTypeInput[2].checked = true;
   } else {
      displayTypeInput[0].checked = true;
   }
   if (get.removePreviews == "on") {
      removePreviewsInput.checked = true;
   }
   if (get.removePlaylists == "on") {
      removePlaylistsInput.checked = true;
   }
   if (get.removeLongTracks == "on") {
      removeLongTracksInput.checked = true;
   }
   if (get.removeUserActivity == "on") {
      removeUserActivityInput.checked = true;
   }
   if (get.removeReposts == "on") {
     removeRepostsInput.checked = true;
   }
   if (get.tagsArray != null) {
      skipTagsInput.setAttribute("value", get.tagsArray);
   }
   if (get.relatedContext == "on") {
      relatedContextInput.checked = true;
   }
   if (get.bannedContext == "on") {
      bannedContextInput.checked = true;
   }
   if (get.hiddenOutline == "on") {
      hiddenOutlineInput.checked = true;
   }
   if (get.profileImages == "on") {
      profileImagesInput.checked = true;
   }
});

// Load tags properly in the settings menu
setTimeout(function() {
   insignia(skipTags, {
      delimiter: ',',
      deletion: true
   });
}, 100);

submit.addEventListener('click', function() {
   var setGlobalSettings = {};

   // Data handling
   if (darkModeInput.checked != true) {
      darkModeInput.value = "off";
   }
   if (removeSettingsBtnInput.checked != true) {
      removeSettingsBtnInput.value = "off";
   }
   if (hideSidebarInput.checked != true) {
      hideSidebarInput.value = "off";
   }
   if (hideTheUploadInput.checked != true) {
      hideTheUploadInput.value = "off";
   }
   if (oldUserProfileInput.checked != true) {
      oldUserProfileInput.value = "off";
   }
   for (var i = 0, length = displayTypeInput.length; i < length; i++) {
      if (displayTypeInput[i].checked) {
         displayTypeInput.value = displayTypeInput[i].value;
         break;
      }
   }
   if (removePreviewsInput.checked != true) {
      removePreviewsInput.value = "off";
   }
   if (removePlaylistsInput.checked != true) {
      removePlaylistsInput.value = "off";
   }
   if (removeLongTracksInput.checked != true) {
      removeLongTracksInput.value = "off";
   }
   if (removeUserActivityInput.checked != true) {
      removeUserActivityInput.value = "off";
   }
   if (removeRepostsInput.checked != true) {
     removeRepostsInput.value = "off";
   }
   if (relatedContextInput.checked != true) {
      relatedContextInput.value = "off";
   }
   if (bannedContextInput.checked != true) {
      bannedContextInput.value = "off";
   }
   if (hiddenOutlineInput.checked != true) {
      hiddenOutlineInput.value = "off";
   }
   if (profileImagesInput.checked != true) {
      profileImagesInput.value = "off";
   }

   var tagsArray = [];
   var tagElement = document.getElementsByClassName("nsg-tag");
   for (var i = 0; i < tagElement.length; i++) {
      tagsArray.push(tagElement[i].innerText);
   }

   setGlobalSettings.darkMode = darkModeInput.value;
   setGlobalSettings.removeSettingsBtn = removeSettingsBtn.value;
   setGlobalSettings.hideSidebar = hideSidebarInput.value;
   setGlobalSettings.hideTheUpload = hideTheUploadInput.value;
   setGlobalSettings.oldUserProfile = oldUserProfileInput.value;
   setGlobalSettings.displayType = displayTypeInput.value;
   setGlobalSettings.removePreviews = removePreviewsInput.value;
   setGlobalSettings.removePlaylists = removePlaylistsInput.value;
   setGlobalSettings.removeLongTracks = removeLongTracksInput.value;
   setGlobalSettings.removeUserActivity = removeUserActivityInput.value;
   setGlobalSettings.removeReposts = removeRepostsInput.value;
   setGlobalSettings.tagsArray = tagsArray;
   setGlobalSettings.relatedContext = relatedContextInput.value;
   setGlobalSettings.bannedContext = bannedContext.value;
   setGlobalSettings.hiddenOutline = hiddenOutlineInput.value;
   setGlobalSettings.profileImages = profileImagesInput.value;

   // Store all options in chrome
   chrome.storage.sync.set(setGlobalSettings, function(){
      if (chrome.runtime.lastError) {
         alert('Error settings:\n\n'+chrome.runtime.lastError);
      }
   });

   // Refresh page
   location.reload();
});
