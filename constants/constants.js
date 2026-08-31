const TIMEOUTS = {
  DEFAULT_COMMAND: 15000,
  PAGE_LOAD: 60000,
  ELEMENT_VISIBLE: 10000,
};

const VIEWPORT_SIZES = {
  DESKTOP: { width: 1366, height: 768 },
  TABLET: { width: 768, height: 1024 },
  MOBILE: { width: 375, height: 667 },
};

// Real device emulation (not viewport-only): a viewport resize alone does not
// trigger server-side or navigator.userAgent-based device branching on this
// site. `DEVICE=mobile` (see cypress.config.js) sets both a real Android
// Chrome user agent AND a matching mobile viewport together.
const DEVICES = {
  desktop: {
    key: 'desktop',
    userAgent: null, // real browser UA, unchanged
    viewport: VIEWPORT_SIZES.DESKTOP,
  },
  mobile: {
    key: 'mobile',
    // Real Android Chrome UA (Pixel-class phone, Chrome 125) — not a
    // synthetic/desktop-with-"Mobile"-appended string.
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    viewport: { width: 412, height: 915 }, // Pixel 8 Pro CSS viewport
  },
};

// Tags consumed by @cypress/grep. Language tags (@en/@hi/@ta) let a single
// language, or all languages (@language), be run in isolation.
const TEST_TAGS = {
  SMOKE: '@smoke',
  REGRESSION: '@regression',
  UI: '@ui',
  REDIRECTION: '@redirection',
  POSITIVE: '@positive',
  NEGATIVE: '@negative',
  EDGE: '@edge',
  HOMEPAGE: '@homepage',
  SEARCH_RIGHT_TRUCK: '@searchRightTruck',
  TRUCK_IN_INDIA: '@truckInIndia',
  POPULAR_TRUCK_BRANDS: '@popularTruckBrands',
  ELECTRIC_COMMERCIAL_VEHICLES: '@electricCommercialVehicles',
  LATEST_MODELS_BY_CATEGORY: '@latestModelsByCategory',
  POPULAR_SECOND_HAND_TRUCK: '@popularSecondHandTruck',
  POPULAR_TRUCK_COMPARISON: '@popularTruckComparison',
  THE_BUZZ_BOARD: '@theBuzzBoard',
  LATEST_TRUCK_UPDATES: '@latestTruckUpdates',
  FIND_RELIABLE_USED_TRUCKS: '@findReliableUsedTrucks',
  PDP: '@pdp',
  NEW_TRUCK_PDP: '@newTruckPdp',
  NEW_TRUCK_INTERNAL: '@newTruckInternal',
  BUS_PDP: '@busPdp',
  USED_TRUCK_PDP: '@usedTruckPdp',
  LISTING_PAGES: '@listingPages',
  NEW_LISTING_PAGES: '@newListingPages',
  SEO: '@seo',
  SEO_STRUCTURE: '@seoStructure',
  HOME_PAGE_SEO_CONTENT: '@homePageSeoContent',
  LANGUAGE: '@language',
  EN: '@en',
  HI: '@hi',
  TA: '@ta',
  COMPARE_TRUCKS: '@compareTrucks',
  BROCHURE: '@brochure',
  USED_TRUCK: '@usedTruck',
  BUY_USED_TRUCKS: '@buyUsedTrucks',
  CV_PERMIT: '@cvPermit',
  VEHICLE_REPORT: '@vehicleReport',
  E_CHALLAN: '@eChallan',
  SELL_USED_TRUCKS: '@sellUsedTrucks',
  CATEGORY_PAGES: '@categoryPages',
  BUSES: '@buses',
  UTILITY_PAGES: '@utilityPages',
  DIRECTORY_PAGES: '@directoryPages',
  PAYLOAD_LISTING: '@payloadListing',
  CONTENT_DETAIL: '@contentDetail',
  CONTACT_US: '@contactUs',
  TYRES_SEO: '@tyresSeo',
  TYRES_LISTING: '@tyresListing',
  LOGIN: '@login',
  ELECTRIC_VEHICLE: '@electricVehicle',
  DEVICE: '@device',
  DESKTOP: '@desktop',
  MOBILE: '@mobile',
};

module.exports = {
  TIMEOUTS,
  VIEWPORT_SIZES,
  DEVICES,
  TEST_TAGS,
};
