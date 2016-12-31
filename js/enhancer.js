// Global variables
var body = document.getElementsByTagName("BODY")[0];
var getGlobalSettings = [];

// Detect URL changes
var oldLocation = location.href;
setInterval(function() {
   if(location.href != oldLocation && document.readyState === "complete") {
      oldLocation = location.href;
      injectedJavascript();
   }
}, 1000);

//Get settings from chrome storage
getGlobalSettings.push('darkMode');
getGlobalSettings.push('hideSidebar');
getGlobalSettings.push('displayType');
getGlobalSettings.push('removePreviews');
getGlobalSettings.push('tagsArray');
getGlobalSettings.push('relatedContext');

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
   if(get.displayType == "grid"){
      body.setAttribute("data-display", "grid");
   }
});

// Load the injected javascript on load
window.addEventListener("load", function() {injectedJavascript(); settingsMenu();}, false);

function settingsMenu() {
   // Create settings dialogbox
   var setGlobalSettings = {};
   var settingsbtn = document.getElementById('enhancer-btn');
   settingsbtn.addEventListener("click", function(){
      vex.dialog.open({
         className: 'vex-theme-top',
         input: [
            '<h1 class="g-modal-title-h1 sc-truncate">SoundCloud Enhancer Settings</h1>',
            '<span class="credits">Made with <span class="heart">❤</span> in Denmark by <a href="https://soundcloud.com/dapperbenji">DapperBenji</a></span>',
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
            '<h2>Filter:</h2>',
            '<div class="settings-option">',
               '<label class="checkbox sc-checkbox">',
                  '<input type="checkbox" name="removePreviews" id="removePreviews" class="sc-checkbox-input sc-visuallyhidden" aria-required="false">',
                  '<div class="sc-checkbox-check"></div>',
                  '<span class="sc-checkbox-label">Filter all previews</span>',
               '</label>',
            '</div>',
            '<div class="settings-option">',
               '<span style="margin-bottom: 5px; display: block;">Hide tracks with specific tags:</span>',
               '<div class="input">',
                  '<input id="skipTags" placeholder="Add tags..." value="">',
               '</div>',
            '</div>',
            '<h2>Features:</h2>',
            '<div class="settings-option">',
               '<label class="checkbox sc-checkbox">',
                  '<input type="checkbox" name="relatedContext" id="relatedContext" class="sc-checkbox-input sc-visuallyhidden" aria-required="false">',
                  '<div class="sc-checkbox-check"></div>',
                  '<span class="sc-checkbox-label">Add related tracks option (More context menu)</span>',
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
      var skipTagsInput = document.getElementById("skipTags");
      var relatedContextInput = document.getElementById("relatedContext");

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
         if (get.tagsArray != null) {
            skipTagsInput.setAttribute("value", get.tagsArray);
         }
         if(get.relatedContext == "on"){
            relatedContextInput.checked = true;
         }
      });

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
      if (data.relatedContext != "on") {
         data.relatedContext = "off";
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
      setGlobalSettings.tagsArray = tagsArray;
      setGlobalSettings.relatedContext = data.relatedContext;

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
   var stream = document.getElementsByClassName('lazyLoadingList__list')[0];
   var soundBadge = document.getElementsByClassName('playbackSoundBadge')[0];
   var soundPanel = document.getElementsByClassName('playControls')[0];
   var soundPanelInner = document.getElementsByClassName('playControls__inner')[0];
   var tags = document.getElementsByClassName('soundTitle__tagContent');

   // Force-open sound control panel
   soundPanel.setAttribute("class", "playControls g-z-index-header m-visible");

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

   // Observer configs
   var config = {childList: true, attributes: true, characterData: true};
   var soundBadge_config = {childList: true};

   // Remove songs with a specific tag
   chrome.storage.sync.get(getGlobalSettings, function(get){
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
   });

   // Add related tracks option to the more context menu
   chrome.storage.sync.get(getGlobalSettings, function(get){
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
   });

   // Remove previews code
   chrome.storage.sync.get(getGlobalSettings, function(get){
      if(get.removePreviews == "on"){
         // Function to skip all previews
         function hidePreviews() {
            var preview = stream.getElementsByClassName('sc-snippet-badge sc-snippet-badge-medium sc-snippet-badge-grey');
            for (i = 0; i < preview.length; i++){
               if(preview[i].innerHTML != ""){
                  var previewsClosest = preview[i].closest('.soundList__item');
                  previewsClosest.setAttribute("data-skip", "true");
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
   });

   // Skip the current song playing
   function skipSong() {
      document.getElementsByClassName("skipControl__next")[0].click();
      window.skipPrevious = "false";
   }
   function skipSongReverse() {
      document.getElementsByClassName("skipControl__previous")[0].click();
      window.skipPrevious = "false";
   }

   var nextSongObserver = new MutationObserver(function (mutationRecords, observer) {
      mutationRecords.forEach(function (mutation) {
         //alert(window.skipPrevious);
         var getPath = document.getElementsByClassName('playbackSoundBadge__titleContextContainer')[0].getElementsByClassName('playbackSoundBadge__title')[0];
         var getTitleAttribute = getPath.getAttribute("title");
         var getStreamItems = document.getElementsByClassName('soundList__item');

         // Switch song after tag
         for(i = 0; i < getStreamItems.length; i++){
            var getTitle = getStreamItems[i].querySelector('.soundTitle__title span');
            if(getTitleAttribute == getTitle.innerText){
               var getSkipStatus = getStreamItems[i].getAttribute("data-skip");
               if (getSkipStatus == "true") {
                  var skipReverseButton = document.getElementsByClassName("skipControl__previous")[0];
                  // Detect a reverse song request
                  skipReverseButton.addEventListener("click", function() {
                     window.skipPrevious = "true";
                  }, false);
                  if (window.skipPrevious == "true") {
                     skipSongReverse();
                  }else{
                     skipSong();
                  }
               }
            }
         }
      });
   });
   nextSongObserver.observe(soundBadge, soundBadge_config);
}
