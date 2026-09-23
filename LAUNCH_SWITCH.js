/* SafiSolutions storefront control — 4 free tools + 2 paid apps. */
window.SAFI_STORE_CONTROL = {
  salesEnabled: false,
  pricingMode: "launch",
  checkoutWorker: "https://safisolutions-downloads.safisolutions.workers.dev",
  freeDownloadsEnabled: false,
  freeDownloadWorker: "https://safisolutions-downloads.safisolutions.workers.dev",
  products: {
    padeff:  { label:"Padeff",  free:true,  version:"1.0", filePath:"padeff/Padeff 1.0.zip" },
    piktoor: { label:"Piktoor", free:true,  version:"1.0", filePath:"piktoor/Piktoor 1.0.zip" },
    kwezeen: { label:"Kwezeen", free:false, launchPrice:29, regularPrice:39, version:"1.0", filePath:"kwezeen/Kwezeen 1.0.zip" },
    doqcorp: { label:"DoqCorp", free:false, launchPrice:29, regularPrice:39, version:"1.0", filePath:"doqcorp/DoqCorp 1.0.zip" },
    brandur: { label:"Brandur", free:true,  version:"1.0", filePath:"brandur/Brandur 1.0.zip" },
    doqdesk: { label:"DoqDesk", free:true,  version:"1.0", filePath:"doqdesk/DoqDesk 1.0.zip" }
  }
};
