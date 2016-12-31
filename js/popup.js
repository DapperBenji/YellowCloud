function skipSong() {
   document.getElementsByClassName("skipControl__next")[0].click();
}
function skipSongReverse() {
   document.getElementsByClassName("skipControl__previous")[0].click();
}
var previousbutton = document.getElementById('prev');
previousbutton.addEventListener('click', function(e) {
   skipSongReverse();
});

window.addEventListener('DOMContentLoaded', function () {
  // ...query for the active tab...
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {
    // ...and send a request for the DOM info...
    chrome.tabs.sendMessage(
        tabs[0].id,
        {from: 'popup', subject: 'DOMInfo'},
        // ...also specifying a callback to be called
        //    from the receiving end (content script)
        setDOMInfo);
  });
});
