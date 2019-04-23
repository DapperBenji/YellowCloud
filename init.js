const vendorScript = document.createElement('script'),
      appScript = document.createElement('script');
vendorScript.src = chrome.extension.getURL('assets/js/insignia.min.js');
appScript.src = chrome.extension.getURL('assets/js/main.js');
(document.head||document.documentElement).appendChild(vendorScript);
(document.head||document.documentElement).appendChild(appScript);
vendorScript.onload = ()=> {
    vendorScript.parentNode.removeChild(vendorScript);
};
appScript.onload = ()=> {
    appScript.parentNode.removeChild(appScript);
};
