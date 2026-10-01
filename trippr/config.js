// Trippr runs entirely in the browser; nothing here is required.
// apiUrl: leave empty unless you deploy the optional backend in backend/worker.ts.
// publicKeys: optional free API keys for providers that allow browser calls. Anyone can see
// them in the page source, so only use free, rate-limited keys and restrict them to
// safisolutions.org where the provider offers that. Never put a paid or private key here.
window.TRIPPR_CONFIG = {
  apiUrl: "",
  rasterTiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  publicKeys: {
    NPS_API_KEY: "FRgoUGbaY8TbRYkz9BXff6dcoil1pipiVd3ZHmfC", // Live park alerts, campgrounds, visitor centers: https://www.nps.gov/subjects/developer/get-started.htm
    NREL_API_KEY: "",             // Federal EV charger directory: https://developer.nrel.gov/signup/
    AIRNOW_API_KEY: "",           // Observed (not modeled) air quality: https://docs.airnowapi.org/account/request/
    RIDB_API_KEY: "",             // Recreation.gov campgrounds: https://ridb.recreation.gov/profile
    GEOAPIFY_API_KEY: "",         // Alternative address search; restrict to your domain: https://myprojects.geoapify.com/
    OPENROUTESERVICE_API_KEY: "", // Alternative routing (2,000 routes/day free): https://openrouteservice.org/dev/#/signup
  },
};
