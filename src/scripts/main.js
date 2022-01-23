/* jshint esversion: 8 */
/* jshint browser: true */
/* jshint node: true */
/* jshint -W117 */
/* global chrome */

"use strict";

// =============================================================
// Global variables
// =============================================================
const _setGlobalSettings = {},
      _getGlobalSettings = ["debug", "darkMode", "listenerMode", "settingsMenus", "fullwidthMode", "moreActionMenu", "removeSettingsBtn", "disableDiscoverToggle", "hideSidebar", "hideBranding", "displayType", "removePreviews", "removePlaylists", "removeLongTracks", "removeUserActivity", "removeReposts", "tagsArray", "filter", "hiddenOutline", "profileImages", "disableUnfollower", "discoverModules"],
      _isRunningOpera = /Opera|OPR\//.test(navigator.userAgent),
      _manifestData = {version: '4.0.0'},
      _globalConfig = {childList: true},
      _altConfig = {attributes: true, childList: true, subtree: true},
      _body = document.querySelector('body'),
      _app = document.querySelector('#app'),
      _profileURLRegex = /https?:\/\/soundcloud\.com\/((?!stream|charts|discover|you|stations|messages|notifications|pages|pro|settings|people|search|tags|popular|imprint|terms-of-use)[a-zA-Z0-9_-]+)\/?(sets|albums|reposts|tracks|)\/?(?!.+)/,
      _streamURLRegex = /https?:\/\/soundcloud\.com\/stream/,
      _discoverURLRegex = /https?:\/\/soundcloud\.com\/discover/,
      _defaultFilter = {"artists": [], "tracks": []},
      _defaultMenus = {"hideFooterMenu": "off", "hideHeaderMenu": "off"},
      _authorQuery = ".soundTitle__username, .chartTrack__username a, .playableTile__usernameHeading, .trackItem__username",
      _trackQuery = ".soundTitle__title, .chartTrack__title a, .playableTile__artworkLink, .trackItem__trackTitle",
      _tagQuery = ".soundTitle__tagContent";

let skipPrevious = false, oldLocation = location.href, debugMode = null;



// Get developer status
getLocalStorage(get => {
   if (get.debug === "on") {
      debugMode = true;
      console.log("-=- YellowCloud developer -=-");
   }
}, ["debug"]);

// =============================================================
// Functional JS building blocks
// =============================================================

const matched = x => ({
   on: () => matched(x),
   otherwise: () => x,
});

const match = x => ({
   on: (pred, fn) => (pred(x) ? matched(fn(x)) : match(x)),
   otherwise: fn => fn(x),
});

// Insert Element node after a reference node
const insertAfter = (newNode, referenceNode)=> {
   referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
};

// =============================================================
// Helper functions
// =============================================================

const _userID = getCookie('i'), _userName = getCookie('p');

// Converts a timestamp to a relative time output
const relativeTime = timestamp => {
   let output = null;
   const _minutes = 60,
         _hours = _minutes * 60,
         _days = _hours * 24,
         _months = _days * 30,
         _years = _days * 365,
         _today = Math.floor(Date.now() / 1000),
         _elapsed = _today - timestamp;

   if (_elapsed < _minutes) output = `${_elapsed} sec ago`;
   else if (_elapsed < _hours) output = `${Math.round(_elapsed / _minutes)} mins ago`;
   else if (_elapsed < _days) output = `${Math.round(_elapsed / _hours)} hrs ago`;
   else if (_elapsed < _months) output = `${Math.round(_elapsed / _days)} days ago`;
   else if (_elapsed < _years) output = `${Math.round(_elapsed / _months)} months ago`;
   else output = `${Math.round(_elapsed / _years)} yrs ago`;

   return output;
};

// Run an instance of a mutation observer
const runObserver = (target, callback, sensitive)=> {
   const _sensitiveObserver = sensitive || false,
         _useConfig = (_sensitiveObserver) ? _altConfig : _globalConfig;

   window.observer = new MutationObserver(mutations => {
      if (_sensitiveObserver) callback();
      else {
         const _mutationLength = mutations.length;
         let hasUpdated = false, mutation = null;

         for (let i = 0; i < _mutationLength; i++) {
            mutation = mutations[i];
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
               hasUpdated = true;
               break;
            }
         }
         if (hasUpdated) callback();
      }
   });
   observer.observe(target, _useConfig);
};

// Fetch local extension files
const fetchFile = (el, file, callback)=> {
   const _xhr = new XMLHttpRequest();
   _xhr.open("GET", chrome.extension.getURL(file), true);
   _xhr.onload = ()=> {
      if (_xhr.status === 200) {
         if (debugMode) console.log("function fetchFile: File fetched");
         el.innerHTML = _xhr.responseText;
         if (callback) return callback();
      }
   };
   _xhr.send();
};

// Modal closing animation for the YC menu
const disassembleSettings = ()=> {
   const _modal = document.querySelector('#yellowcloud');
   _modal.classList.add("invisible");
   _modal.style.overflow = "hidden";
   _app.classList.remove("g-filter-grayscale");
   setTimeout(()=> {
      _modal.classList.remove("showBackground");
      setTimeout(()=> {
         _modal.remove();
         _body.classList.remove("g-overflow-hidden");
      }, 100);
   }, 300);
};

// Generate mass unfollower checkboxes
const multiFollow = ()=> {
   const _followingUsers = document.querySelectorAll('.userBadgeListItem');
   _followingUsers.forEach(user => {
      const _checkbox = user.querySelector(".userBadgeListItem__checkbox");
      if (!_checkbox) {
         const _checkboxDiv = document.createElement("label"),
               _checkboxElement = document.createElement("input"),
               _checkboxWrap = document.createElement("div");

         _checkboxDiv.className = "userBadgeListItem__checkbox";
         _checkboxElement.type = "checkbox";
         _checkboxElement.className = "sc-checkbox-input sc-visuallyhidden";
         _checkboxWrap.className = "sc-checkbox-check";

         _checkboxDiv.appendChild(_checkboxElement);
         _checkboxDiv.appendChild(_checkboxWrap);
         user.appendChild(_checkboxDiv);
      }
   });
};

// Return URL contents after "https://soundcloud.com/"
const stripLinkDomain = url => {
   const _slug = url.replace('https://soundcloud.com/', '');
   return _slug;
};

// Selects and unselects all mass unfollower checkboxes
const massSelector = bool => {
   const massSelectorLoop = ()=> {
      const _followingSelection = document.querySelectorAll('.badgeList__item');
      _followingSelection.forEach(selected => {
         const _checkFollowStatus = selected.querySelector('label.userBadgeListItem__checkbox input.sc-checkbox-input');
         _checkFollowStatus.checked = bool;
      });
   };
   if (bool === true) {
      let scrollInterval = setInterval(()=> {
         const _detectLoadingBlock = document.querySelector('.badgeList.lazyLoadingList .loading');
         if (_detectLoadingBlock)
            window.scrollTo(0, document.body.scrollHeight || document.documentElement.scrollHeight);
         else {
            clearInterval(scrollInterval);
            window.scrollTo(0, 0);
            massSelectorLoop();
         }
      }, 50);
   } else massSelectorLoop();
};

// Checks if URL is a playlist URL
// TODO: find en bedre måde at arbejde med URL
const isPlaylistURL = url => {
   const _strips = url.split("/");
   let output = false;

   _strips.forEach(strip => {
      if (strip === "sets") output = true;
   });
   return output;
};

// ...
const moreActionParentClassName = element => {
   const _moreActionButtonParent = element.closest('.lazyLoadingList'),
         _parentList = _moreActionButtonParent.querySelector('div > ul > li, ul > li').className,
         _parentListClassName = '.' + _parentList.split(/\s+/)[0];
   return _parentListClassName;
};

// Insert content into more action menus
const moreActionMenuContent = trackContainer => {
   getLocalStorage(get => {
      const _moreActionMenu = document.querySelector('.moreActions div'),
            _hasPlaylists = trackContainer.querySelector('.playlistTrackCount') || trackContainer.querySelector('.compactTrackList__moreLink'),
            _hasTag = trackContainer.querySelector(_tagQuery),
            _hasArtist = trackContainer.querySelector(_authorQuery),
            _hasTrack = trackContainer.querySelector(_trackQuery),
            _moreActionsGroup = document.querySelector('#yellowcloud-moreActions-group'),
            _createMoreActionsGroup = document.createElement("div");

      _createMoreActionsGroup.className = "moreActions__group";
      _createMoreActionsGroup.id = "yellowcloud-moreActions-group";

      const renderMoreActionButton = (key, element = null)=> {
         const _buttonID = `yellowcloud-${key}-button`,
               _hasButton = document.querySelector(_buttonID);
         if (!_hasButton) {
            const _createButton = document.createElement("button");
                  _createButton.type = "button";
                  _createButton.id = _buttonID;
                  _createButton.className = "moreActions__button sc-button-medium yellowcloud-button-icon yellowcloud-button-"+ key +"";

            if (key === "related") {
               _createButton.title = "Go to related tracks";
               _createButton.innerText = "Related tracks";
            } else if (key === "track") {
               if (isPlaylistURL(element.href)) {
                  _createButton.title = "Click to blacklist this playlist";
                  _createButton.innerText = "Blacklist playlist";
               } else {
                  _createButton.title = "Click to blacklist this track";
                  _createButton.innerText = "Blacklist track";
               }
            } else {
               _createButton.title = `Click to blacklist this track's ${key}`;
               _createButton.innerText = `Blacklist ${key}`;
            }

            if (key !== "related") {
               let value;
               if (key === "artist" || key === "track") value = element.href;
               else value = element.innerText;
               _createButton.setAttribute('data-item', value);
            }

            if (key === "artist") {
               if (stripLinkDomain(_hasArtist.href) !== _userName) _createMoreActionsGroup.appendChild(_createButton);
            } else if (key === "related") {
               const _url = `/${stripLinkDomain(_hasTrack.href)}/recommended`,
                     _createAnchor = document.createElement("a");
               _createAnchor.href = _url;
               _createAnchor.appendChild(_createButton);
               _createMoreActionsGroup.appendChild(_createAnchor);
            } else _createMoreActionsGroup.appendChild(_createButton);
         }
      };

      let disableRelatedMenu = false, disableTagMenu = false, disableArtistMenu = false, disableTrackMenu = false;
      if (get.moreActionMenu) {
         if (get.moreActionMenu.relatedActionMenu === "on") disableRelatedMenu = true;
         if (get.moreActionMenu.tagActionMenu === "on") disableTagMenu = true;
         if (get.moreActionMenu.artistActionMenu === "on") disableArtistMenu = true;
         if (get.moreActionMenu.trackActionMenu === "on") disableTrackMenu = true;
      }

      if (!disableRelatedMenu && !_hasPlaylists) renderMoreActionButton("related");
      if (!disableTagMenu && _hasTag) renderMoreActionButton("hashtag", _hasTag);
      if (!disableArtistMenu && _hasArtist) renderMoreActionButton("artist", _hasArtist);
      if (!disableTrackMenu && _hasTrack) renderMoreActionButton("track", _hasTrack);

      if (!_moreActionsGroup) if (_createMoreActionsGroup.hasChildNodes()) _moreActionMenu.appendChild(_createMoreActionsGroup);

      const _relatedButton = document.querySelector("#yellowcloud-related-button"),
            _hashtagButton = document.querySelector("#yellowcloud-hashtag-button"),
            _artistButton = document.querySelector("#yellowcloud-artist-button"),
            _trackButton = document.querySelector("#yellowcloud-track-button");

      if (!disableTagMenu && _hashtagButton) addTagToFilter(_hashtagButton);
      if (!disableArtistMenu && _artistButton) addItemToFilter(_artistButton, "artists");
      if (!disableTrackMenu && _trackButton) addItemToFilter(_trackButton, "tracks");
   });
};

// Activates filter adder button
const addItemToFilter = (button, key)=> {
   const addItemToFilterCallback = ()=> {
      getLocalStorage(get => {
         let blacklistedElements;
         const _blacklistItem = button.getAttribute('data-item'),
               _blacklistData = stripLinkDomain(_blacklistItem),
               _filterStructure = get.filter || _defaultFilter,
               _timestamp = Math.floor(Date.now() / 1000),
               _filterItem = {"slug": _blacklistData, "time": _timestamp};

         if (key === "artists") {
            _filterStructure.artists.push(_filterItem);
            blacklistedElements = document.querySelectorAll('.soundTitle__username, .chartTrack__username a, .playableTile__usernameHeading, .trackItem__username');
         } else if (key === "tracks") {
            _filterStructure.tracks.push(_filterItem);
            blacklistedElements = document.querySelectorAll('.soundTitle__title, .chartTrack__title a, .playableTile__artworkLink, .trackItem__trackTitle');
         }

         setLocalStorage(()=> {
            document.querySelector('.sc-button-more.sc-button.sc-button-active').click();
            blacklistedElements.forEach(element => {
               if (element.href === _blacklistItem) {
                  const _parentClassName = moreActionParentClassName(element);
                  element.closest(_parentClassName).remove();
               }
            });
         }, {filter : _filterStructure});
      });
   };
   button.removeEventListener("click", addItemToFilterCallback);
   button.addEventListener("click", addItemToFilterCallback);
};

// Adds a tag to the existing tag filter or creates it if it doesn't exist
const addTagToFilter = button => {
   const addTagToFilterCallback = ()=> {
      getLocalStorage(get => {
         const _bannedTag = button.getAttribute("data-item"),
               _tagArray = get.tagsArray || [];

         _tagArray.push(_bannedTag);
         setLocalStorage(()=> {
            const _tracksWithTags = document.querySelectorAll('.soundTitle__tagContent');
            document.querySelector('.sc-button-more.sc-button.sc-button-active').click();

            _tracksWithTags.forEach(track => {
               if (track.innerText.toUpperCase() === _bannedTag.toUpperCase()) {
                  const _parentClassName = moreActionParentClassName(track);
                  track.closest(_parentClassName).remove();
               }
            });
         }, {tagsArray: _tagArray});
      }, ["tagsArray"]);
   };
   button.removeEventListener("click", addTagToFilterCallback);
   button.addEventListener("click", addTagToFilterCallback);
};

// Sorts an array and eliminates any duplicates
// TODO: Ersat nogle af let variablerne med const
const eliminateDuplicates = array => {
   let i, out = [];
   const _arrayLength = array.length, _obj = {};

   for (i = 0; i < _arrayLength; i++) _obj[array[i]] = 0;
   //array.forEach(entry => _obj[entry] = 0);
   for (i in _obj) out.push(i);
   return out;
};

// Enabling a .json export and import of YellowCloud settings
const exportimportInit = get => {
   const _importElement = document.querySelector('#yellowcloud-import input[type="file"]'),
         _exportElement = document.querySelector('#yellowcloud-export a');

   _exportElement.addEventListener("click", ()=> {
      getLocalStorage(get => {
         const _exportBlob = new Blob([JSON.stringify(get, null, "\t")], {type: 'application/json'}),
               _exportTemp = document.createElement("a"),
               _exportName = "YellowCloud.json",
               _exportLink = window.URL.createObjectURL(_exportBlob);

         document.body.appendChild(_exportTemp);
         _exportTemp.style = "display: none";
         _exportTemp.href = _exportLink;
         _exportTemp.download = _exportName;
         _exportTemp.click();
         window.URL.revokeObjectURL(_exportLink);
      });
   });

   const importRead = e => {
      const _files = e.target.files,
            _reader = new FileReader();

      _reader.onload = importPrase;
      _reader.readAsText(_files[0]);
   };

   const importPrase = e => {
      const _prasedImport = JSON.parse(e.target.result),
            _prasedObject = Object.keys(_prasedImport),
            _prasedObjectLength = _prasedObject.length,
            _importedSettings = {};

      for (let option = 0; option < _prasedObjectLength; option++) {
         switch (_prasedObject[option]) {
            case "discoverModules":
               const _keyLength = Object.keys(_prasedImport.discoverModules).length,
                     _tempDiscoverArray = {};
               for (let key in _prasedImport.discoverModules) {
                  if (!isNaN(key)) {
                     if (_prasedImport.discoverModules[key] == "1") _tempDiscoverArray[key] = "1";
                     else _tempDiscoverArray[key] = "0";
                  }
               }
               _importedSettings.discoverModules = _tempDiscoverArray;
               break;
            case "displayType":
               if (_prasedImport.displayType === "list" || _prasedImport.displayType === "grid") _importedSettings.displayType = _prasedImport.displayType;
               else _importedSettings.displayType = "default";
               break;
            case "filter":
               const _filters = [_prasedImport.filter.artists, _prasedImport.filter.tracks],
                     _filterCount = _filters.length,
                     _tempFilterObjectContainer = {};
               for (let f = 0; f < _filterCount; f++) {
                  const _tempFilterArray = [];
                  for (let key in _filters[f]) {
                     const _tempFilterObject = _filters[f][key],
                           _slug = _tempFilterObject.slug,
                           _timestamp = _tempFilterObject.time;
                     if (_slug) {
                        if (!_timestamp) _tempFilterObject.time = Math.floor(Date.now() / 1000);
                        const _tempFilterArrayLength = _tempFilterArray.length;
                        let tempFilterMatch = 0;
                        for (let i = 0; i < _tempFilterArrayLength; i++)
                           if (_tempFilterArray[i].slug === _slug) tempFilterMatch = 1;
                        if (tempFilterMatch == 0) _tempFilterArray.push(_tempFilterObject);
                     }
                  }
                  if (f == 0) _tempFilterObjectContainer.artists = _tempFilterArray;
                  else _tempFilterObjectContainer.tracks = _tempFilterArray;
               }
               _importedSettings.filter = _tempFilterObjectContainer;
               break;
            case "tagsArray":
               const _tagsArrayLength = _prasedImport.tagsArray.length,
                     _tempTagArray = [];
               for (let tag = 0; tag < _tagsArrayLength; tag++) _tempTagArray.push(_prasedImport.tagsArray[tag].toLowerCase());
               _importedSettings.tagsArray = eliminateDuplicates(_tempTagArray);
               break;
            case "moreActionMenu":
               const _tempMoreActionObject = {};
               for (let key in _prasedImport.moreActionMenu) {
                  if (_prasedImport.moreActionMenu[key] == "on") _tempMoreActionObject[key] = _prasedImport.moreActionMenu[key];
                  else _tempMoreActionObject[key] = "off";
               }
               _importedSettings.moreActionMenu = _tempMoreActionObject;
               break;
            default:
               let setting = _prasedImport[_prasedObject[option]];
               if (setting != "on") setting = "off";
               _importedSettings[_prasedObject[option]] = setting;
         }
      }
      setLocalStorage(()=> location.reload(), _importedSettings);
   };
   _importElement.addEventListener("change", importRead, false);
};

const manageFooterEnhancerButton = (destruct = false)=> {
   const _hasEnhancerButton = document.querySelector('#yellowcloud-button'),
         _soundPanelInner = document.querySelector('.playControls__inner');

   if (destruct === true) {
      if (_hasEnhancerButton) {
         _hasEnhancerButton.remove();
         _body.removeAttribute("settings-button");
         settingsMenu();
      }
   } else {
      if (!_hasEnhancerButton) {
         if (debugMode) console.log("-> YellowCloud button (Bottom) rendered");
         _body.setAttribute("settings-button", "");
         const _yellowCloudContainer = document.createElement("div"),
               _yellowCloudButton = document.createElement("button");

         _yellowCloudContainer.id = "yellowcloud-container";
         _yellowCloudButton.className = "yellowcloud-settings-button sc-button sc-button-medium sc-button-responsive";
         _yellowCloudButton.id = "yellowcloud-button";
         _yellowCloudButton.tabindex = "0";
         _yellowCloudButton.innerText = "YellowCloud";

         _yellowCloudContainer.appendChild(_yellowCloudButton);
         _soundPanelInner.appendChild(_yellowCloudContainer);
         settingsMenu();
      }
   }
};

// Render a YellowCloud button in the user navigation menu
const manageHeaderEnhancerButton = (destruct = false)=> {
   const _hasEnhancerMenuItems = document.querySelector('.profileMenu__list.profileMenu__enhancer.sc-list-nostyle'),
         _userMenu = document.querySelector('.header__userNavUsernameButton');

   if (destruct === true) {
      _userMenu.removeEventListener("click", manageHeaderEnhancerButton);
      if (_hasEnhancerMenuItems) _hasEnhancerMenuItems.remove();
      settingsMenu();
   } else {
      if (!_hasEnhancerMenuItems) {
         _userMenu.removeEventListener("click", manageHeaderEnhancerButton);

         const _isMenuActive = document.querySelector('.dropdownMenu.g-z-index-header-menu');
         if (_isMenuActive) {
            if (debugMode) console.log("-> YellowCloud button (Top) rendered");
            const _profileMenu = document.querySelector('.profileMenu'),
                  _profileMenuEnhancer = document.createElement('ul'),
                  _profileMenuEnhancerItem = document.createElement('li'),
                  _profileMenuEnhancerLink = document.createElement('a');

            _profileMenuEnhancer.className = "profileMenu__list profileMenu__enhancer yellowcloud-settings-button sc-list-nostyle";
            _profileMenuEnhancerItem.className = "profileMenu__item";
            _profileMenuEnhancerLink.className = "profileMenu__link profileMenu__enhancerMenu";
            _profileMenuEnhancerLink.innerText = "YellowCloud";

            _profileMenuEnhancerItem.appendChild(_profileMenuEnhancerLink);
            _profileMenuEnhancer.appendChild(_profileMenuEnhancerItem);
            _profileMenu.appendChild(_profileMenuEnhancer);
         }

         settingsMenu();
         const detectProfileMenuFade = setInterval(()=> {
            const _hasEnhancerMenuItems = document.querySelector('.profileMenu__list.profileMenu__enhancer.sc-list-nostyle');
            if (!_hasEnhancerMenuItems) {
               settingsMenu();
               clearInterval(detectProfileMenuFade);
               _userMenu.addEventListener("click", manageHeaderEnhancerButton);
            }
         }, 100);
      }
   }
};

// Initializing the settings in the YellowCloud menu
const settingsInit = ()=> {
   if (debugMode) console.log("callback settingsInit: Initializing");

   const _darkModeInput = document.querySelector('#darkMode'),
         _listenerModeInput = document.querySelector('#listenerMode'),
         _fullwidthModeInput = document.querySelector('#fullwidthMode'),
         _profileImagesInput = document.querySelector('#profileImages'),
         _hideSidebarInput = document.querySelector('#hideSidebar'),
         _hideBrandingInput = document.querySelector('#hideBranding'),
         _hideHeaderMenuInput = document.querySelector('#hideHeaderMenu'),
         _hideFooterMenuInput = document.querySelector('#hideFooterMenu'),
         _displayTypeInput = document.querySelectorAll('input[name="displayType"]'),
         _removePreviewsInput = document.querySelector('#removePreviews'),
         _removePlaylistsInput = document.querySelector('#removePlaylists'),
         _removeLongTracksInput = document.querySelector('#removeLongTracks'),
         _removeUserActivityInput = document.querySelector('#removeUserActivity'),
         _removeRepostsInput = document.querySelector('#removeReposts'),
         _relatedActionMenuInput = document.querySelector('#relatedActionMenu'),
         _tagActionMenuInput = document.querySelector('#tagActionMenu'),
         _artistActionMenuInput = document.querySelector('#artistActionMenu'),
         _trackActionMenuInput = document.querySelector('#trackActionMenu'),
         _hiddenOutlineInput = document.querySelector('#hiddenOutline'),
         _disableUnfollowerInput = document.querySelector('#disableUnfollower'),
         _disableDiscoverToggleInput = document.querySelector('#disableDiscoverToggle'),
         _settingsReset = document.querySelector('#yellowcloud-reset'),
         _settingsClose = document.querySelectorAll('.yellowcloud-close-settings'),
         _settingsArray = [
            _darkModeInput,
            _listenerModeInput,
            _fullwidthModeInput,
            _profileImagesInput,
            _hideSidebarInput,
            _hideBrandingInput,
            _hideHeaderMenuInput,
            _hideFooterMenuInput,
            _displayTypeInput[0],
            _displayTypeInput[1],
            _displayTypeInput[2],
            _removePreviewsInput,
            _removePlaylistsInput,
            _removeLongTracksInput,
            _removeUserActivityInput,
            _removeRepostsInput,
            _relatedActionMenuInput,
            _tagActionMenuInput,
            _artistActionMenuInput,
            _trackActionMenuInput,
            _hiddenOutlineInput,
            _disableUnfollowerInput,
            _disableDiscoverToggleInput
         ];

   // Activates all menu-closing buttons
   _settingsClose.forEach(button => button.addEventListener("click", ()=> disassembleSettings()));

   // Activates the ability to close the menu by clicking outside of it
   document.addEventListener('mousedown', e => {
      const _evt = (e === null ? event : e);
      if (_evt.which === 1 || _evt.button === 0 || _evt.button === 1)
         if (e.target.id === "yellowcloud") disassembleSettings();
   });

   // Activates the reset button
   _settingsReset.addEventListener("click", ()=> {
      const _warningState = _settingsReset.getAttribute("warning");
      if (_warningState === "true") resetLocalStorage(()=> location.reload());
      else {
         _settingsReset.setAttribute("warning", true);
         _settingsReset.innerText = "Are you sure you want to reset?";
         setTimeout(()=> {
            _settingsReset.setAttribute("warning", false);
            _settingsReset.innerText = "Reset all YellowCloud settings";
         }, 5000);
      }
   });

   // Display settings
   getLocalStorage(get => {
      // Design & layout
      if (get.darkMode === "on") _darkModeInput.checked = true;
      if (get.listenerMode === "on") _listenerModeInput.checked = true;
      if (get.fullwidthMode === "on") _fullwidthModeInput.checked = true;
      if (get.profileImages === "on") _profileImagesInput.checked = true;
      if (get.hideSidebar === "on") _hideSidebarInput.checked = true;
      if (get.hideBranding === "on") _hideBrandingInput.checked = true;
      if (get.settingsMenus) {
         if (get.settingsMenus.hideHeaderMenu === "on") _hideHeaderMenuInput.checked = true;
         if (get.settingsMenus.hideFooterMenu === "on") _hideFooterMenuInput.checked = true;
      } else setLocalStorage(()=> {
         if (debugMode) console.log("-> Setting updated: settingsMenus (Default)");
      }, {settingsMenus: _defaultMenus});
      if (get.displayType === "list") _displayTypeInput[1].checked = true;
      else if (get.displayType === "grid") _displayTypeInput[2].checked = true;
      else _displayTypeInput[0].checked = true;

      // Filtering
      if (get.removePreviews === "on") _removePreviewsInput.checked = true;
      if (get.removePlaylists === "on") _removePlaylistsInput.checked = true;
      if (get.removeLongTracks === "on") _removeLongTracksInput.checked = true;
      if (get.removeUserActivity === "on") _removeUserActivityInput.checked = true;
      if (get.removeReposts === "on") _removeRepostsInput.checked = true;

      // More action menu
      if (get.moreActionMenu) {
         if (get.moreActionMenu.relatedActionMenu === "on") _relatedActionMenuInput.checked = true;
         if (get.moreActionMenu.tagActionMenu === "on") _tagActionMenuInput.checked = true;
         if (get.moreActionMenu.artistActionMenu === "on") _artistActionMenuInput.checked = true;
         if (get.moreActionMenu.trackActionMenu === "on") _trackActionMenuInput.checked = true;
      }

      // Miscellaneous
      if (get.hiddenOutline === "on") _hiddenOutlineInput.checked = true;
      if (get.disableUnfollower === "on") _disableUnfollowerInput.checked = true;
      if (get.disableDiscoverToggle === "on") _disableDiscoverToggleInput.checked = true;
   });

   const updateStream = (state, type) => {
      if (state !== "on") {
         const _streamItems = document.querySelectorAll('.lazyLoadingList > ul, .lazyLoadingList > div > ul');
         _streamItems.forEach(list => {
            const _listItem = list.childNodes;
            _listItem.forEach(el => {
               const _itemType = el.getAttribute("data-type");
               if (_itemType) if (_itemType === type) {
                  el.classList.remove("hidden");
                  el.removeAttribute("data-type");
                  el.removeAttribute("data-skip");
               }
            });
         });
      }
      frontEndStreamManipulation(true);
   };

   const updateSetting = (element, key, callback = null, param = null)=> {
      getLocalStorage(get => {
         const _newSetting = {}, _keySplit = key.split(".");
         let newState = "on", oldState = get[key], type = null;

         if (key.match(/[.]/)) oldState = get[_keySplit[0]][_keySplit[1]];
         if (oldState === "on") newState = "off";
         if (key.match(/[.]/)) {
            _newSetting[_keySplit[0]] = get[_keySplit[0]];
            if (_keySplit[0] === "settingsMenus") {
               if (_keySplit[1] === "hideHeaderMenu") _newSetting[_keySplit[0]].hideHeaderMenu = newState;
               else if (_keySplit[1] === "hideFooterMenu") _newSetting[_keySplit[0]].hideFooterMenu = newState;
            } else if (_keySplit[0] === "moreActionMenu") {
               if (_keySplit[1] === "relatedActionMenu") _newSetting[_keySplit[0]].relatedActionMenu = newState;
               else if (_keySplit[1] === "tagActionMenu") _newSetting[_keySplit[0]].tagActionMenu = newState;
               else if (_keySplit[1] === "artistActionMenu") _newSetting[_keySplit[0]].artistActionMenu = newState;
               else if (_keySplit[1] === "trackActionMenu") _newSetting[_keySplit[0]].trackActionMenu = newState;
            }
         } else if (key === "displayType") _newSetting[key] = element.value;
         else _newSetting[key] = newState;

         setLocalStorage(()=> {
            if (debugMode) console.log(_newSetting);
            if (key === "displayType") _body.setAttribute("displaytype", element.value);
            else if (_keySplit[1] === "hideHeaderMenu" || _keySplit[1] === "hideFooterMenu") {
               if (newState === "on") callback(true);
               else callback();
            } else if (param) callback(newState, param);
            else {
               const _attributeName = key.toLowerCase();
               if (newState === "on") _body.setAttribute(_attributeName, "");
               else _body.removeAttribute(_attributeName);
            }
         }, _newSetting);
      });
   };

   _settingsArray.forEach(setting => {
      setting.addEventListener("change", ()=> {
         match(setting)
         .on(x => x === _darkModeInput, x => updateSetting(x, "darkMode"))
         .on(x => x === _listenerModeInput, x => updateSetting(x, "listenerMode"))
         .on(x => x === _fullwidthModeInput, x => updateSetting(x, "fullwidthMode"))
         .on(x => x === _profileImagesInput, x => updateSetting(x, "profileImages"))
         .on(x => x === _hideSidebarInput, x => updateSetting(x, "hideSidebar"))
         .on(x => x === _hideBrandingInput, x => updateSetting(x, "hideBranding"))
         .on(x => x === _hideHeaderMenuInput, x => updateSetting(x, "settingsMenus.hideHeaderMenu", manageHeaderEnhancerButton))
         .on(x => x === _hideFooterMenuInput, x => updateSetting(x, "settingsMenus.hideFooterMenu", manageFooterEnhancerButton))
         .on(x => x === _displayTypeInput[0], x => updateSetting(x, "displayType"))
         .on(x => x === _displayTypeInput[1], x => updateSetting(x, "displayType"))
         .on(x => x === _displayTypeInput[2], x => updateSetting(x, "displayType"))
         .on(x => x === _removePreviewsInput, x => updateSetting(x, "removePreviews", updateStream, "preview"))
         .on(x => x === _removePlaylistsInput, x => updateSetting(x, "removePlaylists", updateStream, "preview"))
         .on(x => x === _removeLongTracksInput, x => updateSetting(x, "removeLongTracks", updateStream, "long"))
         .on(x => x === _removeUserActivityInput, x => updateSetting(x, "removeUserActivity", updateStream, "yours"))
         .on(x => x === _removeRepostsInput, x => updateSetting(x, "removeReposts", updateStream, "repost"))
         .on(x => x === _relatedActionMenuInput, x => updateSetting(x, "moreActionMenu.relatedActionMenu"))
         .on(x => x === _tagActionMenuInput, x => updateSetting(x, "moreActionMenu.tagActionMenu"))
         .on(x => x === _artistActionMenuInput, x => updateSetting(x, "moreActionMenu.artistActionMenu"))
         .on(x => x === _trackActionMenuInput, x => updateSetting(x, "moreActionMenu.trackActionMenu"))
         .on(x => x === _hiddenOutlineInput, x => updateSetting(x, "hiddenOutline"))
         .on(x => x === _disableUnfollowerInput, x => updateSetting(x, "disableUnfollower"))
         .on(x => x === _disableDiscoverToggleInput, x => updateSetting(x, "disableDiscoverToggle"));
      });
   });
};

// Initializing the filter lists in the YellowCloud settings menu
const filterInit = ()=> {
   if (debugMode) console.log("callback filterInit: Initializing");
   const _artistBlacklist = document.querySelector('#artist-blacklist'),
         _trackBlacklist = document.querySelector('#track-blacklist'),
         _playlistBlacklist = document.querySelector('#playlist-blacklist'),
         _skipTagsInput = document.querySelector('#skipTags');

   getLocalStorage(get => {
      if (get.tagsArray != null) _skipTagsInput.value = get.tagsArray;
      insignia(_skipTagsInput, {delimiter: ',', deletion: true});

      const _target = document.querySelector('.nsg-tags');
      runObserver(_target, ()=> {
         const _tagList = document.querySelectorAll('.nsg-tag'), _tags = [];
         _tagList.forEach(tag => _tags.push(tag.innerText));

         setLocalStorage(null, {tagsArray: _tags});
      }, true);
   });

   const filterNameFormatter = string => {
      const _strip = string.split("/");
      let output = _strip[0];
      if (_strip[1] === "sets") output = _strip[2];
      else if (_strip[1]) output = _strip[1];
      output = output.replace(/-/g, " ");
      output = output.replace(/_/g, " ");
      return output;
   };

   const renderFilterList = (element, key)=> {
      getLocalStorage(get => {
         let filterArray = [], filterArrayLength = 0;

         const trackArraySort = bool => {
            const _tempFilterArray = [];
            for (let i = 0; i < filterArrayLength; i++) {
               if (bool === true) if (isPlaylistURL(filterArray[i].slug)) _tempFilterArray.push(filterArray[i]);
               if (bool === false) if (!isPlaylistURL(filterArray[i].slug)) _tempFilterArray.push(filterArray[i]);
            }
            filterArray = _tempFilterArray;
         };

         const removeObjectByAttribute = (array, attribute, value)=> {
            let i = array.length;
            while (i--) if (array[i] && array[i].hasOwnProperty(attribute) && array[i][attribute] === value) array.splice(i, 1);
            return array;
         };

         if (get.filter) {
            filterArray = get.filter.tracks;
            filterArrayLength = filterArray.length;
            if (key == "artists" && get.filter.artists) {
               filterArray = get.filter.artists;
               filterArrayLength = filterArray.length;
            } else if (key == "tracks" && get.filter.tracks) trackArraySort(false);
            else trackArraySort(true);
         }

         if (filterArrayLength === 0) {
            const _emptyMessage = document.createElement("span");
            _emptyMessage.innerHTML = "No " + key + " has been filtered!";
            element.appendChild(_emptyMessage);
         } else {
            for (let i = 0; i < filterArrayLength; i++) {
               const _listItem = document.createElement("li"),
                     _listItemOrder = document.createElement("span"),
                     _listItemLink = document.createElement("a"),
                     _listItemActions = document.createElement("div"),
                     _listItemTime = document.createElement("span"),
                     _listItemDelete = document.createElement("span"),
                     _listItemCount = i + 1;

               _listItemOrder.className = "yellowcloud-filter-item-order";
               _listItemOrder.innerText = "#" + _listItemCount;
               _listItemActions.className = "yellowcloud-filter-actions";
               _listItemLink.className = "yellowcloud-filter-item-name";
               _listItemLink.href = "https://soundcloud.com/" + filterArray[i].slug;
               _listItemLink.innerText = filterNameFormatter(filterArray[i].slug);
               _listItemLink.target = "_blank";
               _listItemTime.innerText = relativeTime(filterArray[i].time);
               _listItemTime.className = "yellowcloud-filter-option";
               _listItemDelete.className = "yellowcloud-filter-option-remove";

               _listItem.appendChild(_listItemOrder);
               _listItem.appendChild(_listItemLink);
               _listItemActions.appendChild(_listItemTime);
               _listItemActions.appendChild(_listItemDelete);
               _listItem.appendChild(_listItemActions);
               element.appendChild(_listItem);

               _listItemDelete.addEventListener("click", ()=> {
                  getLocalStorage(get => {
                     const _filterObject = get.filter;
                     if (key === "artists") removeObjectByAttribute(_filterObject.artists, "slug", filterArray[i].slug);
                     else removeObjectByAttribute(_filterObject.tracks, "slug", filterArray[i].slug);

                     setLocalStorage(()=> {
                        _listItemDelete.closest("li").remove();
                        const _filterContainers = document.querySelectorAll('.filter-container'),
                              _filterContainerCount = _filterContainers.length;

                           _filterContainers.forEach(element => {
                              if (!_filterContainers[i].hasChildNodes()) {
                                 const _emptyMessage = document.createElement("span");
                                 _emptyMessage.innerHTML = "No " + key + " has been filtered!";
                                 element.appendChild(_emptyMessage);
                              }
                           });
                     }, {filter: _filterObject});
                  }, ["filter"]);
               });
            }
         }
      });
   };
   renderFilterList(_artistBlacklist, "artists");
   renderFilterList(_trackBlacklist, "tracks");
   renderFilterList(_playlistBlacklist, "playlists");
};

// Initializing the about page in the YellowCloud settings menu
const aboutInit = ()=> {
   if (_isRunningOpera) {
      const _link = document.querySelector('#webstore-link');
      _link.innerText = "Opera addons site";
      _link.href = "#";
      _link.target = "";
   }
};

// Run setup after tab/window reload
const readyStateCheck = ()=> {
   setAttributes();
   settingsSetup();
   injectedJavascript();
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
const setAttributes = () => {
   if (debugMode) console.log("function setAttributes: Initializing");

   getLocalStorage(get => {
      if (get.darkMode === "on") _body.setAttribute("darkmode", "");
      if (get.listenerMode === "on") _body.setAttribute("listenermode", "");
      if (get.fullwidthMode === "on") _body.setAttribute("fullwidthmode", "");
      if (get.profileImages === "on") _body.setAttribute("profileimages", "");
      if (get.hideSidebar === "on") _body.setAttribute("hidesidebar", "");
      if (get.hideBranding === "on") _body.setAttribute("hidebranding", "");
      if (get.displayType === "list") _body.setAttribute("displaytype", "list");
      else if (get.displayType === "grid") _body.setAttribute("displaytype", "grid");
      else _body.setAttribute("displaytype", "default");
      if (get.hiddenOutline === "on") _body.setAttribute("hiddenoutline", "");
   });
};
setAttributes();

// Setting up initial functionality
const settingsSetup = ()=> {
   if (debugMode) console.log("function settingsSetup: Initializing");

   const _hasStreamController = document.querySelector('#stream-controller'),
         _hasVersionDisplay = document.querySelector('#version-display'),
         _soundPanel = document.querySelector('.playControls'),
         _soundPanelInner = document.querySelector('.playControls__inner'),
         _announcements = document.querySelector('.announcements.g-z-index-fixed-top'),
         _userMenu = document.querySelector('.header__userNavUsernameButton'),
         _logo = document.querySelector('.header__logo.left'),
         _followingURLRegex = new RegExp(`https?://soundcloud.com/(${_userName}|you)/follow(ing|ers)`);

   // Force-open sound control panel
   _soundPanel.className = "playControls g-z-index-header m-visible";
   _announcements.className = "announcements g-z-index-fixed-top m-offset";

   // Setup YellowCloud branding
   _logo.id = "yellowcloud-logo";
   if (!_hasVersionDisplay) {
      if (debugMode) console.log("-> Branding rendered");
      const _versionDisplay = document.createElement("span");
      _versionDisplay.id = "version-display";
      _versionDisplay.innerText = _manifestData.version;
      _logo.appendChild(_versionDisplay);
   }

   getLocalStorage(get => {
      // Setup YellowCloud buttons
      if (typeof get.settingsMenus === "undefined" || get.settingsMenus.hideFooterMenu !== "on") manageFooterEnhancerButton();
      if (typeof get.settingsMenus === "undefined" || get.settingsMenus.hideHeaderMenu !== "on") _userMenu.addEventListener("click", manageHeaderEnhancerButton);

      // Render profile navigation changes
      if (location.href.match(_profileURLRegex)) {
         const profileDectector = setInterval(()=> {
            const _profileNavTabs = document.querySelector('ul.profileTabs.g-tabs');
            if (_profileNavTabs) {
               clearInterval(profileDectector);
               if (get.listenerMode === "on") {
                  const _tabs = _profileNavTabs.querySelectorAll('li');
                  _tabs[1].classList.add("hidden");
                  _tabs[2].classList.add("hidden");
               }

               // Generate "Likes" link
               const _hasProfileLikeButton = document.querySelector('#profile-tab-like');
               if (!_hasProfileLikeButton) {
                  const _getUserSlug = _profileNavTabs.querySelector('.g-tabs-link:first-child').getAttribute('href'),
                        _createLikeMenu = document.createElement("li"),
                        _createLikeLink = document.createElement("a");

                  _createLikeMenu.className = "g-tabs-item";
                  _createLikeMenu.id = "profile-tab-like";
                  _createLikeLink.className = "g-tabs-link";
                  _createLikeLink.href = `${_getUserSlug}/likes`;
                  _createLikeLink.innerText = "Likes";

                  _createLikeMenu.appendChild(_createLikeLink);
                  _profileNavTabs.appendChild(_createLikeMenu);
               }

               // Reveal reworked profile navigation
               _profileNavTabs.classList.add('loaded');
            }
         }, 10);
      }

      // Render discover module toogle buttons
      if (location.href.match(_discoverURLRegex)) {
         if (get.disableDiscoverToggle !== "on") {
            let discoverDetector = setInterval(()=> {
               const _discoverContainer = document.querySelector('div.modularHome.lazyLoadingList ul.lazyLoadingList__list');
               if (_discoverContainer) {
                  clearInterval(discoverDetector);
                  const discoverModuleHider = ()=> {
                     getLocalStorage(get => {
                        if (debugMode) console.log("function discoverModuleHider: Running");
                        const _discoverModules = _discoverContainer.querySelectorAll('.selectionModule');
                        _discoverModules.forEach((module, i) => {
                           const _moduleArray = get.discoverModules || {},
                                 _moduleSectionState = _moduleArray[i] == 1 ? "hidden" : "shown",
                                 _discoverModuleContainer = module.querySelector('h2.selectionModule__titleText'),
                                 _hasModuleSwitch = _discoverModuleContainer.querySelector('a.hide-discover-section');
                           module.setAttribute("state", _moduleSectionState);

                           if (!_hasModuleSwitch) {
                              const _moduleState = _moduleArray[i] == 1 ? 0 : 1,
                                    _moduleStateText = _moduleArray[i] == 1 ? "Show this section" : "Hide this section",
                                    _discoverModuleToogle = document.createElement("a");

                              _discoverModuleToogle.className = "hide-discover-section";
                              _discoverModuleToogle.innerText = _moduleStateText;
                              _discoverModuleToogle.setAttribute("section-id", i);
                              _discoverModuleToogle.setAttribute("section-state", _moduleState);
                              _discoverModuleContainer.appendChild(_discoverModuleToogle);

                              const _moduleSwitch = document.querySelector('.hide-discover-section[section-id="'+ i +'"]');
                              _moduleSwitch.addEventListener("click", ()=> {
                                 getLocalStorage(get => {
                                    const _sectionID = _moduleSwitch.getAttribute("section-id"),
                                          _sectionState = _moduleSwitch.getAttribute("section-state"),
                                          _moduleArray = get.discoverModules || {};
                                          _moduleArray[_sectionID] = _sectionState;

                                    setLocalStorage(()=> {
                                       const _moduleStateText = _moduleArray[_sectionID] == 1 ? "Show this section" : "Hide this section",
                                             _moduleSectionState = _moduleArray[i] == 1 ? "hidden" : "shown",
                                             _moduleState = _moduleArray[_sectionID] == 1 ? 0 : 1,
                                             _moduleContainer = _moduleSwitch.closest('.selectionModule');

                                       _moduleSwitch.innerText = _moduleStateText;
                                       _moduleSwitch.setAttribute("section-state", _moduleState);
                                       _moduleContainer.setAttribute("state", _moduleSectionState);
                                    }, {discoverModules: _moduleArray});
                                 });
                              });
                           }
                        });
                     });
                  };
                  discoverModuleHider();
                  runObserver(_discoverContainer, discoverModuleHider);
               }
            }, 10);
         }
      }

      // Render quick display switcher
      if (location.href.match(_streamURLRegex)) {
         const streamDetector = setInterval(()=> {
            const _streamHeader = document.querySelector('.stream__header');
            if (_streamHeader) {
               clearInterval(streamDetector);
               if (!_hasStreamController) {
                  const _streamController = document.createElement("div"),
                        _textContainer = document.createElement("div"),
                        _textHeader = document.createElement("h3"),
                        _listContainer = document.createElement("ul"),
                        _defaultToggle = document.createElement("li"),
                        _compactToggle = document.createElement("li"),
                        _gridToggle = document.createElement("li"),
                        _divider = document.createElement("div"),
                        _sidebarToggle = document.createElement("li");

                  _streamController.className = "stream__controls";
                  _streamController.id = "stream-controller";
                  _textContainer.className = "listDisplayToggle g-flex-row-centered";
                  _textHeader.className = "listDisplayToggleTitle sc-text-light sc-type-medium";
                  _textHeader.innerText = "View";
                  _listContainer.className = "listDisplayToggle sc-list-nostyle g-flex-row-centered";
                  _defaultToggle.className = "listDisplayToggle setting-display-tile default-icon";
                  _defaultToggle.title = "Default listing mode";
                  _defaultToggle.setAttribute('data-id', "default");
                  _compactToggle.className = "listDisplayToggle setting-display-tile list-icon";
                  _compactToggle.title = "Compact listing mode";
                  _compactToggle.setAttribute('data-id', "list");
                  _gridToggle.className = "listDisplayToggle setting-display-tile grid-icon";
                  _gridToggle.title = "Grid listing mode";
                  _gridToggle.setAttribute('data-id', "grid");
                  _divider.id = "quick-switch-divider";
                  _sidebarToggle.className = "setting-display-tile sidebar-icon";
                  _sidebarToggle.title = "Toggle sidebar";

                  _textContainer.appendChild(_textHeader);
                  _listContainer.appendChild(_defaultToggle);
                  _listContainer.appendChild(_compactToggle);
                  _listContainer.appendChild(_gridToggle);
                  _listContainer.appendChild(_divider);
                  _listContainer.appendChild(_sidebarToggle);
                  _textContainer.appendChild(_listContainer);
                  _streamController.appendChild(_textContainer);
                  _streamHeader.appendChild(_streamController);

                  const _defaultDisplay = document.querySelector('.listDisplayToggle.setting-display-tile.default-icon'),
                        _compactDisplay = document.querySelector('.listDisplayToggle.setting-display-tile.list-icon'),
                        _gridDisplay = document.querySelector('.listDisplayToggle.setting-display-tile.grid-icon');

                  if (get.displayType === "list") _compactDisplay.classList.add("active");
                  else if (get.displayType === "grid") _gridDisplay.classList.add("active");
                  else _defaultDisplay.classList.add("active");
                  if (get.hideSidebar !== "on") _sidebarToggle.classList.add("active");

                  const _displayTypeContainer = document.querySelectorAll('.listDisplayToggle.setting-display-tile');
                  _displayTypeContainer.forEach(list => {
                     list.addEventListener('click', ()=> {
                        _displayTypeContainer.forEach(list => list.classList.remove("active"));

                        const _data = list.getAttribute("data-id");
                        if (_data === "list") {
                           _body.setAttribute("displaytype", "list");
                           _compactDisplay.classList.add("active");
                        } else if (_data === "grid") {
                           _body.setAttribute("displaytype", "grid");
                           _gridDisplay.classList.add("active");
                        } else {
                           _body.setAttribute("displaytype", "default");
                           _defaultDisplay.classList.add("active");
                        }



/* View in fullscreen */
async function openFullscreen() {
   var elem = document.documentElement;
  if (elem.requestFullscreen) {
    await elem.requestFullscreen();
    //document.exitFullscreen();
  } else if (elem.mozRequestFullScreen) { /* Firefox */
     await elem.mozRequestFullScreen();
    //document.mozCancelFullScreen();
  } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
     await elem.webkitRequestFullscreen();
    //document.webkitExitFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE/Edge */
     await elem.msRequestFullscreen();
    //document.msExitFullscreen();
  }

  /*const testInter = setInterval(function () {
    if (document.fullscreenElement ||
 document.webkitFullscreenElement ||
 document.mozFullScreenElement) {
    clearInterval(testInter);
 closeFullscreen();
}
}, 100);*/
}

document.addEventListener("fullscreenchange", function() {
  console.log("fullscreenchange event fired!");
  closeFullscreen();
});

/* Close fullscreen */
function closeFullscreen() {
  if (document.exitFullscreen) {
     document.exitFullscreen();
  } else if (document.mozCancelFullScreen) { /* Firefox */
     document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
     document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE/Edge */
    document.msExitFullscreen();
  }
}

openFullscreen();


                        setLocalStorage(()=> {
                           if (chrome.runtime.lastError) alert('Error while saving settings:\n\n' + chrome.runtime.lastError);
                           if (debugMode) console.log(`-> Display mode saved: ${_data}`);
                        }, {displayType: _data});
                     });
                  });

                  _sidebarToggle.addEventListener('click', ()=> {
                     getLocalStorage(get => {
                        let output = "on";
                        if (get.hideSidebar === "on") output = "off";
                        setLocalStorage(()=> {
                           if (output === "off") {
                              _body.removeAttribute("hideSidebar");
                              _sidebarToggle.classList.add("active");
                           } else {
                              _body.setAttribute("hideSidebar", "");
                              _sidebarToggle.classList.remove("active");
                           }
                        }, {hideSidebar: output});
                     }, ["hideSidebar"]);
                  });
               }
            }
         }, 10);
      }

      // Render mass unfollower on the "following" page
      if (location.href.match(_followingURLRegex)) {
         if (get.disableUnfollower !== "on") {
            let unfollowerInterval = setInterval(()=> {
               const _hasUnfollowerContainer = document.querySelector('.lazyLoadingList.badgeList ul.lazyLoadingList__list');
               if (_hasUnfollowerContainer) {
                  clearInterval(unfollowerInterval);
                  const _collectionHeader = document.querySelector('.collectionSection__top'),
                        _networkHeader = document.querySelector('.userNetworkTabs'),
                        _massUnfollowButton = document.querySelector("#mass-unfollow");

                  if (!_massUnfollowButton) {
                     const _massUnfollowContainer = document.createElement("div"),
                           _textContainer = document.createElement("div"),
                           _textHeader = document.createElement("h3"),
                           _confirmUnfollowButton = document.createElement("button"),
                           _undoUnfollowButton = document.createElement("button"),
                           _allUnfollowButton = document.createElement("button"),
                           _followersRegex = /https?:\/\/soundcloud.com\/[a-zA-Z0-9_-]+\/followers/;

                     _massUnfollowContainer.className = "stream__controls";
                     _massUnfollowContainer.id = "mass-unfollow";

                     _textContainer.className = "g-flex-row-centered";

                     _confirmUnfollowButton.className = "sc-button margin-spacing";
                     _confirmUnfollowButton.id = "confirm-unfollow-button";
                     _confirmUnfollowButton.innerText = "Mass unfollow";

                     _undoUnfollowButton.className = "sc-button margin-spacing";
                     _undoUnfollowButton.id = "undo-unfollow-button";
                     _undoUnfollowButton.innerText = "Reset selection";

                     _allUnfollowButton.className = "sc-button";
                     _allUnfollowButton.id = "all-unfollow-button";
                     _allUnfollowButton.innerText = "Select all";

                     if (_collectionHeader) {
                        _textHeader.className = "sc-text-light sc-type-medium margin-spacing";
                        _textHeader.innerText = "Options:";
                        _textContainer.appendChild(_textHeader);
                     } else if (location.href.match(_followersRegex)) {
                        _confirmUnfollowButton.innerText = "Mass follow back";
                     }
                     _textContainer.appendChild(_confirmUnfollowButton);
                     _textContainer.appendChild(_undoUnfollowButton);
                     _textContainer.appendChild(_allUnfollowButton);
                     _massUnfollowContainer.appendChild(_textContainer);

                     if (_collectionHeader) _collectionHeader.appendChild(_massUnfollowContainer);
                     else _networkHeader.appendChild(_massUnfollowContainer);
                  }

                  multiFollow();
                  runObserver(_hasUnfollowerContainer, multiFollow, true);

                  const _confirmSection = document.querySelector('#confirm-unfollow-button'),
                        _undoSection = document.querySelector('#undo-unfollow-button'),
                        _selectAll = document.querySelector('#all-unfollow-button');

                  _confirmSection.addEventListener('click', ()=> {
                     let newFollowCount = 0;
                     const _following = document.querySelectorAll('.badgeList__item');

                     _following.forEach(followed => {
                        const _checkFollowStatus = followed.querySelector('label.userBadgeListItem__checkbox input.sc-checkbox-input');
                        if (_checkFollowStatus.checked == true) {
                           const _closestUnfollowButton = followed.querySelector('.userBadgeListItem .userBadgeListItem__action button.sc-button-follow');
                           _closestUnfollowButton.click();
                           newFollowCount++;
                        }
                     });
                     if (newFollowCount === 1) _confirmSection.innerText = "1 account got unfollowed!";
                     else _confirmSection.innerText = newFollowCount + " accounts got unfollowed!";
                     setTimeout(()=> _confirmSection.innerText = "Mass unfollow", 3000);
                  });
                  _undoSection.addEventListener('click', ()=> massSelector(false));
                  _selectAll.addEventListener('click', ()=> massSelector(true));
               }
            }, 100);
         }
      }
   });
};

// Rendering YellowCloud menu shell
const renderSettings = ()=> {
   if (debugMode) console.log("function renderSettings: Initializing");

   _body.className = "g-overflow-hidden";
   _body.style.paddingRight = "0px";
   _app.className = "g-filter-grayscale";

   const _modal = document.createElement("div"),
         _modalClose = document.createElement("button"),
         _modalContainer = document.createElement("div"),
         _modalContent = document.createElement("div"),
         _modalTitle = document.createElement("h1"),
         _modalCredits = document.createElement("span"),
         _modalTabs = document.createElement("ul"),
         _modalTabListSettings = document.createElement("li"),
         _modalTabListFilter = document.createElement("li"),
         _modalTabListChangelog = document.createElement("li"),
         _modalTabListAbout = document.createElement("li"),
         _modalTabListSideItems = document.createElement("ul"),
         _modalTabListImport = document.createElement("li"),
         _modalImportWrapper = document.createElement("label"),
         _modalImportUpload = document.createElement("input"),
         _modalTabListExport = document.createElement("li"),
         _modalTabsettings = document.createElement("a"),
         _modalTabFilter = document.createElement("a"),
         _modalTabChangelog = document.createElement("a"),
         _modalTabAbout = document.createElement("a"),
         _modalTabImport = document.createElement("a"),
         _modalTabExport = document.createElement("a"),
         _modalPageContainer = document.createElement("div"),
         _modalPageSettings = document.createElement("div"),
         _modalPageFilter = document.createElement("div"),
         _modalPageChangelog = document.createElement("div"),
         _modalPageAbout = document.createElement("div"),
         _modalFooterLine = document.createElement("hr"),
         _modalDonation = document.createElement("span"),
         _modalDonationLink = document.createElement("a");

   _modal.id = "yellowcloud";
   _modal.className = "modal g-z-index-modal-background g-opacity-transition g-z-index-overlay modalWhiteout showBackground invisible";
   _modal.style.paddingRight = "0px";
   _modal.style.outline = "none";
   _modal.style.overflow = "hidden";
   _modal.tabindex = "-1";

   _modalClose.className = "modal__closeButton yellowcloud-close-settings";
   _modalClose.title = "Close";
   _modalClose.type = "button";
   _modalClose.innerText = "Close";

   _modalContainer.className = "modal__modal sc-border-box g-z-index-modal-content";
   _modalContent.className = "modal__content";

   _modalTitle.id = "yellowcloud-title";
   _modalTitle.className = "g-modal-title-h1 sc-truncate";
   _modalTitle.innerText = "YellowCloud Settings " + _manifestData.version;

   _modalCredits.className = "credits";
   _modalCredits.innerHTML = "Made with <span class='heart'>&hearts;</span> in Denmark by <a href='https://twitter.com/DapperBenji' target='_blank'>@DapperBenji</a>.";

   _modalTabs.id = "tab-container";
   _modalTabs.className = "g-tabs g-tabs-small";

   _modalTabListSettings.className = "g-tabs-item";
   _modalTabListFilter.className = "g-tabs-item";
   _modalTabListChangelog.className = "g-tabs-item";
   _modalTabListAbout.className = "g-tabs-item";
   _modalTabListSideItems.className = "g-side-items";
   _modalTabListImport.className = "g-tabs-item";
   _modalTabListImport.id = "yellowcloud-import";
   _modalImportUpload.className = "hidden";
   _modalImportUpload.type = "file";
   _modalImportUpload.accept = ".json";
   _modalTabListExport.className = "g-tabs-item";
   _modalTabListExport.id = "yellowcloud-export";
   _modalTabsettings.setAttribute("action", "settings");
   _modalTabsettings.className = "tab g-tabs-link active";
   _modalTabsettings.innerText = "Settings";
   _modalTabFilter.setAttribute("action", "filter");
   _modalTabFilter.className = "tab g-tabs-link";
   _modalTabFilter.innerText = "Filter (beta)";
   _modalTabChangelog.setAttribute("action", "changelog");
   _modalTabChangelog.className = "tab g-tabs-link";
   _modalTabChangelog.innerText = "Changelog";
   _modalTabAbout.setAttribute("action", "about");
   _modalTabAbout.className = "tab g-tabs-link";
   _modalTabAbout.innerText = "About";
   _modalTabImport.className = "g-tabs-link";
   _modalTabImport.innerText = "Import";
   _modalTabExport.className = "g-tabs-link";
   _modalTabExport.innerText = "Export";
   _modalPageContainer.id = "yellowcloud-settings-content";
   _modalPageSettings.className = "tabPage";
   _modalPageSettings.id = "settings";
   _modalPageSettings.style.display = "block";
   _modalPageFilter.className = "tabPage";
   _modalPageFilter.id = "filter";
   _modalPageChangelog.className = "tabPage";
   _modalPageChangelog.id = "changelog";
   _modalPageAbout.className = "tabPage";
   _modalPageAbout.id = "about";
   _modalDonation.className = "donation";
   _modalDonationLink.href = "https://www.paypal.me/BenjaminBachJensen";
   _modalDonationLink.innerText = "Buy me a cup of coffee ;)";
   _modalDonationLink.target = "_blank";

   _modalPageContainer.appendChild(_modalPageSettings);
   _modalPageContainer.appendChild(_modalPageFilter);
   _modalPageContainer.appendChild(_modalPageChangelog);
   _modalPageContainer.appendChild(_modalPageAbout);
   _modalTabListSettings.appendChild(_modalTabsettings);
   _modalTabListFilter.appendChild(_modalTabFilter);
   _modalTabListChangelog.appendChild(_modalTabChangelog);
   _modalTabListAbout.appendChild(_modalTabAbout);
   _modalImportWrapper.appendChild(_modalTabImport);
   _modalImportWrapper.appendChild(_modalImportUpload);
   _modalTabListImport.appendChild(_modalImportWrapper);
   _modalTabListExport.appendChild(_modalTabExport);
   _modalTabListSideItems.appendChild(_modalTabListImport);
   _modalTabListSideItems.appendChild(_modalTabListExport);
   _modalTabs.appendChild(_modalTabListSettings);
   _modalTabs.appendChild(_modalTabListFilter);
   _modalTabs.appendChild(_modalTabListChangelog);
   _modalTabs.appendChild(_modalTabListAbout);
   _modalTabs.appendChild(_modalTabListSideItems);
   _modalDonation.appendChild(_modalDonationLink);
   _modalContent.appendChild(_modalTitle);
   _modalContent.appendChild(_modalCredits);
   _modalContent.appendChild(_modalTabs);
   _modalContent.appendChild(_modalPageContainer);
   _modalContent.appendChild(_modalFooterLine);
   _modalContent.appendChild(_modalDonation);
   _modalContainer.appendChild(_modalContent);
   _modal.appendChild(_modalClose);
   _modal.appendChild(_modalContainer);
   _body.appendChild(_modal);

   setTimeout(()=> {_modal.classList.remove("invisible");}, 10);
   setTimeout(()=> {_modal.style.overflow = null;}, 400);

   fetchFile(_modalPageSettings, '/assets/html/settings.html', settingsInit);
   fetchFile(_modalPageFilter, '/assets/html/filter.html', filterInit);
   fetchFile(_modalPageChangelog, '/assets/html/changelog.html');
   fetchFile(_modalPageAbout, '/assets/html/about.html', aboutInit);

   // Activates tab logic
   const _tabs = document.querySelectorAll('.tab'),
         _tabCount = _tabs.length;

   for (let i = 0; i < _tabCount; i++) {
      _tabs[i].addEventListener('click', ()=> {
         for (let k = 0; k < _tabCount; k++) _tabs[k].className = "tab g-tabs-link";
         _tabs[i].className = "tab g-tabs-link active";
         const _pages = document.querySelectorAll('.tabPage'),
               _pageCount = _pages.length;
         for (let j = 0; j < _pageCount; j++) _pages[j].style.display = "none";
         const _page = _tabs[i].getAttribute('action');
         document.getElementById(_page).style.display = "block";
      });
   }

   getLocalStorage(exportimportInit);
};

// Assigning YC menus to YC buttons
const settingsMenu = ()=> {
   if (debugMode) console.log("function settingsMenu: Initializing");
   const _settingsButtons = document.querySelectorAll('.yellowcloud-settings-button');
   _settingsButtons.forEach(button => {
      button.removeEventListener("click", renderSettings);
      button.addEventListener("click", renderSettings);
   });
};

// Filter user inputed tags, artists and tracks
const runFilters = ()=> {
   getLocalStorage(get => {
      const _filters = ["tag", "artist", "track"],
            _filtersLength = _filters.length;

      for (let filter = 0; filter < _filtersLength; filter++) {
         let element = null, data = null,
         filterFunction = (callback, element, data) => {
            if (stripLinkDomain(element.href) === data.slug) callback();
         };

         switch (_filters[filter]) {
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
            const _elementLength = element.length,
                  _dataLength = data.length;
            for (let el = 0; el < _elementLength; el++) {
               for (let i = 0; i < _dataLength; i++) {
                  const _parentClassName = moreActionParentClassName(element[el]),
                        _parentElement = element[el].closest(_parentClassName);

                  filterFunction((value = null) => {
                     _parentElement.setAttribute("data-skip", "true");
                     _parentElement.setAttribute("data-type", "custom_filter");
                     if (value) _parentElement.setAttribute("banned-"+ _filters[filter] +"", value);
                     else _parentElement.setAttribute("banned-"+ _filters[filter] +"", "");
                     _parentElement.classList.add("hidden");
                  }, element[el], data[i]);
               }
            }
         }
      }
   }, ["filter", "tagsArray"]);
};

const hidePlaylists = ()=> {
   if (debugMode) console.log("function markPlaylists: Running");
   const _playlists = document.querySelectorAll('.soundList__item .activity div.sound.streamContext');
   _playlists.forEach(playlist => {
      const _getPlaylist = playlist.className;
      if (_getPlaylist.includes("playlist") == true) {
         let getTrackCountNum, getTrackCount = playlist.querySelectorAll('.compactTrackList__listContainer .compactTrackList__item');
         if (getTrackCount.length < 5) getTrackCountNum = getTrackCount.length;
         else {
            const _checkMoreLink = playlist.querySelector('.compactTrackList__moreLink');
            if (_checkMoreLink) getTrackCountNum = _checkMoreLink.innerText.replace(/\D/g,'');
            else getTrackCountNum = getTrackCount.length;
         }
         const _playlistClosest = playlist.closest('.soundList__item');
         _playlistClosest.setAttribute("data-skip", "true");
         _playlistClosest.setAttribute("data-type", "playlist");
         _playlistClosest.setAttribute("data-count", getTrackCountNum);
         _playlistClosest.classList.add("hidden");
      }
   });
};

const hidePreviews = ()=> {
   if (debugMode) console.log("function hidePreviews: Running");
   const _previews = document.querySelectorAll('.sc-snippet-badge.sc-snippet-badge-medium.sc-snippet-badge-grey');
   _previews.forEach(preview => {
      if (preview.innerHTML) {
         const _previewsClosest = preview.closest('.soundList__item');
         _previewsClosest.setAttribute("data-skip", "true");
         _previewsClosest.setAttribute("data-type", "preview");
         _previewsClosest.classList.add("hidden");
      }
   });
};

const hideReposts = ()=> {
   if (debugMode) console.log("function hideReposts: Running");
   const _reposts = document.querySelectorAll('.soundContext__repost');
   _reposts.forEach(repost => {
      const _repostClosest = repost.closest('.soundList__item');
      _repostClosest.setAttribute("data-skip", "true");
      _repostClosest.setAttribute("data-type", "repost");
      _repostClosest.classList.add("hidden");
   });
};

const checkCanvas = ()=> {
   if (debugMode) console.log("function checkCanvas: Running");
   const _soundCanvas = document.querySelectorAll('.sound__waveform .waveform .waveform__layer.waveform__scene');
   _soundCanvas.forEach(canvas => {
      const _selectedCanvas = canvas.querySelectorAll('canvas.g-box-full.sceneLayer');
      _selectedCanvas.forEach(newCanvas => {
         const _lastElement = _selectedCanvas[_selectedCanvas.length-1],
               _getCanvas = _lastElement.getContext("2d"),
               _lengthCalc = _lastElement.width - 27,
               _pixelData = _getCanvas.getImageData(_lengthCalc, 27, 1, 1).data;

         if (_pixelData[0] === 0 && _pixelData[1] === 0 && _pixelData[2] === 0 && _pixelData[3] === 255) {
            const _canvasClosest = canvas.closest('.soundList__item');
            _canvasClosest.setAttribute("data-skip", "true");
            _canvasClosest.setAttribute("data-type", "long");
            _canvasClosest.classList.add("hidden");
         }
      });
   });
};

const checkUserActivity = ()=> {
   if (debugMode) console.log("function checkUserActivity: Running");
   const _yourTracks = document.querySelectorAll('.soundContext__usernameLink'),
         _getUsername = document.querySelector('.header__userNavUsernameButton'),
         _getUsernameHref = _getUsername.getAttribute("href");

   _yourTracks.forEach(track => {
      const _yourTrackHref = track.getAttribute("href");
      if (_getUsernameHref === _yourTrackHref) {
         const _trackClosest = track.closest('.soundList__item');
         _trackClosest.setAttribute("data-skip", "true");
         _trackClosest.setAttribute("data-type", "yours");
         _trackClosest.classList.add("hidden");
      }
   });
};

const renderMoreActionCallback = e => {
   const _checkMoreActionMenu = document.querySelector('.moreActions #yellowcloud-moreActions-group'),
         _isButtonActive = e.target.classList.contains("sc-button-active");
   if (!_checkMoreActionMenu && _isButtonActive) {
      const _parentClassName = moreActionParentClassName(e.target),
            _trackContainer = e.target.closest(_parentClassName);
      moreActionMenuContent(_trackContainer);
   }
};

const renderMoreAction = ()=> {
   const _moreActionButtons = document.querySelectorAll('button.sc-button-more.sc-button-small');
   _moreActionButtons.forEach(button => {
      button.removeEventListener('click', renderMoreActionCallback);
      button.addEventListener('click', renderMoreActionCallback);
   });
};

const frontEndStreamManipulation = (reset = false)=> {
   if (reset === true) observer.disconnect();
   getLocalStorage(get => {
      const _stream = document.querySelectorAll('.lazyLoadingList > ul, .lazyLoadingList > div > ul'),
            _steamLength = _stream.length;

      if (debugMode) console.log(_stream);
      renderMoreAction();
      runFilters();
      if (get.removePreviews === "on") hidePreviews();
      if (get.removePlaylists === "on") hidePlaylists();
      if (get.removeReposts === "on") hideReposts();
      if (get.removeLongTracks === "on") checkCanvas();
      if (get.removeUserActivity === "on") checkUserActivity();

      for (let i = 0; i < _steamLength; i++) {
         runObserver(_stream[i], renderMoreAction);
         runObserver(_stream[i], runFilters);
         if (get.removePreviews === "on") runObserver(_stream[i], hidePreviews);
         if (get.removePlaylists === "on") runObserver(_stream[i], hidePlaylists);
         if (get.removeReposts === "on") runObserver(_stream[i], hideReposts);
         if (get.removeLongTracks === "on") runObserver(_stream[i], checkCanvas);
         if (get.removeUserActivity === "on") runObserver(_stream[i], checkUserActivity);
      }
   });
};

// Run music-stream manipulating functions
const injectedJavascript = ()=> {
   if (debugMode) console.log("function injectedJavascript: Initializing");
   const _soundBadge = document.querySelector('.playbackSoundBadge'),
         _nextControl = document.querySelector('.skipControl__next'),
         _previousControl = document.querySelector('.skipControl__previous');

   // =============================================================
   // Music-stream manipulation functions
   // =============================================================

   // Main initializing function
   const initStreamManipulator = setInterval(()=> {
      const _mainStream = document.querySelector('.l-fluid-fixed > .l-main .lazyLoadingList ul, .l-fixed-fluid > .l-main .lazyLoadingList > ul, .l-hero-fluid-fixed .l-main .lazyLoadingList, .l-collection .l-main .lazyLoadingList');
      if (_mainStream) {
         clearInterval(initStreamManipulator);

         frontEndStreamManipulation();

         // Next song manager
         runObserver(_soundBadge, ()=> {
            getLocalStorage(get => {
               const _getStreamItems = document.querySelectorAll('.soundList__item'),
                     _getStreamItemLength = _getStreamItems.length;

               for (let i = 0; i < _getStreamItemLength; i++) {
                  const _getSkipStatus = _getStreamItems[i].getAttribute("data-skip"),
                        _getPlaylistType = _getStreamItems[i].getAttribute("data-playlist"),
                        _getTitle = _getStreamItems[i].querySelector('.soundTitle__title span'),
                        _getPlaying = _getStreamItems[i].querySelector('.activity div.sound.streamContext').className;

                  if (_getPlaying.includes("playing") == true) {
                     if (debugMode) console.log("Skip song?: " + _getSkipStatus);
                     if (_getSkipStatus == "true") {
                        _previousControl.addEventListener("click", ()=> skipPrevious = true);
                        if (_getPlaylistType == true) {
                           const _skipCount = _getStreamItems[i].getAttribute("data-count");
                           if (skipPrevious == true) for (let t = 0; t < _skipCount; t++) _previousControl.click();
                           else for (let t = 0; t < _skipCount; t++) _nextControl.click();
                        } else {
                           if (skipPrevious == true) _previousControl.click();
                           else _nextControl.click();
                        }
                     } else skipPrevious = false;
                  }
               }
            });
         });
      }
   }, 100);
};
