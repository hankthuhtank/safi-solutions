/* SafiSolutions storefront control — 4 free tools + 2 paid apps. */
window.SAFI_STORE_CONTROL = {
  salesEnabled: true,
  pricingMode: "launch",
  checkoutWorker: "https://safisolutions-downloads.safisolutions.workers.dev",
  freeDownloadsEnabled: true,
  freeDownloadWorker: "https://safisolutions-downloads.safisolutions.workers.dev",
  products: {
    padeff:  { label:"Padeff",  free:true,  version:"1.0", filePath:"padeff/Padeff.exe" },
    piktoor: { label:"Piktoor", free:true,  version:"1.0", filePath:"piktoor/Piktoor.exe" },
    kwezeen: { label:"Kwezeen", free:false, launchPrice:29, regularPrice:39, version:"1.0", filePath:"kwezeen/Kwezeen.exe" },
    doqcorp: { label:"DoqCorp", free:false, launchPrice:29, regularPrice:39, version:"1.0", filePath:"doqcorp/DoqCorp.exe" },
    brandur: { label:"Brandur", free:true,  version:"1.0", filePath:"brandur/Brandur.exe" },
    doqdesk: { label:"DoqDesk", free:true,  version:"1.0", filePath:"doqdesk/DoqDesk.exe" }
  }
};
