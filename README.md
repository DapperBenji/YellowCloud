# YellowCloud v3.6 #

## Description: ##
----------------------------------------
YellowCloud (YC) offers loads of customizations enhancing the SoundCloud┬« experience.

## Changelog: ##
----------------------------------------
### Version 1.0 (Release) ###
- Added Dark mode.
- Added an option to remove the sidebar.
- Made a view mode toggle (default, list and grid view).
- Added a specific tag filter.
- Added a preview song filter.

### Version 1.1 ###
- Added a option to add related tracks to the "more" context menu.
- Fixed a typo.
- Various fixes to the dark mode.
- Made the settings button responsive.

### Version 1.5 ###
- Fixed a huge bug where the tracks skipping changes wasn't loaded. It will now automatically scroll the page to load changes into DOM.
- Added a quick display type switch for the stream page.
- Added the option to show hidden tracks.
- Added a link to the project's new Trello board.
- Added an option to hide longer tracks (May still me bugs).
- Cleaned the code a bit.
- Added short name to the manifest.
- Removed the popup code.

#### Known bugs: ####
- There may occur bugs when using the previous track button.
- Changes not loaded when chrome reopens Soundcloud window.

### Version 1.6 ###
- Added a mass unfollow option inside [https://soundcloud.com/you/following](SoundCloud following).
- Minor improvements to the dark mode.
- Added a notice in the settings menu under the "filter" options.

#### Focusing on: ####
In the next couple of updates I will be focusing on the extension's stability.
Follow the development here: [https://trello.com/b/n7jrTzxO/yellowcloud-development](Trello board).

### Version 1.7 ###
- More reliable change load.
- Added the option to skip playlists/albums.
- Added the option to hide own user activity.
- Rework to the song skipping code (Better reverse song detection).
- Dark mode tweaks.
- Now showing "Not available in your country" in grid mode.

### Version 1.8 ###
- Added tooltips to some options.
- Added the option to skip all reposts.
- Fixed SC announcement being displayed incorrectly.
- Replace the SC logo with the YC logo.
- Various dark mode improvements.
- Fixed a bug where the YC button wouldn't work on some SC subpages.

### Version 1.9 ###
- Added the YC settings menu to the popup menu.

### Version 2.0 ###
- Huge stability changes.
- Made the "related tracks" more menu addition, more consistent. Before it wouldn't load on specific pages and tracks with coverart.
- Fixed a bug where "related tracks" would show for a playlist.
- Added a new user page design.
- Added a version number to the YC logo in the header.
- Added a "Like" tab to profiles.
- Added a quick tag blacklist (Hit the "more" button on tracks with a tag).

### Version 2.1 ###
- The extension has asking to read browser history, which wasn't used for anything. That have been fixed.

### Version 2.2 ###
- Name changed in the chrome webstore.
- Added the "The Upload" playlist in the stream explore bar, like so [http://i.imgur.com/ynid7at.png](Imgur image).
- Various dark mode improvements, mainly with the newly added queue menu.
- Added the option the remove the in-website settings button.
- Added the option to remove the "The Upload" from the discover tab.

### Version 2.3 ###
- Added the option to make profile pictures square.
- Various dark mode improvement, most notably the media controls are now optimized.
- Removed all http:// loaded content (replaced with base64).
- Fixed a bug with the mass unfollowers counter.
- Fixed a visual bug with the "add to queue" button in grid view mode.
- Fixed a bug were grid mode disabled comments cross-site.
- Fixed the playlist filter.
- Made the "Block tag" context menu item an optional feature.
- Rearranged the settings menu's sections.
- Gave the "Block tag" context menu item a unique icon.
- Cleaned up unused extension files.

### Version 2.4 ###
- Updated the donation link.
- Updated "The upload" menu URL to the new URL format.
- All links in the settings menu, now opens a new tab.
- The in-app setting menu got rewritten to vanilla javascript.
- The in-app setting menu also got a facelift. It now looks and feels more like SoundCloud.
- YC will no longer auto scroll on the stream page.
- Various dark mode improvements.

Code slowly being rewritten. Leading up to the huge 3.0 update!

### Version 3.0 ###
- YC menu overhaul, with the addition of the menus "filter" and "about"
- Added the ability to blacklist artists, playlists and tracks (beta).
- Added the ability to import and export YC settings.
- Added the ability to reset all YC settings.
- Added responsive design to Soundcloud.
- Added fullwidth mode, that replace Soundcloud's boxed default layout.
- Added a section/module toggle for the "discover" page.
- Added an option to hide YC branding from the header.
- Updated the mass-unfollower. It now has select/deselect options and an improved checkbox hitbox.
- Made the tag filter non-case sensitive.
- "Add to blacklist" filters are now stored and applied in realtime.
- Display mode switcher, now updates the layout in realtime.
- A new YC menu button has been added in the user navigation menu.
- YC buttons now have the YC logo as icons.
- Various dark mode improvements, mainly icon visibility.
- Various smaller bug fixes.

#### Known bugs: ####
- Google sync issues.
- Issue with comments in grid mode.
- Filtering outside the main stream is inconsistent.
- Scaling issue when changing display mode.

### Version 3.1 ###
- Fullwidth mode cast icon bug.
- Small hotfix.

### Version 3.2 ###
- Fixed darkmode padding issue.
- Optimized files with minified versions.
- Optimized initializing load time for changes. This should fix some of the track wave scaling issues.
- Made a [https://dapperbenji.com/yellowcloud](dedicated website) for YC.

### Version 3.3 ###
- Minor changes to the grid view mode.
- Updated darkmode chromecast icon.
- Hotfix to patch filter bugs.

### Version 3.4 ###
- Updated the YC setting menu to apply changes in real-time, without page refreshes.
- Added option to hide both YC buttons.
- Fixed import feature from last update.
- Fixed grid mode comment bug.
- Fixed mass unfollower feature from last update.
- Various responsive fixes.
- Various darkmode improvements.

### Version 3.5 ###
- Hotfix. Fixed the rendering of YC menu buttons.
- Updated popup icon.
- Updated popup menu.

### Version 3.6 ###
- Fixed "more action" buttons failed rendering.
- SCE is rebranding to YellowCloud (YC).
