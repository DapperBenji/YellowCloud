/* jshint esversion: 6 */
/* jshint browser: true */
/* jshint node: true */
/* jshint -W117 */
/* global chrome */

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(details => {
   if (details.reason == "install") {
      console.log("This is a first install!")
   } else if (details.reason == "update") {
      const thisVersion = parseInt(chrome.runtime.getManifest().version)
      if (thisVersion > 3.3) console.log("XDXXD")
      console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!")
   }
});
