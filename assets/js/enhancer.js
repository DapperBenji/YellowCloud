//"use strict";

const debugMode = 0;
if (debugMode) console.log("SCE DEBUGMODE ACTIVE");

// =============================================================
// Helper functions
// =============================================================

let getCookie = (cname)=> {
   let name = cname + "=";
   let ca = document.cookie.split(';');
   for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ')
         c = c.substring(1);
      if (c.indexOf(name) == 0)
         return c.substring(name.length, c.length);
   }
   return "";
}

let fetchFile = (el, file, callback)=> {
   let xhr = new XMLHttpRequest();
   xhr.open("GET", chrome.extension.getURL(file), true);
   xhr.onload = ()=> {
      if (xhr.status === 200) {
         if (debugMode) console.log("function fetchFile: File fetched");
         el.innerHTML = xhr.responseText;
         if (callback) return callback();
      }
   };
   xhr.send();
}

let disassembleSettings = ()=> {
   let modal = document.querySelector('#sce-settings');
   modal.classList.add("invisible");
   modal.style.overflow = "hidden";
   app.classList.remove("g-filter-grayscale");

   setTimeout(()=> {
      modal.classList.remove("showBackground");
      setTimeout(()=> {
         modal.remove();
         body.classList.remove("g-overflow-hidden");
      }, 100);
   }, 300);
}

// =============================================================
// Global variables
// =============================================================

const body = document.getElementsByTagName("BODY")[0];
const app = document.querySelector('#app');
const logo = document.querySelector('.header__logo.left');
const soundPanel = document.querySelector('.playControls');
const announcements = document.querySelector('.announcements.g-z-index-fixed-top');
const soundPanelInner = document.querySelector('.playControls__inner');
const userID = getCookie('i');
const manifestData = chrome.runtime.getManifest();
let getGlobalSettings = [];
let setGlobalSettings = {};

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

// Detect URL changes
window.oldLocation = location.href;
setInterval(()=> {
   if (location.href != window.oldLocation) {
      if (debugMode) console.log("NEW PAGE LOADED");
      let readyStateCheckInterval = setInterval(()=> {
         if (document.readyState !== "loading") {
            clearInterval(readyStateCheckInterval);
            window.oldLocation = location.href;
            setAttributes();
            settingsSetup();
            injectedJavascript();
         }
      }, 100);
   }
}, 100);

// Load the injected javascript on load
document.addEventListener('readystatechange', (e)=> {
  if (e.target.readyState !== "loading") {
      if (debugMode) console.log("readyState: Interactive");
      setAttributes();
  }
  if (e.target.readyState === "complete") {
     if (debugMode) console.log("readyState: Complete");
     settingsSetup();
     injectedJavascript();
  }
});

let setAttributes = ()=> {
   if (debugMode) console.log("function setAttributes: Initializing");
   chrome.storage.sync.get(getGlobalSettings, (get)=> {
      if (get.oldUserProfile != "on") body.setAttribute("data-profile", "new");
      if (get.darkMode == "on") body.setAttribute("data-theme", "dark");
      if (get.hideSidebar == "on") body.setAttribute("data-sidebar", "hidden");
      else body.setAttribute("data-sidebar", "show");
      if (location.href == "https://soundcloud.com/stream") {
         if (get.displayType == "list") body.setAttribute("data-display", "list");
         else if (get.displayType == "grid") body.setAttribute("data-display", "grid");
         else body.setAttribute("data-display", "default");
      }
      if (get.hideTheUpload == "on") body.setAttribute("data-theupload", "hidden");
      if (get.hiddenOutline == "on") body.setAttribute("data-hidden-outline", "show");
      if (location.href != "https://soundcloud.com/you/following")
         if (get.profileImages == "on") body.setAttribute("data-image", "square");
   });
}

let settingsSetup = ()=> {
   if (debugMode) console.log("function settingsSetup: Initializing");
   const checkVersion = document.querySelector('#version-display');
   const checkButton = document.querySelector("#enhancer-btn");
   const exploreTab = document.querySelector('.streamExploreTabs ul.g-tabs');
   const checkExploreTab = document.querySelector('#the-upload-tab');
   const profileMenu = document.querySelector('ul.profileTabs.g-tabs');
   const getLikeButton = document.querySelector("#profile-tab-like");

   // Setup the version number in the header logo
   if (checkVersion == null) {
      let versionDisplay = document.createElement("span");
         versionDisplay.id = "version-display";
         versionDisplay.innerText = manifestData.version;
      logo.appendChild(versionDisplay);
   }

   // Force-open sound control panel
   soundPanel.className = "playControls g-z-index-header m-visible";
   announcements.className = "announcements g-z-index-fixed-top m-offset";

   //Setup SoundCloud Enhancer button
   chrome.storage.sync.get(getGlobalSettings, (get)=> {
      if (get.removeSettingsBtn != "on") {
         if (checkButton == null) {
            let SCEContainer = document.createElement("div");
               SCEContainer.id = "enhancer-container";
            let SCEButton = document.createElement("button");
               SCEButton.className = "sc-button-edit sc-button sc-button-medium sc-button-responsive";
               SCEButton.id = "enhancer-btn";
               SCEButton.tabindex = "0";
               SCEButton.innerText = "Enhancer settings";
            SCEContainer.appendChild(SCEButton);
            soundPanelInner.appendChild(SCEContainer);
            settingsMenu();
         }
      }
   });

   // Add the "The Upload" playlist to the stream explore tab
   if (exploreTab) {
      if (checkExploreTab == null) {
         let tabItem = document.createElement("li");
            tabItem.className = "g-tabs-item";
         let tabItemLink = document.createElement("a");
            tabItemLink.className = "g-tabs-link";
            tabItemLink.id = "the-upload-tab";
            tabItemLink.href = "/discover/sets/new-for-you:" + userID;
            tabItemLink.innerText = "The Upload";
         tabItem.appendChild(tabItemLink);
         exploreTab.appendChild(tabItem);
      }
   }

   // Add a "like" menu point to the profiles
   if (profileMenu) {
      if (getLikeButton == null) {
         let createLikeMenu = document.createElement("li");
            createLikeMenu.className = "g-tabs-item";
            createLikeMenu.id = "profile-tab-like";
         let createLikeLink = document.createElement("a");
            createLikeLink.className = "g-tabs-link";
            createLikeLink.href = location.href + "/likes";
            createLikeLink.innerText = "Likes";
         createLikeMenu.appendChild(createLikeLink);
         profileMenu.appendChild(createLikeMenu);
      }
   }
}

let renderSettings = (callback)=> {
   if (debugMode) console.log("function renderSettings: Initializing");
   body.className = "g-overflow-hidden";
   body.style.paddingRight = "0px";
   app.className = "g-filter-grayscale";
   let modal = document.createElement("div");
      modal.id = "sce-settings";
      modal.className = "modal g-z-index-modal-background g-opacity-transition g-z-index-overlay modalWhiteout showBackground invisible";
      modal.style.paddingRight = "0px";
      modal.style.outline = "none";
      modal.style.overflow = "hidden";
      modal.tabindex = "-1";
   let modalClose = document.createElement("button");
      modalClose.className = "modal__closeButton sce-close-settings";
      modalClose.title = "Close";
      modalClose.type = "button";
      modalClose.innerText = "Close";
   let modalContainer = document.createElement("div");
      modalContainer.className = "modal__modal sc-border-box g-z-index-modal-content";
   let modalContent = document.createElement("div");
      modalContent.className = "modal__content";
   let modalTitle = document.createElement("h1");
      modalTitle.id = "sce-settings-title";
      modalTitle.className = "g-modal-title-h1 sc-truncate";
      modalTitle.innerText = "SoundCloud Enhancer Settings " + manifestData.version;
   let modalCredits = document.createElement("span");
      modalCredits.className = "credits";
      modalCredits.innerHTML = "Made with <span class='heart'>&hearts;</span> in Denmark by <a href='https://twitter.com/DapperBenji' target='_blank'>@DapperBenji</a>. Follow the development on <a href='https://trello.com/b/n7jrTzxO/soundcloud-enhancer' target='_blank'>Trello</a>.";
   let modalTabs = document.createElement("ul");
      modalTabs.id = "tab-container";
      modalTabs.className = "g-tabs g-tabs-small";
   let modalTabListSettings = document.createElement("li");
      modalTabListSettings.className = "g-tabs-item";
   let modalTabListChangelog = document.createElement("li");
      modalTabListChangelog.className = "g-tabs-item";
   let modalTabSettings = document.createElement("a");
      modalTabSettings.setAttribute("data-page", "settings");
      modalTabSettings.className = "tab g-tabs-link active";
      modalTabSettings.innerText = "Settings";
   let modalTabChangelog = document.createElement("a");
      modalTabChangelog.setAttribute("data-page", "changelog");
      modalTabChangelog.className = "tab g-tabs-link";
      modalTabChangelog.innerText = "Changelog";
   let modalPageContainer = document.createElement("div");
      modalPageContainer.id = "sce-settings-content";
   let modalPageSettings = document.createElement("div");
      modalPageSettings.className = "tabPage";
      modalPageSettings.id = "settings";
      modalPageSettings.style.display = "block";
   let modalPageChangelog = document.createElement("div");
      modalPageChangelog.className = "tabPage";
      modalPageChangelog.id = "changelog";
   let modalFooterLine = document.createElement("hr");
   let modalDonation = document.createElement("span");
      modalDonation.className = "donation";
   let modalDonationLink = document.createElement("a");
      modalDonationLink.href = "https://www.paypal.me/BenjaminBachJensen";
      modalDonationLink.innerText = "Support the development - Buy me a cup of coffee ;)";
      modalDonationLink.target = "_blank";
   modalPageContainer.appendChild(modalPageSettings);
   modalPageContainer.appendChild(modalPageChangelog);
   modalTabListSettings.appendChild(modalTabSettings);
   modalTabListChangelog.appendChild(modalTabChangelog);
   modalTabs.appendChild(modalTabListSettings);
   modalTabs.appendChild(modalTabListChangelog);
   modalDonation.appendChild(modalDonationLink);
   modalContent.appendChild(modalTitle);
   modalContent.appendChild(modalCredits);
   modalContent.appendChild(modalTabs);
   modalContent.appendChild(modalPageContainer);
   modalContent.appendChild(modalFooterLine);
   modalContent.appendChild(modalDonation);
   modalContainer.appendChild(modalContent);
   modal.appendChild(modalClose);
   modal.appendChild(modalContainer);
   body.appendChild(modal);

   setTimeout(()=> {modal.classList.remove("invisible")},10);
   setTimeout(()=> {modal.style.overflow = null;},400);

   fetchFile(modalPageSettings, '/assets/html/settings.html', callback);
   fetchFile(modalPageChangelog, '/assets/html/changelog.html');

   // Activates tab logic
   let tabs = document.querySelectorAll('.tab');
   for (let i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', ()=> {
         for (let k = 0; k < tabs.length; k++) tabs[k].className = "tab g-tabs-link ";
         tabs[i].className = "tab g-tabs-link active";
         let pages = document.querySelectorAll('.tabPage');
         for (let j = 0; j < pages.length; j++) pages[j].style.display = "none";
         let page = tabs[i].getAttribute('data-page');
         document.getElementById(page).style.display = "block";
      });
   }
}

let saveSettings = (data)=> {
   let tagsArray = [];
   let tagElement = document.querySelectorAll('.nsg-tag');
   for (let i = 0; i < tagElement.length; i++) tagsArray.push(tagElement[i].innerText);

   if (data.darkMode != "on") data.darkMode = "off";
   if (data.removeSettingsBtn != "on") data.removeSettingsBtn = "off";
   if (data.hideSidebar != "on") data.hideSidebar = "off";
   if (data.hideTheUpload != "on") data.hideTheUpload = "off";
   if (data.oldUserProfile != "on") data.oldUserProfile = "off";
   if (data.displayType == "default") data.displayType = "";
   if (data.removePreviews != "on") data.removePreviews = "off";
   if (data.removePlaylists != "on") data.removePlaylists = "off";
   if (data.removeLongTracks != "on") data.removeLongTracks = "off";
   if (data.removeUserActivity != "on") data.removeUserActivity = "off";
   if (data.removeReposts != "on") data.removeReposts = "off";
   if (data.relatedContext != "on") data.relatedContext = "off";
   if (data.bannedContext != "on") data.bannedContext = "off";
   if (data.hiddenOutline != "on") data.hiddenOutline = "off";
   if (data.profileImages != "on") data.profileImages = "off";

   setGlobalSettings.darkMode = data.darkMode;
   setGlobalSettings.removeSettingsBtn = data.removeSettingsBtn;
   setGlobalSettings.hideSidebar = data.hideSidebar;
   setGlobalSettings.hideTheUpload = data.hideTheUpload;
   setGlobalSettings.oldUserProfile = data.oldUserProfile;
   setGlobalSettings.displayType = data.displayType;
   setGlobalSettings.removePreviews = data.removePreviews;
   setGlobalSettings.removePlaylists = data.removePlaylists;
   setGlobalSettings.removeLongTracks = data.removeLongTracks;
   setGlobalSettings.removeUserActivity = data.removeUserActivity;
   setGlobalSettings.removeReposts = data.removeReposts;
   setGlobalSettings.tagsArray = tagsArray;
   setGlobalSettings.relatedContext = data.relatedContext;
   setGlobalSettings.bannedContext = data.bannedContext;
   setGlobalSettings.hiddenOutline = data.hiddenOutline;
   setGlobalSettings.profileImages = data.profileImages;

   chrome.storage.sync.set(setGlobalSettings, ()=> {
      if (chrome.runtime.lastError) alert('Error while saving settings:\n\n' + chrome.runtime.lastError);
      else location.reload();
   });
}

let settingsMenu = ()=> {
   if (debugMode) console.log("function settingsMenu: Initializing");
   let settingsButton = document.querySelector('#enhancer-btn');
   settingsButton.addEventListener("click", ()=> {
      let settingsInit = ()=> {
         if (debugMode) console.log("callback settingsInit: Initializing");

         // Activates all menu-closing buttons
         let settingsClose = document.querySelectorAll('.sce-close-settings');
         for (let i = 0; i < settingsClose.length; i++) settingsClose[i].addEventListener("click", ()=> {disassembleSettings()});

         // Activates the ability to close the menu by clicking outside of it
         document.addEventListener("mousedown", (e)=> {
            let evt = (e == null ? event : e);
            if (evt.which == 1 || evt.button == 0 || evt.button == 1)
               if (e.target.id == 'sce-settings') disassembleSettings();
         });

         let darkModeInput = document.querySelector('#darkMode');
         let removeSettingsBtnInput = document.querySelector('#removeSettingsBtn');
         let hideSidebarInput = document.querySelector('#hideSidebar');
         let hideTheUploadInput = document.querySelector('#hideTheUpload');
         let oldUserProfileInput = document.querySelector('#oldUserProfile');
         let displayTypeInput = document.querySelectorAll('input[name="displayType"]');
         let removePreviewsInput = document.querySelector('#removePreviews');
         let removePlaylistsInput = document.querySelector('#removePlaylists');
         let removeLongTracksInput = document.querySelector('#removeLongTracks');
         let removeUserActivityInput = document.querySelector('#removeUserActivity');
         let removeRepostsInput = document.querySelector('#removeReposts');
         let skipTagsInput = document.querySelector('#skipTags');
         let relatedContextInput = document.querySelector('#relatedContext');
         let hiddenOutlineInput = document.querySelector('#hiddenOutline');
         let profileImagesInput = document.querySelector('#profileImages');
         let bannedContextInput = document.querySelector('#bannedContext');

         chrome.storage.sync.get(getGlobalSettings, (get)=> {
            if (get.darkMode == "on") darkModeInput.checked = true;
            if (get.removeSettingsBtn == "on") removeSettingsBtnInput.checked = true;
            if (get.hideSidebar == "on") hideSidebarInput.checked = true;
            if (get.hideTheUpload == "on") hideTheUploadInput.checked = true;
            if (get.oldUserProfile == "on") oldUserProfileInput.checked = true;
            if (get.displayType == "list") displayTypeInput[1].checked = true;
            else if (get.displayType == "grid") displayTypeInput[2].checked = true;
            else displayTypeInput[0].checked = true;
            if (get.removePreviews == "on") removePreviewsInput.checked = true;
            if (get.removePlaylists == "on") removePlaylistsInput.checked = true;
            if (get.removeLongTracks == "on") removeLongTracksInput.checked = true;
            if (get.removeUserActivity == "on") removeUserActivityInput.checked = true;
            if (get.removeReposts == "on") removeRepostsInput.checked = true;
            if (get.tagsArray != null) skipTagsInput.value = get.tagsArray;
            if (get.relatedContext == "on") relatedContextInput.checked = true;
            if (get.bannedContext == "on") bannedContextInput.checked = true;
            if (get.hiddenOutline == "on") hiddenOutlineInput.checked = true;
            if (get.profileImages == "on") profileImagesInput.checked = true;
         });

         setTimeout(()=> {
            insignia(skipTags, {delimiter: ',', deletion: true});
         },50);

         let settingsSubmit = document.querySelector('#sce-settings-save');
         settingsSubmit.addEventListener('click', ()=> {
            let settingsInputs = document.forms['sce-settings-form'].getElementsByTagName("input");
            let data = [];
            for (let i = 0; i < settingsInputs.length; i++) {
               let inputOutput;
               let inputName = settingsInputs[i].name;
               let inputType = settingsInputs[i].type;
               let inputChecked = settingsInputs[i].checked;
               let inputValue = settingsInputs[i].value;

               if (inputType == "checkbox") inputOutput = inputChecked ? "on" : "off";
               else if (inputType == "radio") inputOutput = inputChecked ? inputValue : "skip";
               else inputOutput = inputValue;
               if (inputOutput != "skip") data[inputName] = inputOutput;
            }
            saveSettings(data);
         });
      }
      renderSettings(settingsInit);
   });

}

let injectedJavascript = ()=> {
   if (debugMode) console.log("function injectedJavascript: Initializing");

   window.skipPrevious = "false";
   var stream = document.querySelectorAll('.lazyLoadingList > ul');
   var content = document.getElementById('content');
   var soundBadge = document.getElementsByClassName('playbackSoundBadge')[0];
   var tags = document.getElementsByClassName('soundTitle__tagContent');

   // Observer configs
   var config = {childList: true, attributes: true, characterData: true};
   var soundBadge_config = {childList: true};

   // Create quick display switcher on stream
   if (location.href == "https://soundcloud.com/stream") {
      var streamHeader = document.querySelectorAll('.stream__header')[0];
      var checkStreamController = document.querySelector("#stream-controller");

      if (checkStreamController == null) {
         var streamController = document.createElement("div");
         streamController.setAttribute('class', "stream__controls");
         streamController.setAttribute('id', "stream-controller");

         var textContainer = document.createElement("div");
         textContainer.setAttribute('class', "listDisplayToggle g-flex-row-centered");

         var textHeader = document.createElement("h3");
         textHeader.setAttribute('class', "listDisplayToggleTitle sc-text-light sc-type-medium");
         textHeader.innerText = "View";
         textContainer.appendChild(textHeader);

         var listContainer = document.createElement("ul");
         listContainer.setAttribute('class', "listDisplayToggle sc-list-nostyle g-flex-row-centered");

         var defaultList = document.createElement("li");
         defaultList.setAttribute('class', "listDisplayToggle setting-display-tile default-icon");
         defaultList.setAttribute('title', "Default");
         defaultList.setAttribute('data-id', "default");

         var compactList = document.createElement("li");
         compactList.setAttribute('class', "listDisplayToggle setting-display-tile list-icon");
         compactList.setAttribute('title', "Compact");
         compactList.setAttribute('data-id', "list");

         var gridList = document.createElement("li");
         gridList.setAttribute('class', "listDisplayToggle setting-display-tile grid-icon");
         gridList.setAttribute('title', "Grid");
         gridList.setAttribute('data-id', "grid");

         listContainer.appendChild(defaultList);
         listContainer.appendChild(compactList);
         listContainer.appendChild(gridList);
         textContainer.appendChild(listContainer);
         streamController.appendChild(textContainer);
         streamHeader.appendChild(streamController);
      }

      chrome.storage.sync.get(getGlobalSettings, (get)=> {
         // Declare the display icons list elements
         var getDefaultList = document.getElementsByClassName('listDisplayToggle setting-display-tile default-icon')[0];
         var getCompactList = document.getElementsByClassName('listDisplayToggle setting-display-tile list-icon')[0];
         var getGridList = document.getElementsByClassName('listDisplayToggle setting-display-tile grid-icon')[0];

         // Mark the current selected display mode
         if (get.displayType == "list") {
            getCompactList.className = "listDisplayToggle setting-display-tile list-icon active";
         } else if (get.displayType == "grid") {
            getGridList.className = "listDisplayToggle setting-display-tile grid-icon active";
         } else {
            getDefaultList.className = "listDisplayToggle setting-display-tile default-icon active";
         }

         // Display switcher logic
         var getLists = document.getElementsByClassName('listDisplayToggle setting-display-tile');
         for (var i = 0; i < getLists.length; i++) {
            getLists[i].addEventListener('click', function() {
               var setGlobalSettings = {};
               var getData = this.getAttribute("data-id");
               setGlobalSettings.displayType = getData;

               chrome.storage.sync.set(setGlobalSettings, function() {
                  if (chrome.runtime.lastError) {
                     alert('Error settings:\n\n'+chrome.runtime.lastError);
                  }
               });

               location.reload();
            });
         }
      });
   }

   if(location.href == "https://soundcloud.com/you/following") {
      var collectionHeader = document.getElementsByClassName('collectionSection__top')[0];
      var massUnfollowButton = document.querySelector("#mass-unfollow");

      if (massUnfollowButton == null) {
         var massUnfollowContainer = document.createElement("div");
         massUnfollowContainer.setAttribute('class', "stream__controls");
         massUnfollowContainer.setAttribute('id', "mass-unfollow");

         var textContainer = document.createElement("div");
         textContainer.setAttribute('class', "g-flex-row-centered");

         var textHeader = document.createElement("h3");
         textHeader.setAttribute('class', "sc-text-light sc-type-medium margin-spacing");
         textHeader.innerText = "Options:";

         var confirmUnfollowButton = document.createElement("button");
         confirmUnfollowButton.setAttribute('class', "sc-button margin-spacing");
         confirmUnfollowButton.setAttribute('id', "confirm-unfollow-button");
         confirmUnfollowButton.innerText = "Mass unfollow";

         var undoUnfollowButton = document.createElement("button");
         undoUnfollowButton.setAttribute('class', "sc-button");
         undoUnfollowButton.setAttribute('id', "undo-unfollow-button");
         undoUnfollowButton.innerText = "Reset selection";

         textContainer.appendChild(textHeader);
         textContainer.appendChild(confirmUnfollowButton);
         textContainer.appendChild(undoUnfollowButton);
         massUnfollowContainer.appendChild(textContainer);
         collectionHeader.appendChild(massUnfollowContainer);
      }

      function multiFollow() {
         var followingUsers = document.querySelectorAll('.userBadgeListItem');
         for (var i = 0; i < followingUsers.length; i++) {
            if (followingUsers[i].querySelector(".userBadgeListItem__checkbox") == undefined) {
               var checkboxDiv = document.createElement("label");
               checkboxDiv.setAttribute('class', "userBadgeListItem__checkbox");
               var checkboxElement = document.createElement("input");
               checkboxElement.setAttribute('type', "checkbox");
               checkboxElement.setAttribute('class', "sc-checkbox-input sc-visuallyhidden");
               var checkboxWrap = document.createElement("div");
               checkboxWrap.setAttribute('class', "sc-checkbox-check");
               checkboxDiv.appendChild(checkboxElement);
               checkboxDiv.appendChild(checkboxWrap);
               followingUsers[i].appendChild(checkboxDiv);
            }
         }
      }
      multiFollow();

      // Run the function after a lazyload
      for (var i = 0; i < stream.length; i++) {
         var unfollowObserver = new MutationObserver(function (mutationRecords, observer) {
            mutationRecords.forEach(function (mutation) {
               multiFollow();
            });
         });
         unfollowObserver.observe(stream[i], config);
      }

      var confirm = document.getElementById('confirm-unfollow-button');
      var undo = document.getElementById('undo-unfollow-button');

      confirm.addEventListener('click', function() {
         var unfollowLoop = document.getElementsByClassName('badgeList__item');
         var newFollowCount = 0;
         for (var i = 0; i < unfollowLoop.length; i++) {
            var checkFollowStatus = unfollowLoop[i].querySelector('label.userBadgeListItem__checkbox input.sc-checkbox-input');
            if(checkFollowStatus.checked == true){
               var closestUnfollowButton = unfollowLoop[i].querySelector('.userBadgeListItem .userBadgeListItem__action button.sc-button-follow');
               closestUnfollowButton.click();
               newFollowCount++;
            }
         }
         if (newFollowCount == 1) {
            confirm.innerText = newFollowCount + " account got unfollowed!";
         } else {
            confirm.innerText = newFollowCount + " accounts got unfollowed!";
         }
         setTimeout(function() {
            confirm.innerText = "Mass unfollow";
         }, 5000);
      });

      undo.addEventListener('click', function() {
         var unfollowLoop = document.getElementsByClassName('badgeList__item');
         for (var i = 0; i < unfollowLoop.length; i++) {
            var checkFollowStatus = unfollowLoop[i].querySelector('label.userBadgeListItem__checkbox input.sc-checkbox-input');
            checkFollowStatus.checked = false;
         }
      });
   }

   chrome.storage.sync.get(getGlobalSettings, function(get){

      // Remove reposts
      if (get.removeReposts == "on") {
         // Function to skip all reposts
         function hideReposts() {
            var repost = document.getElementsByClassName('soundContext__repost');
            for (i = 0; i < repost.length; i++){
               var repostClosest = repost[i].closest('.soundList__item');
               repostClosest.setAttribute("data-skip", "true");
               repostClosest.setAttribute("data-type", "repost");
               repostClosest.setAttribute("class", "soundList__item hidden");
            }
         }
         hideReposts();

         // Run the function after a lazyload
         for (var i = 0; i < stream.length; i++) {
            var repostObserver = new MutationObserver(function (mutationRecords, observer) {
               mutationRecords.forEach(function (mutation) {
                  hideReposts();
               });
            });
            repostObserver.observe(stream[i], config);
         }
      }

      // Remove songs with a specific tag
      if (get.tagsArray != null) {
         function checkTags() {
            var tags = document.getElementsByClassName('soundTitle__tagContent');
            var tagArray = get.tagsArray;
            var tagArray2 = "" + tagArray + "";
            var tagSplit = tagArray2.split(",");

            for (let t = 0; t < tags.length; t++)
            {
               for (var i = 0; i < tagSplit.length; i++) {
                  if (tags[t].innerText == tagSplit[i]) {
                     var tagClosest = tags[t].closest('.soundList__item');
                     tagClosest.setAttribute("data-skip", "true");
                     tagClosest.setAttribute("data-type", "tag");
                     tagClosest.setAttribute("class", "soundList__item hidden");
                  }
               }
            }
         }
         checkTags();

         // Run function after a lazyload
         for (var i = 0; i < stream.length; i++) {
            var tagsObserver = new MutationObserver(function (mutationRecords, observer) {
               mutationRecords.forEach(function (mutation) {
                  checkTags();
               });
            });
            tagsObserver.observe(stream[i], config);
         }
      }

      // Add related tracks option to the more context menu
      var detectUser = document.querySelectorAll('.userMain .userMain__content')[0];
      function relatedContext() {
         if (detectUser != null) {
            window.displayType = document.getElementsByClassName('lazyLoadingList')[0];
            window.displayTypeList = document.querySelectorAll('.lazyLoadingList ul.soundList.sc-list-nostyle');
         } else if (location.href == "https://soundcloud.com/you/collection") {
            window.displayType = document.getElementsByClassName('lazyLoadingList')[1];
            window.displayTypeList = document.querySelectorAll('.lazyLoadingList ul.lazyLoadingList__list');
         } else {
            window.displayType = document.getElementsByClassName('lazyLoadingList')[0];
            window.displayTypeList = document.querySelectorAll('.lazyLoadingList ul.lazyLoadingList__list');
         }

         // Resets the context menu type, based on display type
         var detectToggle = document.querySelectorAll('.listDisplayToggle__optionToggle');
         for (var i = 0; i < detectToggle.length; i++) {
            detectToggle[i].addEventListener('click', function() {
               setTimeout(function(){ relatedContext(); }, 1000);
            });
         }
         var displayTypeClass = window.displayType.className;

         if (displayTypeClass.includes("badgeList") == true || displayTypeClass.includes("personalRecommended") == true) {
            var badgeList = document.querySelectorAll('.audibleTile__actions button.sc-button-more');
            for (var i = 0; i < badgeList.length; i++) {
               badgeList[i].addEventListener('click', function() {
                  var getMoreContextMenu = document.querySelectorAll('.moreActions div')[0];
                  if (getMoreContextMenu != null) {
                     if (location.href == "https://soundcloud.com/you/likes" || location.href == "https://soundcloud.com/you/collection") {
                        var getSongContainer = this.closest('.badgeList__item');
                     } else {
                        var getSongContainer = this.closest('.soundGallery__sliderPanelSlide');
                     }
                     var getSongLinks = getSongContainer.querySelector('.audibleTile .audibleTile__artwork .audibleTile__artworkLink');
                     var getSongHref = getSongLinks.getAttribute("href");
                     var checkContextMenu = document.querySelectorAll('.moreActions div #related-button')[0];
                     if (checkContextMenu == null) {
                        var checkPlaylists = getSongContainer.querySelector('.audibleTile__trackCount');
                        var checkForTag = getSongContainer.querySelector('.soundTitle__tagContent');
                        var checkForTagButton = getSongContainer.querySelector('#tag-button');

                        if (get.bannedContext == "on") {
                           if (checkForTag != null) {
                              if (checkForTagButton == null) {
                                 var createTagRemoveButton = document.createElement("button");
                                 createTagRemoveButton.setAttribute('id',"tag-button");
                                 createTagRemoveButton.setAttribute('class',"moreActions__button sc-button-medium sc-button-related");
                                 createTagRemoveButton.setAttribute('title',"Click to ban this track's tag");
                                 createTagRemoveButton.setAttribute('data-hashtag', checkForTag.innerText);
                                 createTagRemoveButton.innerText = "Blacklist tag";

                                 getMoreContextMenu.appendChild(createTagRemoveButton);

                                 var getTagRemoveButton = document.getElementById('tag-button');
                                 getTagRemoveButton.addEventListener("click", function() {
                                    var setGlobalSettings = {};
                                    var bannedTag = this.getAttribute("data-hashtag");
                                    var newTagsArray = get.tagsArray + "," + bannedTag;
                                    setGlobalSettings.tagsArray = newTagsArray;

                                    // Store all options in chrome
                                    chrome.storage.sync.set(setGlobalSettings, function(){
                                       if (chrome.runtime.lastError) {
                                          alert('Error settings:\n\n'+chrome.runtime.lastError);
                                       }
                                    });

                                    //Refresh the page
                                    location.reload();
                                 });
                              }
                           }
                        }

                        if (get.relatedContext == "on") {
                           if (checkPlaylists == null) {
                              var createAchor = document.createElement("a");
                              createAchor.setAttribute('href', getSongHref + "/recommended");

                              var createButton = document.createElement("button");
                              createButton.setAttribute('id',"related-button");
                              createButton.setAttribute('class',"moreActions__button sc-button-medium sc-button-related");
                              createButton.setAttribute('title',"Go to related tracks");
                              createButton.innerText = "Related tracks";

                              createAchor.appendChild(createButton);
                              getMoreContextMenu.appendChild(createAchor);
                           }
                        }
                     }
                  }
               });
            }
         } else {
            var soundList = document.querySelectorAll('.soundActions button.sc-button-more');
            for (var i = 0; i < soundList.length; i++) {
               soundList[i].addEventListener('click', function() {
                  var getMoreContextMenu = document.querySelector('.moreActions div');
                  if (getMoreContextMenu != null) {
                     var getSongContainer = this.closest('.sound__body');
                     if (getSongContainer == null)
                        var getSongContainer = this.closest('.visualSound__wrapper');
                     var getSongLinks = getSongContainer.querySelector('.sound__header .soundTitle .soundTitle__titleContainer .soundTitle__usernameTitleContainer a.soundTitle__title');
                     var getSongHref = getSongLinks.getAttribute("href");
                     var checkContextMenu = document.querySelectorAll('.moreActions div #related-button')[0];
                     if (checkContextMenu == null) {
                        var checkPlaylists = getSongContainer.querySelector('.playlistTrackCount');
                        var checkForTag = getSongContainer.querySelector('.soundTitle__tagContent');
                        var checkForTagButton = getSongContainer.querySelector('#tag-button');

                        if (get.bannedContext == "on") {
                           if (checkForTag != null) {
                              if (checkForTagButton == null) {
                                 var createTagRemoveButton = document.createElement("button");
                                 createTagRemoveButton.setAttribute('id',"tag-button");
                                 createTagRemoveButton.setAttribute('class',"moreActions__button sc-button-medium sc-button-blacklist");
                                 createTagRemoveButton.setAttribute('title',"Click to blacklist this track's tag");
                                 createTagRemoveButton.setAttribute('data-hashtag', checkForTag.innerText);
                                 createTagRemoveButton.innerText = "Blacklist tag";

                                 getMoreContextMenu.appendChild(createTagRemoveButton);

                                 var getTagRemoveButton = document.getElementById('tag-button');
                                 getTagRemoveButton.addEventListener("click", function() {
                                    var setGlobalSettings = {};
                                    var bannedTag = this.getAttribute("data-hashtag");
                                    var newTagsArray = get.tagsArray + "," + bannedTag;
                                    setGlobalSettings.tagsArray = newTagsArray;

                                    // Store all options in chrome
                                    chrome.storage.sync.set(setGlobalSettings, function() {
                                       if (chrome.runtime.lastError) {
                                          alert('Error settings:\n\n'+chrome.runtime.lastError);
                                       }
                                    });

                                    //Refresh the page
                                    location.reload();
                                 });
                              }
                           }
                        }

                        if (get.relatedContext == "on") {
                           if (checkPlaylists == null) {
                              var createAchor = document.createElement("a");
                              createAchor.setAttribute('href', getSongHref + "/recommended");

                              var createButton = document.createElement("button");
                              createButton.setAttribute('id',"related-button");
                              createButton.setAttribute('class',"moreActions__button sc-button-medium sc-button-related");
                              createButton.setAttribute('title',"Go to related tracks");
                              createButton.innerText = "Related tracks";

                              createAchor.appendChild(createButton);
                              getMoreContextMenu.appendChild(createAchor);
                           }
                        }
                     }
                  }
               });
            }
         }
      }

      // Run the function after a lazyload
      let moreClickObserver = new MutationObserver(function (mutations) {
         mutations.forEach(function (mutation) {
            relatedContext();
         });
      });
      for (var m = 0; m < stream.length; m++) {
         moreClickObserver.observe(document.querySelectorAll('.lazyLoadingList ul')[m], config);
      }

      relatedContext();

      // Remove previews
      if (get.removePreviews == "on") {
         // Function to skip all previews
         function hidePreviews() {
            var preview = document.getElementsByClassName('sc-snippet-badge sc-snippet-badge-medium sc-snippet-badge-grey');
            for (i = 0; i < preview.length; i++) {
               if (preview[i].innerHTML != "") {
                  var previewsClosest = preview[i].closest('.soundList__item');
                  previewsClosest.setAttribute("data-skip", "true");
                  previewsClosest.setAttribute("data-type", "preview");
                  previewsClosest.setAttribute("class", "soundList__item hidden");
               }
            }
         }
         hidePreviews();

         // Run the function after a lazyload
         for (var i = 0; i < stream.length; i++) {
            var previewObserver = new MutationObserver(function (mutationRecords, observer) {
               mutationRecords.forEach(function (mutation) {
                  hidePreviews();
               });
            });
            previewObserver.observe(stream[i], config);
         }
      }

      // Remove playlist
      if (get.removePlaylists == "on") {
         function hidePlaylists() {
            var playlist = document.getElementsByClassName('soundList__item');
            for (i = 0; i < playlist.length; i++){
               var getPlaylistAttribute = playlist[i].getAttribute("data-playlist");
               if(getPlaylistAttribute == "true"){
                  playlist[i].setAttribute("data-skip", "true");
                  playlist[i].setAttribute("class", "soundList__item hidden");
               }
            }
         }
         hidePlaylists();

         // Run the function after a lazyload
         for (var i = 0; i < stream.length; i++) {
            var playlistObserver = new MutationObserver(function (mutationRecords, observer) {
               mutationRecords.forEach(function (mutation) {
                  hidePlaylists();
               });
            });
            playlistObserver.observe(stream[i], config);
         }

      }

      // Remove long tracks
      if (get.removeLongTracks == "on") {
         function checkCanvas() {
            var canvas = document.querySelectorAll('.sound__waveform .waveform .waveform__layer.waveform__scene');
            for (var i = 0; i < canvas.length; i++) {
               var canvasCount = canvas[i].querySelectorAll('canvas.g-box-full.sceneLayer');
               for (var j = 0; j < canvasCount.length; j++) {
                  var lastElement = canvasCount[canvasCount.length-1];
                  var getCanvas = lastElement.getContext("2d");
                  var lengthCalc = lastElement.width - 27;
                  var pixelData = getCanvas.getImageData(lengthCalc,27,1,1).data;
                  if(pixelData[0] == 0 && pixelData[1] == 0 && pixelData[2] == 0 && pixelData[3] == 255) {
                     var canvasClosest = canvas[i].closest('.soundList__item');
                     canvasClosest.setAttribute("data-skip", "true");
                     canvasClosest.setAttribute("data-type", "long");
                     canvasClosest.setAttribute("class", "soundList__item hidden");
                  }
               }
            }
         }
         checkCanvas();

         // Run the function after a lazyload
         for (var i = 0; i < stream.length; i++) {
            var canvasObserver = new MutationObserver(function (mutationRecords, observer) {
               mutationRecords.forEach(function (mutation) {
                  checkCanvas();
               });
            });
            canvasObserver.observe(stream[i], config);
         }
      }

      if (get.removeUserActivity == "on") {
         var getUsername = document.getElementsByClassName('userNav__button userNav__usernameButton')[0];
         var getUsernameHref = getUsername.getAttribute("href");
         function checkUserActivity() {
            var getTrackUsername = document.getElementsByClassName('soundContext__usernameLink');
            for (var i = 0; i < getTrackUsername.length; i++) {
               var getTrackUsernameHref = getTrackUsername[i].getAttribute("href");
               if (getUsernameHref == getTrackUsernameHref) {
                  var usernameClosest = getTrackUsername[i].closest('.soundList__item');
                  usernameClosest.setAttribute("class", "soundList__item hidden");
                  usernameClosest.setAttribute("data-skip", "true");
               }
            }
         }
         checkUserActivity();

         // Run the function after a lazyload
         for (var i = 0; i < stream.length; i++) {
            var userActivityObserver = new MutationObserver(function (mutationRecords, observer) {
               mutationRecords.forEach(function (mutation) {
                  checkUserActivity();
               });
            });
            userActivityObserver.observe(stream[i], config);
         }
      }
   });

   function markPlaylists() {
      var getPlaylists = document.querySelectorAll('.soundList__item .activity div.sound.streamContext');
      for (var i = 0; i < getPlaylists.length; i++) {
         var getPlaylist = getPlaylists[i].className;
         if (getPlaylist.includes("playlist") == true) {
            var getTrackCount = getPlaylists[i].querySelectorAll('.compactTrackList__listContainer .compactTrackList__item');
            if (getTrackCount.length < 5) {
               var getTrackCountNum = getTrackCount.length;
            } else {
               var checkMoreLink = getPlaylists[i].querySelectorAll('.compactTrackList__moreLink')[0];
               if (checkMoreLink) {
                  var checkMoreLinkContent = checkMoreLink.innerText;
                  var getTrackCountNum = checkMoreLinkContent.replace(/\D/g,'');
               } else {
                  var getTrackCountNum = getTrackCount.length;
               }
            }
            var playlistClosest = getPlaylists[i].closest('.soundList__item');
            playlistClosest.setAttribute("data-playlist", "true");
            playlistClosest.setAttribute("data-count", getTrackCountNum);
         }
      }
   }
   markPlaylists();

   // Run the function after a lazyload
   var markPlaylistsObserver = [];
   for (var i = 0; i < stream.length; i++) {
      markPlaylistsObserver[i] = new MutationObserver(function (mutationRecords, observer) {
         mutationRecords.forEach(function (mutation) {
            markPlaylists();
         });
      });
      markPlaylistsObserver[i].observe(stream[i], config);
   }

   window.skipPrevious = "false";
   var nextSongObserver = new MutationObserver(function (mutationRecords, observer) {
      mutationRecords.forEach(function (mutation) {
         chrome.storage.sync.get(getGlobalSettings, function(get) {
            var getPath = document.getElementsByClassName('playbackSoundBadge__titleContextContainer')[0].getElementsByClassName('playbackSoundBadge__title')[0];
            var getTitleAttribute = getPath.getAttribute("title");
            var getStreamItems = document.getElementsByClassName('soundList__item');

            for(var i = 0; i < getStreamItems.length; i++){
               var getSkipStatus = getStreamItems[i].getAttribute("data-skip");
               var getPlaylistType = getStreamItems[i].getAttribute("data-playlist");
               var getTitle = getStreamItems[i].querySelector('.soundTitle__title span');
               var getPlaying = getStreamItems[i].querySelector('.activity div.sound.streamContext').className;
               var skipReverseButton = document.getElementsByClassName("skipControl__previous")[0];

               if (getPlaying.includes("playing") == true) {

                  if (getSkipStatus == "true") {
                     skipReverseButton.addEventListener("click", function() {
                        window.skipPrevious = "true";
                     }, false);
                     if (getPlaylistType == "true") {
                        var skipAmount = getStreamItems[i].getAttribute("data-count");
                        if (window.skipPrevious == "true") {
                           for (var tracks = 0; tracks < skipAmount.length; tracks++) {
                              document.getElementsByClassName("skipControl__previous")[0].click();
                           }
                        } else if (window.skipPrevious == "false"){
                           for (var tracks = 0; tracks < skipAmount.length; tracks++) {
                              document.getElementsByClassName("skipControl__next")[0].click();
                           }
                        }
                     } else {
                        if (window.skipPrevious == "true") {
                           document.getElementsByClassName("skipControl__previous")[0].click();
                        } else if (window.skipPrevious == "false"){
                           document.getElementsByClassName("skipControl__next")[0].click();
                        }
                     }
                  } else {
                     window.skipPrevious = "false";
                  }
               }
            }
         });
      });
   });
   nextSongObserver.observe(soundBadge, soundBadge_config);
}
