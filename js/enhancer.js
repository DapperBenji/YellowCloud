// Global variables
var body = document.getElementsByTagName("BODY")[0];
var soundPanel = document.getElementsByClassName('playControls')[0];
var announcements = document.getElementsByClassName('announcements g-z-index-fixed-top')[0];
var soundPanelInner = document.getElementsByClassName('playControls__inner')[0];
var getGlobalSettings = [];

// Detect URL changes
window.oldLocation = location.href;
setInterval(function() {
   if(location.href != window.oldLocation) {
      var readyStateCheckInterval = setInterval(function() {
         if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);
            window.oldLocation = location.href;
            settingsSetup();
            injectedJavascript();
         }
      }, 10);
   }
}, 3000);

//Get settings from chrome storage
getGlobalSettings.push('darkMode');
getGlobalSettings.push('hideSidebar');
getGlobalSettings.push('displayType');
getGlobalSettings.push('removePreviews');
getGlobalSettings.push('removePlaylists');
getGlobalSettings.push('removeLongTracks');
getGlobalSettings.push('removeUserActivity');
getGlobalSettings.push('removeReposts');
getGlobalSettings.push('tagsArray');
getGlobalSettings.push('relatedContext');
getGlobalSettings.push('hiddenOutline');

chrome.storage.sync.get(getGlobalSettings, function(get){
   if(get.darkMode == "on"){
      body.setAttribute("data-theme", "dark");
   }
   if(get.hideSidebar == "on"){
      body.setAttribute("data-sidebar", "hidden");
   }else{
      body.setAttribute("data-sidebar", "show");
   }
   if(get.displayType == "list"){
      body.setAttribute("data-display", "list");
   }
   else if(get.displayType == "grid"){
      body.setAttribute("data-display", "grid");
   }else{
      body.setAttribute("data-display", "default");
   }
   if (get.hiddenOutline == "on") {
      body.setAttribute("data-hidden-outline", "show");
   }
});

// Load the injected javascript on load
window.onload = function() {
  settingsSetup();
  settingsMenu();
  injectedJavascript();
};

function settingsSetup(){
  // Force-open sound control panel
  soundPanel.setAttribute("class", "playControls g-z-index-header m-visible");
  announcements.setAttribute("class", "announcements g-z-index-fixed-top m-offset");

  // Create options button
  var checkButton = document.querySelector("#enhancer-btn");
  if(checkButton == null){
     var div = document.createElement("div");
     div.setAttribute('id',"enhancer-container");

     var button = document.createElement("button");
     button.setAttribute('class',"sc-button-edit sc-button sc-button-medium sc-button-responsive");
     button.setAttribute('id',"enhancer-btn");

     button.innerText = "Enhancer settings";

     div.appendChild(button);
     soundPanelInner.appendChild(div);
  }
}

function settingsMenu() {
   // Create settings dialogbox
   var setGlobalSettings = {};
   var settingsbtn = document.getElementById('enhancer-btn');
   settingsbtn.addEventListener("click", function(){
      vex.dialog.open({
         className: 'vex-theme-top',
         input: [
            '<h1 class="g-modal-title-h1 sc-truncate">SoundCloud Enhancer Settings 1.9</h1>',
            '<span class="credits">Made with <span class="heart">❤</span> in Denmark by <a href="https://twitter.com/DapperBenji">@DapperBenji</a>. Follow development on <a href="https://trello.com/b/n7jrTzxO/soundcloud-enhancer">Trello</a>.</span>',
            '<h2>Design:</h2>',
            '<div class="settings-option">',
               '<label class="checkbox sc-checkbox">',
                  '<input type="checkbox" name="darkMode" id="darkMode" class="sc-checkbox-input sc-visuallyhidden" aria-required="false">',
                  '<div class="sc-checkbox-check"></div>',
                  '<span class="sc-checkbox-label">Enable dark mode</span>',
               '</label>',
            '</div>',
            '<div class="settings-option">',
               '<label class="checkbox sc-checkbox">',
                  '<input type="checkbox" name="hideSidebar" id="hideSidebar" class="sc-checkbox-input sc-visuallyhidden" aria-required="false">',
                  '<div class="sc-checkbox-check"></div>',
                  '<span class="sc-checkbox-label">Hide sidebar</span>',
               '</label>',
            '</div>',
            '<div class="settings-option">',
               '<span>View mode on stream</span>',
               '<ul class="settings-display-list">',
                  '<label>',
                     '<input type="radio" name="displayType" value="default" class="hidden">',
                     '<li class="setting-display-tile default-icon" title="Default"></li>',
                  '</label>',
                  '<label>',
                     '<input type="radio" name="displayType" value="list" class="hidden">',
                     '<li class="setting-display-tile list-icon" title="Compact"></li>',
                  '</label>',
                  '<label>',
                     '<input type="radio" name="displayType" value="grid" class="hidden">',
                     '<li class="setting-display-tile grid-icon" title="Grid"></li>',
                  '</label>',
               '</ul>',
            '</div>',
            '<h2>Filter:<br><span class="notice">(Filter options only work when you listen to music on the stream page)</span></h2>',
            '<div class="settings-option">',
               '<label class="checkbox sc-checkbox">',
                  '<input type="checkbox" name="removePreviews" id="removePreviews" class="sc-checkbox-input sc-visuallyhidden" aria-required="false">',
                  '<div class="sc-checkbox-check"></div>',
                  '<span class="sc-checkbox-label">Filter all previews</span>',
               '</label>',
            '</div>',
            '<div class="settings-option">',
               '<label class="checkbox sc-checkbox">',
                  '<input type="checkbox" name="removePlaylists" id="removePlaylists" class="sc-checkbox-input sc-visuallyhidden" aria-required="false">',
                  '<div class="sc-checkbox-check"></div>',
                  '<span class="sc-checkbox-label">Filter all playlists</span>',
               '</label>',
            '</div>',
            '<div class="settings-option">',
               '<label class="checkbox sc-checkbox">',
                  '<input type="checkbox" name="removeLongTracks" id="removeLongTracks" class="sc-checkbox-input sc-visuallyhidden" aria-required="false">',
                  '<div class="sc-checkbox-check"></div>',
                  '<span class="sc-checkbox-label">Filter all tracks above 10min (Can be buggy)</span>',
               '</label>',
            '</div>',
            '<div class="settings-option">',
               '<label class="checkbox sc-checkbox">',
                  '<input type="checkbox" name="removeUserActivity" id="removeUserActivity" class="sc-checkbox-input sc-visuallyhidden" aria-required="false">',
                  '<div class="sc-checkbox-check"></div>',
                  '<span class="sc-checkbox-label">Filter own user activity <button class="sc-button sc-button-small tooltip-button" type="button" data-tooltip="Hides all your own posts, reposts and playlists from the stream">?</button></span>',
               '</label>',
            '</div>',
            '<div class="settings-option">',
               '<label class="checkbox sc-checkbox">',
                  '<input type="checkbox" name="removeReposts" id="removeReposts" class="sc-checkbox-input sc-visuallyhidden" aria-required="false">',
                  '<div class="sc-checkbox-check"></div>',
                  '<span class="sc-checkbox-label">Filter all reposts <button class="sc-button sc-button-small tooltip-button" type="button" data-tooltip="Warning: This option can be really laggy, so be patient">?</button></span>',
               '</label>',
            '</div>',
            '<div class="settings-option">',
               '<span class="skiptags-span">Filter tracks with specific tags:</span>',
               '<div class="input">',
                  '<input id="skipTags" placeholder="Add tags..." value="">',
               '</div>',
            '</div>',
            '<h2>Features:</h2>',
            '<div class="settings-option">',
               '<label class="checkbox sc-checkbox">',
                  '<input type="checkbox" name="relatedContext" id="relatedContext" class="sc-checkbox-input sc-visuallyhidden" aria-required="false">',
                  '<div class="sc-checkbox-check"></div>',
                  '<span class="sc-checkbox-label">Add "related tracks" option on tracks <button class="sc-button sc-button-small tooltip-button" type="button" data-tooltip="Adds a link to related tracks on tracks with a “more“ or “...“ button">?</button></span>',
               '</label>',
            '</div>',
            '<div class="settings-option">',
               '<label class="checkbox sc-checkbox">',
                  '<input type="checkbox" name="hiddenOutline" id="hiddenOutline" class="sc-checkbox-input sc-visuallyhidden" aria-required="false">',
                  '<div class="sc-checkbox-check"></div>',
                  '<span class="sc-checkbox-label">Show outline of hidden tracks</span>',
               '</label>',
            '</div>',
            '<span class="donation"><a href="https://www.paypal.me/benjaminbach">Buy me a cup of coffee</a></span>'
         ].join(''),
         buttons: [
            $.extend({}, vex.dialog.buttons.YES, { text: 'Save settings', className: 'sc-button' }),
            $.extend({}, vex.dialog.buttons.NO, { text: 'Cancel', className: 'sc-button-nostyle' })
         ],
         callback: function(data) {
             if (!data) {
               console.log('No data saved!');
            } else {
               saveSettings(data);
            }
         }
      })

      // Populate settings dialogbox
      var darkModeInput = document.getElementById('darkMode');
      var hideSidebarInput = document.getElementById('hideSidebar');
      var displayTypeInput = document.getElementsByName("displayType");
      var removePreviewsInput = document.getElementById("removePreviews");
      var removePlaylistsInput = document.getElementById("removePlaylists");
      var removeLongTracksInput = document.getElementById("removeLongTracks");
      var removeUserActivityInput = document.getElementById("removeUserActivity");
      var removeRepostsInput = document.getElementById('removeReposts');
      var skipTagsInput = document.getElementById("skipTags");
      var relatedContextInput = document.getElementById("relatedContext");
      var hiddenOutlineInput = document.getElementById("hiddenOutline");

      chrome.storage.sync.get(getGlobalSettings, function(get){
         if(get.darkMode == "on"){
            darkModeInput.checked = true;
         }
         if(get.hideSidebar == "on"){
            hideSidebarInput.checked = true;
         }
         if(get.displayType == "list"){
            displayTypeInput[1].checked = true;
         }else if (get.displayType == "grid") {
            displayTypeInput[2].checked = true;
         } else {
            displayTypeInput[0].checked = true;
         }
         if(get.removePreviews == "on"){
            removePreviewsInput.checked = true;
         }
         if(get.removePlaylists == "on"){
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
         if(get.relatedContext == "on"){
            relatedContextInput.checked = true;
         }
         if (get.hiddenOutline == "on") {
            hiddenOutlineInput.checked = true;
         }
      });

      // Load tags properly in the settings menu
      setTimeout(function() {
         insignia(skipTags, {
            delimiter: ',',
            deletion: true
         });
      }, 100);

   }, false);

   // Save settings from the setting dialogbox
   function saveSettings(data) {
      // Data handling
      if (data.darkMode != "on") {
         data.darkMode = "off";
      }
      if (data.hideSidebar != "on") {
         data.hideSidebar = "off";
      }
      if (data.displayType == "default"){
         data.displayType = "";
      }
      if (data.removePreviews != "on") {
         data.removePreviews = "off";
      }
      if (data.removePlaylists != "on") {
         data.removePlaylists = "off";
      }
      if (data.removeLongTracks != "on") {
         data.removeLongTracks = "off";
      }
      if (data.removeUserActivity != "on") {
         data.removeUserActivity = "off";
      }
      if (data.removeReposts != "on") {
        data.removeReposts = "off";
      }
      if (data.relatedContext != "on") {
         data.relatedContext = "off";
      }
      if (data.hiddenOutline != "on"){
         data.hiddenOutline = "off";
      }

      var tagsArray = [];
      var tagElement = document.getElementsByClassName("nsg-tag");
      for (var i = 0; i < tagElement.length; i++) {
         tagsArray.push(tagElement[i].innerText);
      }

      setGlobalSettings.darkMode = data.darkMode;
      setGlobalSettings.hideSidebar = data.hideSidebar;
      setGlobalSettings.displayType = data.displayType;
      setGlobalSettings.removePreviews = data.removePreviews;
      setGlobalSettings.removePlaylists = data.removePlaylists;
      setGlobalSettings.removeLongTracks = data.removeLongTracks;
      setGlobalSettings.removeUserActivity = data.removeUserActivity;
      setGlobalSettings.removeReposts = data.removeReposts;
      setGlobalSettings.tagsArray = tagsArray;
      setGlobalSettings.relatedContext = data.relatedContext;
      setGlobalSettings.hiddenOutline = data.hiddenOutline;

      // Store all options in chrome
      chrome.storage.sync.set(setGlobalSettings, function(){
         if (chrome.runtime.lastError) {
            alert('Error settings:\n\n'+chrome.runtime.lastError);
         }
      });

      // Refresh webpage
      location.reload();
   }
}

function injectedJavascript() {
   // Variables
   window.skipPrevious = "false";
   var stream = document.querySelector('#content .lazyLoadingList ul');
   var content = document.getElementById('content');
   var soundBadge = document.getElementsByClassName('playbackSoundBadge')[0];
   var tags = document.getElementsByClassName('soundTitle__tagContent');

   // Observer configs
   var config = {childList: true, attributes: true, characterData: true};
   var soundBadge_config = {childList: true};

   // Create quick display switcher on stream
   if(location.href == "https://soundcloud.com/stream"){
      var streamHeader = document.getElementsByClassName('stream__header')[0];
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

      chrome.storage.sync.get(getGlobalSettings, function(get){
         // Declare the display icons list elements
         var getDefaultList = document.getElementsByClassName('listDisplayToggle setting-display-tile default-icon')[0];
         var getCompactList = document.getElementsByClassName('listDisplayToggle setting-display-tile list-icon')[0];
         var getGridList = document.getElementsByClassName('listDisplayToggle setting-display-tile grid-icon')[0];

         // Mark the current selected display mode
         if (get.displayType == "list") {
            getCompactList.className = "listDisplayToggle setting-display-tile list-icon active";
         }else if (get.displayType == "grid") {
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

               chrome.storage.sync.set(setGlobalSettings, function(){
                  if (chrome.runtime.lastError) {
                     alert('Error settings:\n\n'+chrome.runtime.lastError);
                  }
               });

               location.reload();
            });
         }
      });
   }

   if(location.href == "https://soundcloud.com/you/following"){
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
            if(followingUsers[i].querySelector(".userBadgeListItem__checkbox") == undefined){
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
      var unfollowObserver = new MutationObserver(function (mutationRecords, observer) {
         mutationRecords.forEach(function (mutation) {multiFollow();});
      });
      unfollowObserver.observe(stream, config);

      var confirm = document.getElementById('confirm-unfollow-button');
      var undo = document.getElementById('undo-unfollow-button');

      confirm.addEventListener('click', function() {
         var unfollowLoop = document.getElementsByClassName('badgeList__item');
         var oldFollowCount = unfollowLoop.length;
         for (var i = 0; i < unfollowLoop.length; i++) {
            var checkFollowStatus = unfollowLoop[i].querySelector('label.userBadgeListItem__checkbox input.sc-checkbox-input');
            if(checkFollowStatus.checked == true){
               var closestUnfollowButton = unfollowLoop[i].querySelector('.userBadgeListItem .userBadgeListItem__action button.sc-button-follow');
               closestUnfollowButton.click();
            }
         }
         var newFollowCount = oldFollowCount-unfollowLoop.length;
         if (newFollowCount == 1) {
            confirm.innerText = newFollowCount + " account got unfollowed!";
         } else {
            confirm.innerText = newFollowCount + " accounts got unfollowed!";
         }
         setTimeout(function(){
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
      if(get.removeReposts == "on"){
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
         var repostObserver = new MutationObserver(function (mutationRecords, observer) {
            mutationRecords.forEach(function (mutation) {hideReposts();});
         });
         repostObserver.observe(stream, config);
      }

      // Remove songs with a specific tag
      if(get.tagsArray != null){
         function checkTags(){
            var tags = document.getElementsByClassName('soundTitle__tagContent');
            var tagArray = get.tagsArray;
            var tagArray2 = "" + tagArray + "";
            var tagSplit = tagArray2.split(",");

            for (t = 0; t < tags.length; t++)
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
         var tagsObserver = new MutationObserver(function (mutationRecords, observer) {
            mutationRecords.forEach(function (mutation) {checkTags();});
         });
         tagsObserver.observe(stream, config);
      }

      // Add related tracks option to the more context menu
      if(get.relatedContext == "on"){
         function relatedContext() {
            window.relatedContextMode = 0;
            window.registerMoreClick = document.querySelectorAll('.soundActions button.sc-button-more');
            if (window.registerMoreClick.length == 0) {
               window.registerMoreClick = document.querySelectorAll('.audibleTile__actions button.sc-button-more');
               window.relatedContextMode = 1;
            }
            for (var i = 0; i < window.registerMoreClick.length; i++) {
               registerMoreClick[i].addEventListener('click', function() {
                  var getMoreContextMenu = document.querySelector('.moreActions div');
                  if (window.relatedContextMode == 1) {
                     if (location.href == "https://soundcloud.com/you/likes") {
                        var getSongContainer = this.closest('.badgeList__item');
                     }else{
                        var getSongContainer = this.closest('.soundGallery__sliderPanelSlide');
                     }
                     var getSongLinks = getSongContainer.querySelector('.audibleTile .audibleTile__artwork .audibleTile__artworkLink');
                     var getSongHref = getSongLinks.getAttribute("href");
                     var checkContextMenu = document.querySelector('.moreActions div #related-button');
                     if (checkContextMenu == null) {
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
                  } else {
                     var getSongContainer = this.closest('.sound__content');
                     var getSongLinks = getSongContainer.querySelector('.sound__header .soundTitle .soundTitle__titleContainer .soundTitle__usernameTitleContainer .soundTitle__title');
                     var getSongHref = getSongLinks.getAttribute("href");
                     var checkContextMenu = document.querySelector('.moreActions div #related-button');
                     if (checkContextMenu == null) {
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
               });
            }
         }
         relatedContext();

         // Run the function after a lazyload
         var moreClickObserver = new MutationObserver(function (mutationRecords, observer) {
            mutationRecords.forEach(function (mutation) {relatedContext();});
         });
         moreClickObserver.observe(stream, config);
      }

      // Remove previews
      if(get.removePreviews == "on"){
         // Function to skip all previews
         function hidePreviews() {
            var preview = document.getElementsByClassName('sc-snippet-badge sc-snippet-badge-medium sc-snippet-badge-grey');
            for (i = 0; i < preview.length; i++){
               if(preview[i].innerHTML != ""){
                  var previewsClosest = preview[i].closest('.soundList__item');
                  previewsClosest.setAttribute("data-skip", "true");
                  previewsClosest.setAttribute("data-type", "preview");
                  previewsClosest.setAttribute("class", "soundList__item hidden");
               }
            }
         }
         hidePreviews();

         // Run the function after a lazyload
         var previewObserver = new MutationObserver(function (mutationRecords, observer) {
            mutationRecords.forEach(function (mutation) {hidePreviews();});
         });
         previewObserver.observe(stream, config);
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
         var playlistObserver = new MutationObserver(function (mutationRecords, observer) {
            mutationRecords.forEach(function (mutation) {hidePlaylists();});
         });
         playlistObserver.observe(stream, config);

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
                  if(pixelData[0] == 0 && pixelData[1] == 0 && pixelData[2] == 0 && pixelData[3] == 255){
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
         var canvasObserver = new MutationObserver(function (mutationRecords, observer) {
            mutationRecords.forEach(function (mutation) {checkCanvas();});
         });
         canvasObserver.observe(stream, config);
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
         var userActivityObserver = new MutationObserver(function (mutationRecords, observer) {
            mutationRecords.forEach(function (mutation) {checkUserActivity();});
         });
         userActivityObserver.observe(stream, config);
      }
   });

   function markPlaylists() {
      var getPlaylists = document.querySelectorAll('.soundList__item .activity div.sound.streamContext');
      for (var i = 0; i < getPlaylists.length; i++){
         var getPlaylist = getPlaylists[i].className;
         if(getPlaylist.includes("playlist") == true){
            var getTrackCount = getPlaylists[i].getElementsByClassName('genericTrackCount__title')[0].innerText;
            var playlistClosest = getPlaylists[i].closest('.soundList__item');
            playlistClosest.setAttribute("data-playlist", "true");
            playlistClosest.setAttribute("data-count", getTrackCount);
         }
      }
   }
   markPlaylists();

   // Run the function after a lazyload
   var markPlaylistsObserver = new MutationObserver(function (mutationRecords, observer) {
      mutationRecords.forEach(function (mutation) {markPlaylists();});
   });
   markPlaylistsObserver.observe(stream, config);

   window.skipPrevious = "false";
   var nextSongObserver = new MutationObserver(function (mutationRecords, observer) {
      mutationRecords.forEach(function (mutation) {
         chrome.storage.sync.get(getGlobalSettings, function(get){
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
                  // Load unloaded tracks with changes
                  if(location.href == "https://soundcloud.com/stream"){
                     if (get.displayType == "grid") {
                        if (i >= getStreamItems.length-12) {
                           window.scrollTo(0,document.body.scrollHeight);
                        }
                     } else {
                        if (i >= getStreamItems.length-10) {
                           window.scrollTo(0,document.body.scrollHeight);
                        }
                     }
                  }

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
