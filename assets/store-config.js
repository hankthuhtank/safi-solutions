/* SafiSolutions store settings.
   Checkout URLs and prices live here.
   Day-to-day launch controls live in /LAUNCH_SWITCH.js. */
const SAFI_LAUNCH_SETTINGS = window.SAFI_LAUNCH || {};
window.SAFI_STORE = {
  salesEnabled: SAFI_LAUNCH_SETTINGS.salesEnabled === true,
  launchMode: SAFI_LAUNCH_SETTINGS.launchPricing !== false,
  products: {
    padeff: { regularPrice: 39, launchPrice: 29, launchUrl: "https://buy.stripe.com/dRm8wQd2WgFi67L0qidAk00", regularUrl: "https://buy.stripe.com/7sY00k7ICdt6bs57SKdAk07" },
    piktoor: { regularPrice: 39, launchPrice: 29, launchUrl: "https://buy.stripe.com/aFa4gA4wq74I9jXflcdAk01", regularUrl: "https://buy.stripe.com/7sY28s0gaexa7bP2yqdAk08" },
    kwezeen: { regularPrice: 39, launchPrice: 29, launchUrl: "https://buy.stripe.com/3cI7sMbYS74IfIl8WOdAk02", regularUrl: "https://buy.stripe.com/9B6bJ2gf8gFi0Nra0SdAk09" },
    doqcorp: { regularPrice: 39, launchPrice: 29, launchUrl: "https://buy.stripe.com/fZu6oIbYS2OsdAd1umdAk03", regularUrl: "https://buy.stripe.com/7sY4gA2oiexa53Heh8dAk0a" },
    brandur: { regularPrice: 39, launchPrice: 29, launchUrl: "https://buy.stripe.com/9B68wQbYSdt6dAdb4WdAk04", regularUrl: "https://buy.stripe.com/6oUbJ26Ey88M9jXeh8dAk0b" },
    doqdesk: { regularPrice: 39, launchPrice: 29, launchUrl: "https://buy.stripe.com/dRmbJ25AugFieEh7SKdAk0y", regularUrl: "https://buy.stripe.com/dRm9AU4wqbkY67L7SKdAk0z" },
    "bundle-5": { regularPrice: 149, launchPrice: 99, launchUrl: "https://buy.stripe.com/bJe3cw3smbkY0Nreh8dAk06", regularUrl: "https://buy.stripe.com/eVq14o7IC2OseEheh8dAk0d" }
  },
  bundle3: {
    regularPrice: 100,
    launchPrice: 79,
    combinations: {
      ppk: { apps: ["padeff","piktoor","kwezeen"], launchUrl: "https://buy.stripe.com/eVq14oe704WAdAdeh8dAk0e", regularUrl: "https://buy.stripe.com/eVq28sgf89cQeEhc90dAk0o" },
      ppd: { apps: ["padeff","piktoor","doqcorp"], launchUrl: "https://buy.stripe.com/6oUfZigf81Ko0Nr2yqdAk0f", regularUrl: "https://buy.stripe.com/dRmbJ22oidt667L6OGdAk0p" },
      ppb: { apps: ["padeff","piktoor","brandur"], launchUrl: "https://buy.stripe.com/7sYfZi6Ey3Sw8fTdd4dAk0g", regularUrl: "https://buy.stripe.com/dRm6oIfb460Eao15KCdAk0q" },
      pkd: { apps: ["padeff","kwezeen","doqcorp"], launchUrl: "https://buy.stripe.com/eVq4gAfb43Sw1Rv1umdAk0h", regularUrl: "https://buy.stripe.com/28EeVeaUO1Ko9jXdd4dAk0r" },
      pkb: { apps: ["padeff","kwezeen","brandur"], launchUrl: "https://buy.stripe.com/3cI6oIfb4cp2fIlgpgdAk0i", regularUrl: "https://buy.stripe.com/6oU28saUO4WAao18WOdAk0s" },
      pdb: { apps: ["padeff","doqcorp","brandur"], launchUrl: "https://buy.stripe.com/6oU9AUgf84WAfIla0SdAk0j", regularUrl: "https://buy.stripe.com/7sYbJ26Ey4WAao15KCdAk0t" },
      ikd: { apps: ["piktoor","kwezeen","doqcorp"], launchUrl: "https://buy.stripe.com/4gM00kgf89cQao18WOdAk0k", regularUrl: "https://buy.stripe.com/28E28s6EygFifIl0qidAk0u" },
      ikb: { apps: ["piktoor","kwezeen","brandur"], launchUrl: "https://buy.stripe.com/3cI8wQfb42Os9jX4GydAk0l", regularUrl: "https://buy.stripe.com/eVqcN6gf8dt6dAd8WOdAk0v" },
      idb: { apps: ["piktoor","doqcorp","brandur"], launchUrl: "https://buy.stripe.com/5kQ00k7IC0Gk53Heh8dAk0m", regularUrl: "https://buy.stripe.com/aFa3cw2oi1Kobs5b4WdAk0w" },
      kdb: { apps: ["kwezeen","doqcorp","brandur"], launchUrl: "https://buy.stripe.com/7sY7sM9QK1Kocw94GydAk0n", regularUrl: "https://buy.stripe.com/28E7sM9QK1Ko67La0SdAk0x" }
    }
  }
};
