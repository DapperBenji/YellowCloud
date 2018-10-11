/* jshint esversion: 6 */
/* jshint browser: true */
/* jshint node: true */
/* jshint -W117 */
/* global chrome */

"use strict";
// =============================================================
// Global variables
// =============================================================

const debugMode = 0,
manifestData = chrome.runtime.getManifest(),
globalConfig = {childList: true},
altConfig = {attributes: true, childList: true, subtree: true},
body = document.querySelector('body'),
app = document.querySelector('#app'),
defaultFilter = {"artists": [], "tracks": []},
setGlobalSettings = {},
getGlobalSettings = ["darkMode", "fullwidthMode", "moreActionMenu", "removeSettingsBtn", "disableDiscoverToggle", "hideSidebar", "hideBranding", "displayType", "removePreviews", "removePlaylists", "removeLongTracks", "removeUserActivity", "removeReposts", "tagsArray", "filter", "hiddenOutline", "profileImages", "disableUnfollower", "discoverModules"];
let skipPrevious = false,
oldLocation = location.href;

if (debugMode) console.log("-=- SCE DEBUGMODE ACTIVE -=-");

// =============================================================
// Helper functions
// =============================================================

// Insert Element node after a reference node
const insertAfter = (newNode, referenceNode)=> {
   referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
};

// Converts a timestamp to a relative time output
const relativeTime = timestamp => {
   let output = null;
   const minutes = 60,
   hours = minutes * 60,
   days = hours * 24,
   months = days * 30,
   years = days * 365,
   today = Math.floor(Date.now() / 1000),
   elapsed = today - timestamp;

   if (elapsed < minutes) output = elapsed + ' sec ago';
   else if (elapsed < hours) output = Math.round(elapsed / minutes) + ' mins ago';
   else if (elapsed < days) output = Math.round(elapsed / hours) + ' hrs ago';
   else if (elapsed < months) output = Math.round(elapsed / days) + ' days ago';
   else if (elapsed < years) output = Math.round(elapsed / months) + ' months ago';
   else output = Math.round(elapsed / years) + ' yrs ago';

   return output;
};

// Run an instance of a mutation observer
const runObserver = (target, callback, sensitive, callbackParam = null)=> {
   const sensitiveObserver = sensitive || false,
   useConfig = (sensitiveObserver) ? altConfig : globalConfig;

   let observer = new MutationObserver(mutations => {
      if (sensitiveObserver) {
         if (callbackParam) callback(callbackParam);
         else callback();
      } else {
         const mutationLength = mutations.length;
         let hasUpdated = false, mutation = null;
         for (let i = 0; i < mutationLength; i++) {
            mutation = mutations[i];
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
               hasUpdated = true;
               break;
            }
         }

         if (hasUpdated) {
            if (callbackParam) callback(callbackParam);
            else callback();
         }
      }
   });
   observer.observe(target, useConfig);
};

// Fetches browser cookie data by cookie name
const getCookie = cname => {
   const name = cname + "=", ca = document.cookie.split(';');
   for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1);
      if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
   }
   return "";
};
const userID = getCookie('i'), userName = getCookie('p');

// Fetch local extension files
const fetchFile = (el, file, callback)=> {
   const xhr = new XMLHttpRequest();
   xhr.open("GET", chrome.extension.getURL(file), true);
   xhr.onload = ()=> {
      if (xhr.status === 200) {
         if (debugMode) console.log("function fetchFile: File fetched");
         el.innerHTML = xhr.responseText;
         if (callback) return callback();
      }
   };
   xhr.send();
};

// Modal closing animation for the SCE menu
const disassembleSettings = ()=> {
   const modal = document.querySelector('#sce-settings');
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
};

// Generate mass unfollower checkboxes
const multiFollow = ()=> {
   const followingUsers = document.querySelectorAll('.userBadgeListItem'), followingUserCount = followingUsers.length;
   for (let i = 0; i < followingUserCount; i++) {
      if (followingUsers[i].querySelector(".userBadgeListItem__checkbox") == null) {
         const checkboxDiv = document.createElement("label"),
         checkboxElement = document.createElement("input"),
         checkboxWrap = document.createElement("div");

         checkboxDiv.className = "userBadgeListItem__checkbox";
         checkboxElement.type = "checkbox";
         checkboxElement.className = "sc-checkbox-input sc-visuallyhidden";
         checkboxWrap.className = "sc-checkbox-check";

         checkboxDiv.appendChild(checkboxElement);
         checkboxDiv.appendChild(checkboxWrap);
         followingUsers[i].appendChild(checkboxDiv);
      }
   }
};

// Return URL contents after "https://soundcloud.com/"
const stripLinkDomain = url => {
   const slug = url.replace('https://soundcloud.com/', '');
   return slug;
};

// Selects and unselects all mass unfollower checkboxes
const massSelector = bool => {
   const massSelectorLoop = ()=> {
      const unfollowLoop = document.querySelectorAll('.badgeList__item'), unfollowLoopCount = unfollowLoop.length;
      for (let i = 0; i < unfollowLoopCount; i++) {
         const checkFollowStatus = unfollowLoop[i].querySelector('label.userBadgeListItem__checkbox input.sc-checkbox-input');
         checkFollowStatus.checked = bool;
      }
   };
   if (bool == true) {
      let scrollInterval = setInterval(()=> {
         const detectLoadingBlock = document.querySelector('.collectionSection .badgeList.lazyLoadingList .loading');
         if (detectLoadingBlock) {
            window.scrollTo(0, document.body.scrollHeight || document.documentElement.scrollHeight);
            if (debugMode) console.log("Page scroll");
        } else {
            clearInterval(scrollInterval);
            window.scrollTo(0, 0);
            massSelectorLoop();
        }
      }, 50);
   } else massSelectorLoop();
};

// Checks if URL is a playlist URL
const isPlaylistURL = url => {
   const strip = url.split("/"), stripLength = strip.length;
   let output = false;
   for (let i = 0; i < stripLength; i++) if (strip[i] == "sets") output = true;
   return output;
};

// ...
const moreActionParentClassName = element => {
   const moreActionButtonParent = element.closest('.lazyLoadingList'),
   parentList = moreActionButtonParent.querySelector('div > ul > li, ul > li').className,
   parentListClassName = '.' + parentList.split(/\s+/)[0];
   return parentListClassName;
};

// Insert content into more action menus
const moreActionMenuContent = trackContainer => {
   getLocalStorage(get => {
      const moreActionMenu = document.querySelector('.moreActions div'),
      hasPlaylists = trackContainer.querySelector('.playlistTrackCount') || trackContainer.querySelector('.compactTrackList__moreLink'),
      hasTag = trackContainer.querySelector('.soundTitle__tagContent'),
      hasArtist = trackContainer.querySelector('.soundTitle__username, .chartTrack__username a, .playableTile__usernameHeading, .trackItem__username'),
      hasTrack = trackContainer.querySelector('.soundTitle__title, .chartTrack__title a, .playableTile__artworkLink, .trackItem__trackTitle'),
      moreActionsGroup = document.querySelector('#sce-moreActions-group'),
      createMoreActionsGroup = document.createElement("div");

      createMoreActionsGroup.className = "moreActions__group";
      createMoreActionsGroup.id = "sce-moreActions-group";

      const relatedLink = ()=> {
         window.location.href = hasTrack.href + "/recommended";
      };
      const renderMoreActionButton = (key, element = null)=> {
         const hasButton = document.querySelector('#sce-'+ key +'-button');
         if (!hasButton) {
            const createButton = document.createElement("button");
            createButton.type = "button";
            createButton.id = "sce-"+ key +"-button";
            createButton.className = "moreActions__button sc-button-medium sce-button-icon sce-button-"+ key +"";
            if (key == "related") {
               createButton.title = "Go to related tracks";
               createButton.innerText = "Related tracks";
            } else if (key == "track") {
               if (isPlaylistURL(element.href)) {
                  createButton.title = "Click to blacklist this playlist";
                  createButton.innerText = "Blacklist playlist";
               } else {
                  createButton.title = "Click to blacklist this track";
                  createButton.innerText = "Blacklist track";
               }
            } else {
               createButton.title = "Click to blacklist this track's "+ key +"";
               createButton.innerText = "Blacklist "+ key +"";
            }
            if (key != "related") {
               let value;
               if (key == "artist" || key == "track") value = element.href;
               else value = element.innerText;
               createButton.setAttribute('data-item', value);
            }
            if (key == "artist") {
               if (stripLinkDomain(hasArtist.href) != userName) createMoreActionsGroup.appendChild(createButton);
            } else createMoreActionsGroup.appendChild(createButton);
         }
      };

      let disableRelatedMenu = false, disableTagMenu = false, disableArtistMenu = false, disableTrackMenu = false;
      if (get.moreActionMenu) {
         if (get.moreActionMenu.relatedActionMenu == "on") disableRelatedMenu = true;
         if (get.moreActionMenu.tagActionMenu == "on") disableTagMenu = true;
         if (get.moreActionMenu.artistActionMenu == "on") disableArtistMenu = true;
         if (get.moreActionMenu.trackActionMenu == "on") disableTrackMenu = true;
      }

      if (!disableRelatedMenu && !hasPlaylists) renderMoreActionButton("related");
      if (!disableTagMenu && hasTag) renderMoreActionButton("hashtag", hasTag);
      if (!disableArtistMenu && hasArtist) renderMoreActionButton("artist", hasArtist);
      if (!disableTrackMenu && hasTrack) renderMoreActionButton("track", hasTrack);

      if (!moreActionsGroup) if (createMoreActionsGroup.hasChildNodes()) moreActionMenu.appendChild(createMoreActionsGroup);

      const relatedButton = document.querySelector("#sce-related-button"),
      hashtagButton = document.querySelector("#sce-hashtag-button"),
      artistButton = document.querySelector("#sce-artist-button"),
      trackButton = document.querySelector("#sce-track-button");

      if (!disableRelatedMenu && relatedButton) {
         relatedButton.removeEventListener("click", relatedLink);
         relatedButton.addEventListener("click", relatedLink);
      }
      if (!disableTagMenu && hashtagButton) addTagToFilter(hashtagButton);
      if (!disableArtistMenu && artistButton) addItemToFilter(artistButton, "artists");
      if (!disableTrackMenu && trackButton) addItemToFilter(trackButton, "tracks");
   });
};

// Activates filter adder button
const addItemToFilter = (button, key)=> {
   const addItemToFilterCallback = ()=> {
      getLocalStorage(get => {
         let loopElement;
         const blacklistItem = button.getAttribute('data-item'),
         blacklistData = stripLinkDomain(blacklistItem),
         filterStructure = get.filter || defaultFilter,
         timestamp = Math.floor(Date.now() / 1000),
         filterItem = {"slug": blacklistData, "time": timestamp};

         if (key == "artists") {
            filterStructure.artists.push(filterItem);
            loopElement = document.querySelectorAll('.soundTitle__username, .chartTrack__username a, .playableTile__usernameHeading, .trackItem__username');
         } else if (key == "tracks") {
            filterStructure.tracks.push(filterItem);
            loopElement = document.querySelectorAll('.soundTitle__title, .chartTrack__title a, .playableTile__artworkLink, .trackItem__trackTitle');
         }

         setLocalStorage(()=> {
            if (chrome.runtime.lastError) alert('Error settings:\n\n' + chrome.runtime.lastError);
            else {
               document.querySelector('.sc-button-more.sc-button.sc-button-active').click();
               const loopElementCount = loopElement.length;
               for (let i = 0; i < loopElementCount; i++) {
                  if (loopElement[i].href == blacklistItem) {
                     const parentClassName = moreActionParentClassName(loopElement[i]);
                     loopElement[i].closest(parentClassName).remove();
                  }
               }
            }
         }, {filter : filterStructure});
      });
   };
   button.removeEventListener("click", addItemToFilterCallback);
   button.addEventListener("click", addItemToFilterCallback);
};

// ...
const addTagToFilter = button => {
   const addTagToFilterCallback = ()=> {
      getLocalStorage(get => {
         const bannedTag = button.getAttribute("data-item"), tagArray = get.tagsArray || [];
         tagArray.push(bannedTag);
         setLocalStorage(()=> {
            const tracksWithTags = document.querySelectorAll('.soundTitle__tagContent');
            if (chrome.runtime.lastError) alert('Error settings:\n\n'+chrome.runtime.lastError);
            else {
               document.querySelector('.sc-button-more.sc-button.sc-button-active').click();
               for (let i = 0; i < tracksWithTags.length; i++) {
                  if (tracksWithTags[i].innerText.toUpperCase() == bannedTag.toUpperCase()){
                     const parentClassName = moreActionParentClassName(tracksWithTags[i]);
                     tracksWithTags[i].closest(parentClassName).remove();
                  }
               }
            }
         }, {tagsArray: tagArray});
      }, ["tagsArray"]);
   };
   button.removeEventListener("click", addTagToFilterCallback);
   button.addEventListener("click", addTagToFilterCallback);
};

// Sorts an array and eliminates any duplicates
const eliminateDuplicates = array => {
   let i, arrayLength = array.length, out = [], obj = {};
   for (i = 0; i < arrayLength; i++) obj[array[i]] = 0;
   for (i in obj) out.push(i);
   return out;
};

// Enabling a .json export and import of SCE settings
const exportimportInit = get => {
   const importElement = document.querySelector('#sce-import input[type="file"]'),
   exportElement = document.querySelector('#sce-export a');

   exportElement.addEventListener("click", ()=>{
      getLocalStorage(get => {
         const exportBlob = new Blob([JSON.stringify(get, null, "\t")], {type: 'application/json'}),
         exportTemp = document.createElement("a"),
         exportName = "SCEnhancer.json",
         exportLink = window.URL.createObjectURL(exportBlob);

         document.body.appendChild(exportTemp);
         exportTemp.style = "display: none";
         exportTemp.href = exportLink;
         exportTemp.download = exportName;

         exportTemp.click();
         window.URL.revokeObjectURL(exportLink);
      });
   });

   const importRead = e => {
      const files = e.target.files, reader = new FileReader();
      reader.onload = importPrase;
      reader.readAsText(files[0]);
   };

   const importPrase = e => {
      const prasedImport = JSON.parse(e.target.result),
      prasedObject = Object.keys(prasedImport),
      importedSettings = {};

      for (let option = 0; option < prasedObject.length; option++) {
         switch (prasedObject[option]) {
            case "discoverModules":
               const keyLength = Object.keys(prasedImport.discoverModules).length, tempDiscoverArray = {};
               for (let key in prasedImport.discoverModules) {
                  if (!isNaN(key)) {
                     if (prasedImport.discoverModules[key] == "1") tempDiscoverArray[key] = "1";
                     else tempDiscoverArray[key] = "0";
                  }
               }
               importedSettings.discoverModules = tempDiscoverArray;
               break;
            case "displayType":
               if (prasedImport.displayType == "list" || prasedImport.displayType == "grid") importedSettings.displayType = prasedImport.displayType;
               else importedSettings.displayType = "default";
               break;
            case "filter":
               const filters = [prasedImport.filter.artists, prasedImport.filter.tracks], filterCount = filters.length, tempFilterObjectContainer = {};
               for (let f = 0; f < filterCount; f++) {
                  const tempFilterArray = [];
                  for (let key in filters[f]) {
                     const tempFilterObject = filters[f][key], slug = tempFilterObject.slug, timestamp = tempFilterObject.time;
                     if (slug) {
                        if (!timestamp) tempFilterObject.time = Math.floor(Date.now() / 1000);
                        let tempFilterArrayLength = tempFilterArray.length, tempFilterMatch = 0;
                        for (let i = 0; i < tempFilterArrayLength; i++)
                           if (tempFilterArray[i].slug == slug) tempFilterMatch = 1;
                        if (tempFilterMatch == 0) tempFilterArray.push(tempFilterObject);
                     }
                  }
                  if (f == 0) tempFilterObjectContainer.artists = tempFilterArray;
                  else tempFilterObjectContainer.tracks = tempFilterArray;
               }
               importedSettings.filter = tempFilterObjectContainer;
               break;
            case "tagsArray":
               const tagsArrayLength = prasedImport.tagsArray.length, tempTagArray = [];
               for (let tag = 0; tag < tagsArrayLength; tag++) tempTagArray.push(prasedImport.tagsArray[tag].toLowerCase());
               importedSettings.tagsArray = eliminateDuplicates(tempTagArray);
               break;
            case "moreActionMenu":
               const tempMoreActionObject = {};
               for (let key in prasedImport.moreActionMenu) {
                  if (prasedImport.moreActionMenu[key] == "on") tempMoreActionObject[key] = prasedImport.moreActionMenu[key];
                  else tempMoreActionObject[key] = "off";
               }
               importedSettings.moreActionMenu = tempMoreActionObject;
               break;
            default:
               let setting = prasedImport[prasedObject[option]];
               if (setting != "on") setting = "off";
               importedSettings[prasedObject[option]] = setting;
         }
      }
      setLocalStorage(()=> {
         if (chrome.runtime.lastError) alert('Error settings:\n\n'+chrome.runtime.lastError);
         else location.reload();
      }, importedSettings);
   };
   importElement.addEventListener("change", importRead, false);
};

// Initializing the settings in the SCE menu
const settingsInit = ()=> {
   if (debugMode) console.log("callback settingsInit: Initializing");

   const darkModeInput = document.querySelector('#darkMode'),
   fullwidthModeInput = document.querySelector('#fullwidthMode'),
   removeSettingsBtnInput = document.querySelector('#removeSettingsBtn'),
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
   disableDiscoverToggleInput = document.querySelector('#disableDiscoverToggle'),
   settingsReset = document.querySelector('#sce-settings-reset'),
   settingsClose = document.querySelectorAll('.sce-close-settings'),
   settingsCloseCount = settingsClose.length;

   // Activates all menu-closing buttons
   for (let i = 0; i < settingsCloseCount; i++) settingsClose[i].addEventListener("click", ()=> {disassembleSettings();});

   // Activates the ability to close the menu by clicking outside of it
   document.addEventListener("mousedown", e => {
      const evt = (e == null ? event : e);
      if (evt.which == 1 || evt.button == 0 || evt.button == 1)
         if (e.target.id == 'sce-settings') disassembleSettings();
   });

   // Activates the reset button
   settingsReset.addEventListener("click", ()=> {
      const warningState = settingsReset.getAttribute("warning");
      if (warningState == "true") {
         resetLocalStorage(()=> {
            location.reload();
         });
      } else {
         settingsReset.setAttribute("warning", true);
         settingsReset.innerText = "Are you sure you want to reset?";
         setTimeout(()=> {
            settingsReset.setAttribute("warning", false);
            settingsReset.innerText = "Reset all SCEnhancer settings";
         }, 5000);
      }
   });

   getLocalStorage(get => {
      if (get.darkMode == "on") darkModeInput.checked = true;
      if (get.fullwidthMode == "on") fullwidthModeInput.checked = true;
      if (get.removeSettingsBtn == "on") removeSettingsBtnInput.checked = true;
      if (get.hideSidebar == "on") hideSidebarInput.checked = true;
      if (get.hideTheUpload == "on") hideTheUploadInput.checked = true;
      if (get.hideBranding == "on") hideBrandingInput.checked = true;
      if (get.displayType == "list") displayTypeInput[1].checked = true;
      else if (get.displayType == "grid") displayTypeInput[2].checked = true;
      else displayTypeInput[0].checked = true;
      if (get.removePreviews == "on") removePreviewsInput.checked = true;
      if (get.removePlaylists == "on") removePlaylistsInput.checked = true;
      if (get.removeLongTracks == "on") removeLongTracksInput.checked = true;
      if (get.removeUserActivity == "on") removeUserActivityInput.checked = true;
      if (get.removeReposts == "on") removeRepostsInput.checked = true;
      if (get.hiddenOutline == "on") hiddenOutlineInput.checked = true;
      if (get.profileImages == "on") profileImagesInput.checked = true;
      if (get.disableUnfollower == "on") disableUnfollowerInput.checked = true;
      if (get.disableDiscoverToggle == "on") disableDiscoverToggleInput.checked = true;
      if (get.moreActionMenu) {
         if (get.moreActionMenu.relatedActionMenu == "on") relatedActionMenuInput.checked = true;
         if (get.moreActionMenu.tagActionMenu == "on") tagActionMenuInput.checked = true;
         if (get.moreActionMenu.artistActionMenu == "on") artistActionMenuInput.checked = true;
         if (get.moreActionMenu.trackActionMenu == "on") trackActionMenuInput.checked = true;
      }
   });

   document.querySelector('#sce-settings-save').addEventListener('click', ()=> {
      const settingsInputs = document.forms['sce-settings-form'].querySelectorAll('input'), settingsInputCount = settingsInputs.length;
      let data = [];
      for (let i = 0; i < settingsInputCount; i++) {
         const inputName = settingsInputs[i].name,
         inputType = settingsInputs[i].type,
         inputChecked = settingsInputs[i].checked,
         inputValue = settingsInputs[i].value;
         let inputOutput = null;

         if (inputType == "checkbox") inputOutput = inputChecked ? "on" : "off";
         else if (inputType == "radio") inputOutput = inputChecked ? inputValue : "skip";
         else inputOutput = inputValue;
         if (inputOutput != "skip") data[inputName] = inputOutput;
      }
      saveSettings(data);
   });
};

// Initializing the filter lists in the SCE menu
const filterInit = ()=> {
   if (debugMode) console.log("callback filterInit: Initializing");
   const artistBlacklist = document.querySelector('#artist-blacklist'),
   trackBlacklist = document.querySelector('#track-blacklist'),
   playlistBlacklist = document.querySelector('#playlist-blacklist'),
   skipTagsInput = document.querySelector('#skipTags');

   getLocalStorage(get => {
      if (get.tagsArray != null) skipTagsInput.value = get.tagsArray;
      insignia(skipTags, {delimiter: ',', deletion: true});

      const target = document.querySelector('.nsg-tags');
      runObserver(target, ()=> {
         const tagElements = document.querySelectorAll('.nsg-tag'), tagElementCount = tagElements.length, tags = [];
         for (let i = 0; i < tagElementCount; i++) tags.push(tagElements[i].innerText);
         setLocalStorage(()=> {
            if (chrome.runtime.lastError) alert('Error while saving settings:\n\n' + chrome.runtime.lastError);
            if (debugMode) console.log("Tag array saved: " + tags);
         }, {tagsArray: tags});
      }, true);
   });

   const filterNameFormatter = string => {
      let strip = string.split("/"), output = strip[0];
      if (strip[1] == "sets") output = strip[2];
      else if (strip[1]) output = strip[1];
      output = output.replace(/-/g, " ");
      output = output.replace(/_/g, " ");
      return output;
   };

   const renderFilterList = (element, key)=> {
      getLocalStorage(get => {
         let filterArray = get.filter.tracks, filterArrayLength = filterArray.length, tempFilterArray = [];
         const trackArraySort = bool => {
            for (let i = 0; i < filterArrayLength; i++) {
               if (bool == true) if (isPlaylistURL(filterArray[i].slug)) tempFilterArray.push(filterArray[i]);
               if (bool == false) if (!isPlaylistURL(filterArray[i].slug)) tempFilterArray.push(filterArray[i]);
            }
            filterArray = tempFilterArray;
         };
         const removeObjectByAttribute = (array, attribute, value)=> {
            let i = array.length;
            while (i--) if (array[i] && array[i].hasOwnProperty(attribute) && array[i][attribute] === value) array.splice(i, 1);
            return array;
         };
         if (get.filter) {
            if (key == "artists" && get.filter.artists) filterArray = get.filter.artists;
            else if (key == "tracks" && get.filter.tracks) trackArraySort(false);
            else if (get.filter.tracks) trackArraySort(true);
         }
         const filterArrayCount = filterArray.length;
         if (filterArrayCount == 0) {
            const emptyMessage = document.createElement("span");
            emptyMessage.innerHTML = "No " + key + " has been filtered!";
            element.appendChild(emptyMessage);
         } else {
            for (let i = 0; i < filterArrayCount; i++) {
               const listItem = document.createElement("li"),
               listItemOrder = document.createElement("span"),
               listItemLink = document.createElement("a"),
               listItemActions = document.createElement("div"),
               listItemTime = document.createElement("span"),
               listItemDelete = document.createElement("span"),
               listItemCount = i + 1;

               listItemOrder.className = "sce-filter-item-order";
               listItemOrder.innerText = "#" + listItemCount;
               listItemActions.className = "sce-filter-actions";
               listItemLink.className = "sce-filter-item-name";
               listItemLink.href = "https://soundcloud.com/" + filterArray[i].slug;
               listItemLink.innerText = filterNameFormatter(filterArray[i].slug);
               listItemLink.target = "_blank";
               listItemTime.innerText = relativeTime(filterArray[i].time);
               listItemTime.className = "sce-filter-option";
               listItemDelete.className = "sce-filter-option-remove";

               listItem.appendChild(listItemOrder);
               listItem.appendChild(listItemLink);
               listItemActions.appendChild(listItemTime);
               listItemActions.appendChild(listItemDelete);
               listItem.appendChild(listItemActions);
               element.appendChild(listItem);

               listItemDelete.addEventListener("click", ()=> {
                  getLocalStorage(get => {
                     let filterObject = get.filter;
                     if (key == "artists") removeObjectByAttribute(filterObject.artists, "slug", filterArray[i].slug);
                     else removeObjectByAttribute(filterObject.tracks, "slug", filterArray[i].slug);

                     setLocalStorage(()=> {
                        listItemDelete.closest("li").remove();
                        const filterContainers = document.querySelectorAll('.filter-container'), filterContainerCount = filterContainers.length;
                        for (let j = 0; j < filterContainerCount; j++) {
                           if (!filterContainers[i].hasChildNodes()) {
                              const emptyMessage = document.createElement("span");
                              emptyMessage.innerHTML = "No " + key + " has been filtered!";
                              filterContainers[j].appendChild(emptyMessage);
                           }
                        }
                     }, {filter: filterObject});
                  }, ["filter"]);
               });
            }
         }
      });
   };
   renderFilterList(artistBlacklist, "artists");
   renderFilterList(trackBlacklist, "tracks");
   renderFilterList(playlistBlacklist, "playlists");
};

// Fetching data from local/online browser storage
const getLocalStorage = (callback, localSettings = null)=> {
   const getSettings = localSettings || getGlobalSettings;
   chrome.storage.sync.get(getSettings, callback);
};

// Sending data to local/online browser storage
const setLocalStorage = (callback, localSettings = null)=> {
   const setSettings = localSettings || setGlobalSettings;
   chrome.storage.sync.set(setSettings, callback);
};

// Factory resets all SCE created local/online browser storage
const resetLocalStorage = callback => {
   chrome.storage.sync.remove(getGlobalSettings, callback);
};

// Run setup after tab/window reload
const readyStateCheck = ()=> {
   let timer, bodyObserver = new MutationObserver(mutations => {
      clearTimeout(timer);
      timer = setTimeout(()=> {
         if (debugMode) console.log("readyState: Complete");
         bodyObserver.disconnect();

         settingsSetup();
         injectedJavascript();
      }, 200);
   });
   bodyObserver.observe(body, globalConfig);
};
document.addEventListener("readystatechange", readyStateCheck);

// Detect new page load
setInterval(()=> {
   if (location.href != oldLocation) {
      if (debugMode) console.log("-=- NEW PAGE LOADED -=-");
      oldLocation = location.href;
      readyStateCheck();
   }
}, 100);

// =============================================================
// Main functions
// =============================================================

// Inserts <body> attributes
const setAttributes = ()=> {
   if (debugMode) console.log("function setAttributes: Initializing");

   getLocalStorage(get => {
      if (get.darkMode == "on") body.setAttribute("data-theme", "dark");
      if (get.fullwidthMode == "on") body.setAttribute("fullwidth", "");
      if (get.removeSettingsBtn != "on") body.setAttribute("settings-button", "");
      if (get.hideSidebar == "on") body.setAttribute("data-sidebar", "hidden");
      else body.setAttribute("data-sidebar", "show");
      if (location.href == "https://soundcloud.com/stream") {
         if (get.displayType == "list") body.setAttribute("data-display", "list");
         else if (get.displayType == "grid") body.setAttribute("data-display", "grid");
         else body.setAttribute("data-display", "default");
      }
      if (get.hiddenOutline == "on") body.setAttribute("hidden-outline", "");
      if (get.profileImages == "on") body.setAttribute("square", "");
   });
};
setAttributes();

// Setting up initial functionality
const settingsSetup = ()=> {
   if (debugMode) console.log("function settingsSetup: Initializing");

   const hasStreamController = document.querySelector('#stream-controller'),
   hasVersionDisplay = document.querySelector('#version-display'),
   hasEnhancerButton = document.querySelector('#enhancer-btn'),
   soundPanel = document.querySelector('.playControls'),
   soundPanelInner = document.querySelector('.playControls__inner'),
   announcements = document.querySelector('.announcements.g-z-index-fixed-top'),
   userMenu = document.querySelector('.header__userNavUsernameButton'),
   logo = document.querySelector('.header__logo.left');

   // Force-open sound control panel
   soundPanel.className = "playControls g-z-index-header m-visible";
   announcements.className = "announcements g-z-index-fixed-top m-offset";

   getLocalStorage(get => {
      // Setup SoundCloud Enhancer branding
      if (get.hideBranding != "on") {
         logo.id = "sce-logo";
         if (!hasVersionDisplay) {
            const versionDisplay = document.createElement("span");
            versionDisplay.id = "version-display";
            versionDisplay.innerText = manifestData.version;
            logo.appendChild(versionDisplay);
         }
      }

      // Setup SoundCloud Enhancer button
      if (get.removeSettingsBtn != "on") {
         if (!hasEnhancerButton) {
            const SCEContainer = document.createElement("div"),
            SCEButton = document.createElement("button");

            SCEContainer.id = "enhancer-container";
            SCEButton.className = "sc-enhancer sc-button sc-button-medium sc-button-responsive";
            SCEButton.id = "enhancer-btn";
            SCEButton.tabindex = "0";
            SCEButton.innerText = "SCEnhancer";

            SCEContainer.appendChild(SCEButton);
            soundPanelInner.appendChild(SCEContainer);
            settingsMenu();
         }
      }

      // Add the "The Upload" playlist to the stream explore tab
      if (location.href == "https://soundcloud.com/stream" || location.href == "https://soundcloud.com/charts/top" || location.href == "https://soundcloud.com/discover") {
         const renderTheUploadShortcut = setInterval(()=> {
            const hasExploreTab = document.querySelector('.streamExploreTabs ul.g-tabs');
            if (hasExploreTab.querySelectorAll('li').length == 3) {
               clearInterval(renderTheUploadShortcut);
               const hasUploadTab = hasExploreTab.querySelector('#the-upload-tab');
               if (!hasUploadTab) {
                  const tabItem = document.createElement("li"),
                  tabItemLink = document.createElement("a");

                  tabItem.className = "g-tabs-item";
                  tabItemLink.className = "g-tabs-link";
                  tabItemLink.id = "the-upload-tab";
                  tabItemLink.href = "/discover/sets/new-for-you:" + userID;
                  tabItemLink.innerText = "The Upload";

                  tabItem.appendChild(tabItemLink);
                  hasExploreTab.appendChild(tabItem);
               }
            }
         }, 100);
      }

      // Add a "like" menu point to the profiles
      const renderProfileLikesShortcut = setInterval(()=> {
         const hasProfileMenu = document.querySelector('ul.profileTabs.g-tabs');
         if (hasProfileMenu) {
            const hasProfileLikeButton = document.querySelector('#profile-tab-like');
            if (!hasProfileLikeButton) {
               clearInterval(renderProfileLikesShortcut);
               const getUserSlug = hasProfileMenu.querySelector('.g-tabs-link:first-child').getAttribute('href'),
               createLikeMenu = document.createElement("li"),
               createLikeLink = document.createElement("a");

               createLikeMenu.className = "g-tabs-item";
               createLikeMenu.id = "profile-tab-like";
               createLikeLink.className = "g-tabs-link";
               createLikeLink.href = getUserSlug + "/likes";
               createLikeLink.innerText = "Likes";

               createLikeMenu.appendChild(createLikeLink);
               hasProfileMenu.appendChild(createLikeMenu);
            }
         }
      }, 100);

      // Render a SCE button in the user navigation menu
      const renderEnhancerProfileMenu = ()=> {
         const hasEnhancerMenuItems = document.querySelector('.profileMenu__list.profileMenu__enhancer.sc-list-nostyle');
         if (!hasEnhancerMenuItems) {
            userMenu.removeEventListener("click", renderEnhancerProfileMenu);
            const profileMenu = document.querySelector('.profileMenu'),
            profileMenuEnhancer = document.createElement('ul'),
            profileMenuEnhancerItem = document.createElement('li'),
            profileMenuEnhancerLink = document.createElement('a');

            profileMenuEnhancer.className = "profileMenu__list profileMenu__enhancer sc-enhancer sc-list-nostyle";
            profileMenuEnhancerItem.className = "profileMenu__item";
            profileMenuEnhancerLink.className = "profileMenu__link profileMenu__enhancerMenu";
            profileMenuEnhancerLink.innerText = "SCEnhancer";

            profileMenuEnhancerItem.appendChild(profileMenuEnhancerLink);
            profileMenuEnhancer.appendChild(profileMenuEnhancerItem);
            profileMenu.appendChild(profileMenuEnhancer);

            settingsMenu();
            let detectProfileMenuFade = setInterval(()=> {
               const hasEnhancerMenuItems = document.querySelector('.profileMenu__list.profileMenu__enhancer.sc-list-nostyle');
               if (!hasEnhancerMenuItems) {
                  settingsMenu();
                  clearInterval(detectProfileMenuFade);
                  userMenu.addEventListener("click", renderEnhancerProfileMenu);
               }
            }, 100);
         }
      };
      userMenu.removeEventListener("click", renderEnhancerProfileMenu);
      userMenu.addEventListener("click", renderEnhancerProfileMenu);

      // Render discover module toogle links
      if (get.disableDiscoverToggle != "on") {
         if (location.href == "https://soundcloud.com/discover") {
            let discoverInterval = setInterval(()=> {
               const hasDiscoverContainer = document.querySelector('div.modularHome.lazyLoadingList ul.lazyLoadingList__list');
               if (hasDiscoverContainer) {
                  clearInterval(discoverInterval);
                  const discoverModuleHider = ()=> {
                     getLocalStorage(get => {
                        if (debugMode) console.log("function discoverModuleHider: Running");
                        const discoverModule = hasDiscoverContainer.querySelectorAll('.selectionModule'), discoverModuleCount = discoverModule.length;
                        for (let i = 0; i < discoverModuleCount; i++) {
                           const moduleArray = get.discoverModules || {},
                           moduleSectionState = moduleArray[i] == 1 ? "hidden" : "shown",
                           discoverModuleContainer = discoverModule[i].querySelector('h2.selectionModule__titleText'),
                           hasModuleSwitch = discoverModuleContainer.querySelector('a.hide-discover-section');
                           discoverModule[i].setAttribute("state", moduleSectionState);

                           if (!hasModuleSwitch) {
                              const moduleState = moduleArray[i] == 1 ? 0 : 1,
                              moduleStateText = moduleArray[i] == 1 ? "Show this section" : "Hide this section",
                              discoverModuleToogle = document.createElement("a");

                              discoverModuleToogle.className = "hide-discover-section";
                              discoverModuleToogle.innerText = moduleStateText;
                              discoverModuleToogle.setAttribute("section-id", i);
                              discoverModuleToogle.setAttribute("section-state", moduleState);
                              discoverModuleContainer.appendChild(discoverModuleToogle);

                              const moduleSwitch = document.querySelector('.hide-discover-section[section-id="'+ i +'"]');
                              moduleSwitch.addEventListener("click", ()=> {
                                 getLocalStorage(get => {
                                    const sectionID = moduleSwitch.getAttribute("section-id"),
                                    sectionState = moduleSwitch.getAttribute("section-state"),
                                    moduleArray = get.discoverModules || {};
                                    moduleArray[sectionID] = sectionState;

                                    setLocalStorage(()=> {
                                       if (chrome.runtime.lastError) alert('Error while saving settings:\n\n' + chrome.runtime.lastError);
                                       else {
                                          const moduleStateText = moduleArray[sectionID] == 1 ? "Show this section" : "Hide this section",
                                          moduleSectionState = moduleArray[i] == 1 ? "hidden" : "shown",
                                          moduleState = moduleArray[sectionID] == 1 ? 0 : 1,
                                          moduleContainer = moduleSwitch.closest('.selectionModule');
                                          moduleSwitch.innerText = moduleStateText;
                                          moduleSwitch.setAttribute("section-state", moduleState);
                                          moduleContainer.setAttribute("state", moduleSectionState);
                                       }
                                    }, {discoverModules: moduleArray});
                                 });
                              });
                           }
                        }
                     });
                  };
                  discoverModuleHider();
                  runObserver(hasDiscoverContainer, discoverModuleHider);
               }
            }, 100);
         }
      }

      // Render quick display switcher
      if (location.href == "https://soundcloud.com/stream") {
         let renderStreamDisplaySwitch = setInterval(()=> {
            const streamHeader = document.querySelector('.stream__header');
            if (streamHeader) {
               clearInterval(renderStreamDisplaySwitch);
               if (!hasStreamController) {
                  const streamController = document.createElement("div"),
                  textContainer = document.createElement("div"),
                  textHeader = document.createElement("h3"),
                  listContainer = document.createElement("ul"),
                  defaultList = document.createElement("li"),
                  compactList = document.createElement("li"),
                  gridList = document.createElement("li");

                  streamController.className = "stream__controls";
                  streamController.id = "stream-controller";
                  textContainer.className = "listDisplayToggle g-flex-row-centered";
                  textHeader.className = "listDisplayToggleTitle sc-text-light sc-type-medium";
                  textHeader.innerText = "View";
                  listContainer.className = "listDisplayToggle sc-list-nostyle g-flex-row-centered";
                  defaultList.className = "listDisplayToggle setting-display-tile default-icon";
                  defaultList.title = "Default";
                  defaultList.setAttribute('data-id', "default");
                  compactList.className = "listDisplayToggle setting-display-tile list-icon";
                  compactList.title = "Compact";
                  compactList.setAttribute('data-id', "list");
                  gridList.className = "listDisplayToggle setting-display-tile grid-icon";
                  gridList.title = "Grid";
                  gridList.setAttribute('data-id', "grid");

                  textContainer.appendChild(textHeader);
                  listContainer.appendChild(defaultList);
                  listContainer.appendChild(compactList);
                  listContainer.appendChild(gridList);
                  textContainer.appendChild(listContainer);
                  streamController.appendChild(textContainer);
                  streamHeader.appendChild(streamController);

                  const getDefaultList = document.querySelector('.listDisplayToggle.setting-display-tile.default-icon'),
                  getCompactList = document.querySelector('.listDisplayToggle.setting-display-tile.list-icon'),
                  getGridList = document.querySelector('.listDisplayToggle.setting-display-tile.grid-icon');

                  if (get.displayType == "list") getCompactList.classList.add("active");
                  else if (get.displayType == "grid") getGridList.classList.add("active");
                  else getDefaultList.classList.add("active");

                  const getLists = document.querySelectorAll('.listDisplayToggle.setting-display-tile'), getListCount = getLists.length;
                  for (let i = 0; i < getListCount; i++) {
                     getLists[i].addEventListener('click', ()=> {
                        let getData = getLists[i].getAttribute("data-id");
                        for (let i = 0; i < getListCount; i++) getLists[i].classList.remove("active");

                        if (getData == "list") {
                           body.setAttribute("data-display", "list");
                           getCompactList.classList.add("active");
                        } else if (getData == "grid") {
                           body.setAttribute("data-display", "grid");
                           getGridList.classList.add("active");
                        } else {
                           body.setAttribute("data-display", "default");
                           getDefaultList.classList.add("active");
                        }

                        setLocalStorage(()=> {
                           if (chrome.runtime.lastError) alert('Error while saving settings:\n\n' + chrome.runtime.lastError);
                           if (debugMode) console.log("Display mode saved: " + getData);
                        }, {displayType: getData});
                     });
                  }
               }
            }
         }, 100);
      }

      // Render mass unfollower on the "following" page
      if (location.href == "https://soundcloud.com/you/following") {
         if (get.disableUnfollower != "on") {
            let unfollowerInterval = setInterval(()=> {
               const hasUnfollowerContainer = document.querySelector('.collectionSection__list .lazyLoadingList.badgeList ul.lazyLoadingList__list');
               if (hasUnfollowerContainer) {
                  clearInterval(unfollowerInterval);
                  const collectionHeader = document.querySelector('.collectionSection__top'),
                  massUnfollowButton = document.querySelector("#mass-unfollow");

                  if (massUnfollowButton == null) {
                     const massUnfollowContainer = document.createElement("div"),
                     textContainer = document.createElement("div"),
                     textHeader = document.createElement("h3"),
                     confirmUnfollowButton = document.createElement("button"),
                     undoUnfollowButton = document.createElement("button"),
                     allUnfollowButton = document.createElement("button");

                     massUnfollowContainer.className = "stream__controls";
                     massUnfollowContainer.id = "mass-unfollow";
                     textContainer.className = "g-flex-row-centered";
                     textHeader.className = "sc-text-light sc-type-medium margin-spacing";
                     textHeader.innerText = "Options:";
                     confirmUnfollowButton.className = "sc-button margin-spacing";
                     confirmUnfollowButton.id = "confirm-unfollow-button";
                     confirmUnfollowButton.innerText = "Mass unfollow";
                     undoUnfollowButton.className = "sc-button margin-spacing";
                     undoUnfollowButton.id = "undo-unfollow-button";
                     undoUnfollowButton.innerText = "Reset selection";
                     allUnfollowButton.className = "sc-button";
                     allUnfollowButton.id = "all-unfollow-button";
                     allUnfollowButton.innerText = "Select all";

                     textContainer.appendChild(textHeader);
                     textContainer.appendChild(confirmUnfollowButton);
                     textContainer.appendChild(undoUnfollowButton);
                     textContainer.appendChild(allUnfollowButton);
                     massUnfollowContainer.appendChild(textContainer);

                     insertAfter(massUnfollowContainer, collectionHeader);
                     collectionHeader.style.margin = "0px";
                  }

                  multiFollow();
                  runObserver(hasUnfollowerContainer, multiFollow);

                  const confirmSection = document.querySelector('#confirm-unfollow-button'),
                  undoSection = document.querySelector('#undo-unfollow-button'),
                  selectAll = document.querySelector('#all-unfollow-button');

                  confirmSection.addEventListener('click', ()=> {
                     const unfollowLoop = document.querySelectorAll('.badgeList__item'), unfollowLoopCount = unfollowLoop.length;
                     let newFollowCount = 0;
                     for (let i = 0; i < unfollowLoopCount; i++) {
                        const checkFollowStatus = unfollowLoop[i].querySelector('label.userBadgeListItem__checkbox input.sc-checkbox-input');
                        if (checkFollowStatus.checked == true) {
                           const closestUnfollowButton = unfollowLoop[i].querySelector('.userBadgeListItem .userBadgeListItem__action button.sc-button-follow');
                           closestUnfollowButton.click();
                           newFollowCount++;
                        }
                     }
                     if (newFollowCount == 1) confirmSection.innerText = "1 account got unfollowed!";
                     else confirmSection.innerText = newFollowCount + " accounts got unfollowed!";
                     setTimeout(()=> {confirmSection.innerText = "Mass unfollow";}, 3000);
                  });
                  undoSection.addEventListener('click', ()=> {
                     massSelector(false);
                  });
                  selectAll.addEventListener('click', ()=> {
                     massSelector(true);
                  });
               }
            }, 100);
         }
      }
   });
};

// Rendering SCE menu shell
const renderSettings = ()=> {
   if (debugMode) console.log("function renderSettings: Initializing");

   body.className = "g-overflow-hidden";
   body.style.paddingRight = "0px";
   app.className = "g-filter-grayscale";

   const modal = document.createElement("div"),
   modalClose = document.createElement("button"),
   modalContainer = document.createElement("div"),
   modalContent = document.createElement("div"),
   modalTitle = document.createElement("h1"),
   modalCredits = document.createElement("span"),
   modalTabs = document.createElement("ul"),
   modalTabListSettings = document.createElement("li"),
   modalTabListFilter = document.createElement("li"),
   modalTabListChangelog = document.createElement("li"),
   modalTabListAbout = document.createElement("li"),
   modalTabListSideItems = document.createElement("ul"),
   modalTabListImport = document.createElement("li"),
   modalImportWrapper = document.createElement("label"),
   modalImportUpload = document.createElement("input"),
   modalTabListExport = document.createElement("li"),
   modalTabSettings = document.createElement("a"),
   modalTabFilter = document.createElement("a"),
   modalTabChangelog = document.createElement("a"),
   modalTabAbout = document.createElement("a"),
   modalTabImport = document.createElement("a"),
   modalTabExport = document.createElement("a"),
   modalPageContainer = document.createElement("div"),
   modalPageSettings = document.createElement("div"),
   modalPageFilter = document.createElement("div"),
   modalPageChangelog = document.createElement("div"),
   modalPageAbout = document.createElement("div"),
   modalFooterLine = document.createElement("hr"),
   modalDonation = document.createElement("span"),
   modalDonationLink = document.createElement("a");

   modal.id = "sce-settings";
   modal.className = "modal g-z-index-modal-background g-opacity-transition g-z-index-overlay modalWhiteout showBackground invisible";
   modal.style.paddingRight = "0px";
   modal.style.outline = "none";
   modal.style.overflow = "hidden";
   modal.tabindex = "-1";
   modalClose.className = "modal__closeButton sce-close-settings";
   modalClose.title = "Close";
   modalClose.type = "button";
   modalClose.innerText = "Close";
   modalContainer.className = "modal__modal sc-border-box g-z-index-modal-content";
   modalContent.className = "modal__content";
   modalTitle.id = "sce-settings-title";
   modalTitle.className = "g-modal-title-h1 sc-truncate";
   modalTitle.innerText = "SoundCloud Enhancer " + manifestData.version;
   modalCredits.className = "credits";
   modalCredits.innerHTML = "Made with <span class='heart'>&hearts;</span> in Denmark by <a href='https://twitter.com/DapperBenji' target='_blank'>@DapperBenji</a>.";
   modalTabs.id = "tab-container";
   modalTabs.className = "g-tabs g-tabs-small";
   modalTabListSettings.className = "g-tabs-item";
   modalTabListFilter.className = "g-tabs-item";
   modalTabListChangelog.className = "g-tabs-item";
   modalTabListAbout.className = "g-tabs-item";
   modalTabListSideItems.className = "g-side-items";
   modalTabListImport.className = "g-tabs-item";
   modalTabListImport.id = "sce-import";
   modalImportUpload.className = "hidden";
   modalImportUpload.type = "file";
   modalImportUpload.accept = ".json";
   modalTabListExport.className = "g-tabs-item";
   modalTabListExport.id = "sce-export";
   modalTabSettings.setAttribute("action", "settings");
   modalTabSettings.className = "tab g-tabs-link active";
   modalTabSettings.innerText = "Settings";
   modalTabFilter.setAttribute("action", "filter");
   modalTabFilter.className = "tab g-tabs-link";
   modalTabFilter.innerText = "Filter (beta)";
   modalTabChangelog.setAttribute("action", "changelog");
   modalTabChangelog.className = "tab g-tabs-link";
   modalTabChangelog.innerText = "Changelog";
   modalTabAbout.setAttribute("action", "about");
   modalTabAbout.className = "tab g-tabs-link";
   modalTabAbout.innerText = "About";
   modalTabImport.className = "g-tabs-link";
   modalTabImport.innerText = "Import";
   modalTabExport.className = "g-tabs-link";
   modalTabExport.innerText = "Export";
   modalPageContainer.id = "sce-settings-content";
   modalPageSettings.className = "tabPage";
   modalPageSettings.id = "settings";
   modalPageSettings.style.display = "block";
   modalPageFilter.className = "tabPage";
   modalPageFilter.id = "filter";
   modalPageChangelog.className = "tabPage";
   modalPageChangelog.id = "changelog";
   modalPageAbout.className = "tabPage";
   modalPageAbout.id = "about";
   modalDonation.className = "donation";
   modalDonationLink.href = "https://www.paypal.me/BenjaminBachJensen";
   modalDonationLink.innerText = "Support the development - Buy me a cup of coffee ;)";
   modalDonationLink.target = "_blank";

   modalPageContainer.appendChild(modalPageSettings);
   modalPageContainer.appendChild(modalPageFilter);
   modalPageContainer.appendChild(modalPageChangelog);
   modalPageContainer.appendChild(modalPageAbout);
   modalTabListSettings.appendChild(modalTabSettings);
   modalTabListFilter.appendChild(modalTabFilter);
   modalTabListChangelog.appendChild(modalTabChangelog);
   modalTabListAbout.appendChild(modalTabAbout);
   modalImportWrapper.appendChild(modalTabImport);
   modalImportWrapper.appendChild(modalImportUpload);
   modalTabListImport.appendChild(modalImportWrapper);
   modalTabListExport.appendChild(modalTabExport);
   modalTabListSideItems.appendChild(modalTabListImport);
   modalTabListSideItems.appendChild(modalTabListExport);
   modalTabs.appendChild(modalTabListSettings);
   modalTabs.appendChild(modalTabListFilter);
   modalTabs.appendChild(modalTabListChangelog);
   modalTabs.appendChild(modalTabListAbout);
   modalTabs.appendChild(modalTabListSideItems);
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

   setTimeout(()=> {modal.classList.remove("invisible");}, 10);
   setTimeout(()=> {modal.style.overflow = null;}, 400);

   fetchFile(modalPageSettings, '/assets/html/settings.html', settingsInit);
   fetchFile(modalPageFilter, '/assets/html/filter.html', filterInit);
   fetchFile(modalPageChangelog, '/assets/html/changelog.html');
   fetchFile(modalPageAbout, '/assets/html/about.html');

   // Activates tab logic
   const tabs = document.querySelectorAll('.tab'), tabCount = tabs.length;
   for (let i = 0; i < tabCount; i++) {
      tabs[i].addEventListener('click', ()=> {
         for (let k = 0; k < tabCount; k++) tabs[k].className = "tab g-tabs-link";
         tabs[i].className = "tab g-tabs-link active";
         const pages = document.querySelectorAll('.tabPage'), pageCount = pages.length;
         for (let j = 0; j < pageCount; j++) pages[j].style.display = "none";
         const page = tabs[i].getAttribute('action');
         document.getElementById(page).style.display = "block";
      });
   }

   getLocalStorage(exportimportInit);
};

// Storing saved SCE settings
const saveSettings = data => {
   const moreActionMenuObject = {};
   if (data.darkMode != "on") data.darkMode = "off";
   if (data.fullwidthMode != "on") data.fullwidthMode = "off";
   if (data.removeSettingsBtn != "on") data.removeSettingsBtn = "off";
   if (data.hideSidebar != "on") data.hideSidebar = "off";
   if (data.hideBranding != "on") data.hideBranding = "off";
   if (data.displayType == "default") data.displayType = "";
   if (data.removePreviews != "on") data.removePreviews = "off";
   if (data.removePlaylists != "on") data.removePlaylists = "off";
   if (data.removeLongTracks != "on") data.removeLongTracks = "off";
   if (data.removeUserActivity != "on") data.removeUserActivity = "off";
   if (data.removeReposts != "on") data.removeReposts = "off";
   if (data.hiddenOutline != "on") data.hiddenOutline = "off";
   if (data.profileImages != "on") data.profileImages = "off";
   if (data.disableUnfollower != "on") data.disableUnfollower = "off";
   if (data.disableDiscoverToggle != "on") data.disableDiscoverToggle = "off";

   // More action menu
   if (data.relatedActionMenu != "on") moreActionMenuObject.relatedActionMenu = "off";
   else moreActionMenuObject.relatedActionMenu = "on";
   if (data.tagActionMenu != "on") moreActionMenuObject.tagActionMenu = "off";
   else moreActionMenuObject.tagActionMenu = "on";
   if (data.artistActionMenu != "on") moreActionMenuObject.artistActionMenu = "off";
   else moreActionMenuObject.artistActionMenu = "on";
   if (data.trackActionMenu != "on") moreActionMenuObject.trackActionMenu = "off";
   else moreActionMenuObject.trackActionMenu = "on";

   setGlobalSettings.darkMode = data.darkMode;
   setGlobalSettings.fullwidthMode = data.fullwidthMode;
   setGlobalSettings.removeSettingsBtn = data.removeSettingsBtn;
   setGlobalSettings.hideSidebar = data.hideSidebar;
   setGlobalSettings.hideBranding = data.hideBranding;
   setGlobalSettings.displayType = data.displayType;
   setGlobalSettings.removePreviews = data.removePreviews;
   setGlobalSettings.removePlaylists = data.removePlaylists;
   setGlobalSettings.removeLongTracks = data.removeLongTracks;
   setGlobalSettings.removeUserActivity = data.removeUserActivity;
   setGlobalSettings.removeReposts = data.removeReposts;
   setGlobalSettings.hiddenOutline = data.hiddenOutline;
   setGlobalSettings.profileImages = data.profileImages;
   setGlobalSettings.disableUnfollower = data.disableUnfollower;
   setGlobalSettings.disableDiscoverToggle = data.disableDiscoverToggle;
   setGlobalSettings.moreActionMenu = moreActionMenuObject;

   setLocalStorage(()=> {
      if (chrome.runtime.lastError) alert('Error while saving settings:\n\n' + chrome.runtime.lastError);
      else location.reload();
   });
};

// Assigning SCE menus to SCE buttons
const settingsMenu = ()=> {
   if (debugMode) console.log("function settingsMenu: Initializing");
   const settingsButtons = document.querySelectorAll('.sc-enhancer'), settingsButtonCount = settingsButtons.length;
   for (let i = 0; i < settingsButtonCount; i++) {
      settingsButtons[i].removeEventListener("click", renderSettings);
      settingsButtons[i].addEventListener("click", renderSettings);
   }
};

// Run music-stream manipulating functions
const injectedJavascript = ()=> {
   if (debugMode) console.log("function injectedJavascript: Initializing");
   const content = document.querySelector('#content'),
   soundBadge = document.querySelector('.playbackSoundBadge'),
   streamHeader = document.querySelector('.stream__header'),
   getUsername = document.querySelector('.header__userNavUsernameButton'),
   getUsernameHref = getUsername.getAttribute("href"),
   nextControl = document.querySelector('.skipControl__next'),
   previousControl = document.querySelector('.skipControl__previous');

   // =============================================================
   // Music-stream manipulation functions
   // =============================================================

   // Filter user inputed tags, artists and tracks
   const runFilters = ()=> {
      getLocalStorage(get => {
         const filters = ["tag", "artist", "track"], filtersLength = filters.length;
         for (let filter = 0; filter < filtersLength; filter++) {
            let element = null, data = null,
            filterFunction = (callback, element, data) => {
               if (stripLinkDomain(element.href) == data.slug) callback();
            };

            switch (filters[filter]) {
               case "tag":
                  element = document.querySelectorAll('.soundTitle__tagContent');
                  if (get.tagsArray) data = get.tagsArray;
                  filterFunction = (callback, element, data) => {
                     if (element.innerText.toUpperCase() == data.toUpperCase()) callback(data);
                  };
                  break;
               case "artist":
                  element = document.querySelectorAll('.soundTitle__username');
                  if (get.filter) if (get.filter.artists) data = get.filter.artists;
                  break;
               case "track":
                  element = document.querySelectorAll('.soundTitle__title');
                  if (get.filter) if (get.filter.tracks) data = get.filter.tracks;
                  break;
            }

            if (element && data) {
               const elementLength = element.length, dataLength = data.length;
               for (let el = 0; el < elementLength; el++) {
                  for (let i = 0; i < dataLength; i++) {
                     const parentClassName = moreActionParentClassName(element[el]), parentElement = element[el].closest(parentClassName);
                     filterFunction((value = null) => {
                        parentElement.setAttribute("data-skip", "true");
                        if (value) parentElement.setAttribute("banned-"+ filters[filter] +"", value);
                        else parentElement.setAttribute("banned-"+ filters[filter] +"", "");
                        parentElement.className += " hidden";
                     }, element[el], data[i]);
                  }
               }
            }
         }
      }, ["filter", "tagsArray"]);
   };

   const markPlaylists = ()=> {
      if (debugMode) console.log("function markPlaylists: Running");
      const getPlaylists = document.querySelectorAll('.soundList__item .activity div.sound.streamContext'), getPlaylistCount = getPlaylists.length;
      for (let i = 0; i < getPlaylistCount; i++) {
         let getPlaylist = getPlaylists[i].className;
         if (getPlaylist.includes("playlist") == true) {
            let getTrackCountNum, getTrackCount = getPlaylists[i].querySelectorAll('.compactTrackList__listContainer .compactTrackList__item');
            if (getTrackCount.length < 5) getTrackCountNum = getTrackCount.length;
            else {
               let checkMoreLink = getPlaylists[i].querySelector('.compactTrackList__moreLink');
               if (checkMoreLink) getTrackCountNum = checkMoreLink.innerText.replace(/\D/g,'');
               else getTrackCountNum = getTrackCount.length;
            }
            let playlistClosest = getPlaylists[i].closest('.soundList__item');
            playlistClosest.setAttribute("data-playlist", "true");
            playlistClosest.setAttribute("data-count", getTrackCountNum);
         }
      }
   };

   const hidePreviews = ()=> {
      if (debugMode) console.log("function hidePreviews: Running");
      let previews = document.querySelectorAll('.sc-snippet-badge.sc-snippet-badge-medium.sc-snippet-badge-grey'), previewCount = previews.length;
      for (let i = 0; i < previewCount; i++) {
         if (previews[i].innerHTML) {
            let previewsClosest = previews[i].closest('.soundList__item');
            previewsClosest.setAttribute("data-skip", "true");
            previewsClosest.setAttribute("data-type", "preview");
            previewsClosest.className = "soundList__item hidden";
         }
      }
   };

   const hidePlaylists = ()=> {
      if (debugMode) console.log("function hidePlaylists: Running");
      let playlists = document.querySelectorAll('.soundList__item'), playlistCount = playlists.length;
      for (let i = 0; i < playlistCount; i++) {
         let getPlaylistAttribute = playlists[i].getAttribute("data-playlist");
         if (getPlaylistAttribute == "true") {
            playlists[i].setAttribute("data-skip", "true");
            playlists[i].className = "soundList__item hidden";
         }
      }
   };

   const hideReposts = ()=> {
      if (debugMode) console.log("function hideReposts: Running");
      let reposts = document.querySelectorAll('.soundContext__repost'), repostCount = reposts.length;
      for (let i = 0; i < repostCount; i++) {
         let repostClosest = reposts[i].closest('.soundList__item');
         repostClosest.setAttribute("data-skip", "true");
         repostClosest.setAttribute("data-type", "repost");
         repostClosest.className = "soundList__item hidden";
      }
   };

   const checkCanvas = ()=> {
      if (debugMode) console.log("function checkCanvas: Running");
      let canvas = document.querySelectorAll('.sound__waveform .waveform .waveform__layer.waveform__scene');
      for (let i = 0; i < canvas.length; i++) {
         let canvasCount = canvas[i].querySelectorAll('canvas.g-box-full.sceneLayer');
         for (let j = 0; j < canvasCount.length; j++) {
            let lastElement = canvasCount[canvasCount.length-1],
               getCanvas = lastElement.getContext("2d"),
               lengthCalc = lastElement.width - 27,
               pixelData = getCanvas.getImageData(lengthCalc,27,1,1).data;
            if (pixelData[0] == 0 && pixelData[1] == 0 && pixelData[2] == 0 && pixelData[3] == 255) {
               let canvasClosest = canvas[i].closest('.soundList__item');
               canvasClosest.setAttribute("data-skip", "true");
               canvasClosest.setAttribute("data-type", "long");
               canvasClosest.className = "soundList__item hidden";
            }
         }
      }
   };

   const checkUserActivity = ()=> {
      if (debugMode) console.log("function checkUserActivity: Running");
      let yourTracks = document.querySelectorAll('.soundContext__usernameLink'), yourTrackCount = yourTracks.length;
      for (let i = 0; i < yourTrackCount; i++) {
         let yourTrackHref = yourTracks[i].getAttribute("href");
         if (getUsernameHref == yourTrackHref) {
            let trackClosest = yourTracks[i].closest('.soundList__item');
            trackClosest.setAttribute("data-skip", "true");
            trackClosest.setAttribute("data-type", "yours");
            trackClosest.className = "soundList__item hidden";
         }
      }
   };

   const renderMoreActionCallback = e => {
      const checkMoreActionMenu = document.querySelector('.moreActions #sce-moreActions-group');
      if (!checkMoreActionMenu) {
         const parentClassName = moreActionParentClassName(e.target), trackContainer = e.target.closest(parentClassName);
         moreActionMenuContent(trackContainer);
      }
   };

   const renderMoreAction = ()=> {
      const moreActionButtons = document.querySelectorAll('button.sc-button-more.sc-button-small'), moreActionButtonCount = moreActionButtons.length;
      for (let i = 0; i < moreActionButtonCount; i++) {
         moreActionButtons[i].removeEventListener('click', renderMoreActionCallback);
         moreActionButtons[i].addEventListener('click', renderMoreActionCallback);
      }
   };

   // Main initializing function
   const initStreamManipulator = setInterval(()=> {
      const mainStream = document.querySelector('.l-fluid-fixed > .l-main .lazyLoadingList ul, .l-fixed-fluid > .l-main .lazyLoadingList > ul, .l-hero-fluid-fixed .l-main .lazyLoadingList, .l-collection .l-main .lazyLoadingList');
      if (mainStream) {
         const stream = document.querySelectorAll('.lazyLoadingList > ul, .lazyLoadingList > div > ul'), steamCount = stream.length;
         if (debugMode) console.log(stream);

         clearInterval(initStreamManipulator);
         getLocalStorage(get => {
            renderMoreAction();
            markPlaylists();
            runFilters();
            if (get.removePreviews == "on") hidePreviews();
            if (get.removePlaylists == "on") hidePlaylists();
            if (get.removeReposts == "on") hideReposts();
            if (get.removeLongTracks == "on") checkCanvas();
            if (get.removeUserActivity == "on") checkUserActivity();

            for (let i = 0; i < steamCount; i++) {
               runObserver(stream[i], renderMoreAction);
               runObserver(stream[i], markPlaylists);
               runObserver(stream[i], runFilters);
               if (get.removePreviews == "on") runObserver(stream[i], hidePreviews);
               if (get.removePlaylists == "on") runObserver(stream[i], hidePlaylists);
               if (get.removeReposts == "on") runObserver(stream[i], hideReposts);
               if (get.removeLongTracks == "on") runObserver(stream[i], checkCanvas);
               if (get.removeUserActivity == "on") runObserver(stream[i], checkUserActivity);
            }
         });

         // Next song manager
         runObserver(soundBadge, ()=> {
            getLocalStorage(get => {
               const getStreamItems = document.querySelectorAll('.soundList__item'), getStreamItemCount = getStreamItems.length;
               for (let i = 0; i < getStreamItemCount; i++) {
                  let getSkipStatus = getStreamItems[i].getAttribute("data-skip"),
                  getPlaylistType = getStreamItems[i].getAttribute("data-playlist"),
                  getTitle = getStreamItems[i].querySelector('.soundTitle__title span'),
                  getPlaying = getStreamItems[i].querySelector('.activity div.sound.streamContext').className;

                  if (getPlaying.includes("playing") == true) {
                     if (debugMode) console.log("Skip song?: " + getSkipStatus);
                     if (getSkipStatus == "true") {
                        previousControl.addEventListener("click", ()=> {
                           skipPrevious = true;
                        });
                        if (getPlaylistType == true) {
                           let skipCount = getStreamItems[i].getAttribute("data-count");
                           if (skipPrevious == true) for (let t = 0; t < skipCount; t++) previousControl.click();
                           else for (let t = 0; t < skipCount; t++) nextControl.click();
                        } else {
                           if (skipPrevious == true) previousControl.click();
                           else nextControl.click();
                        }
                     } else skipPrevious = false;
                  }
               }
            });
         });
      }
   }, 100);
};
