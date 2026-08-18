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

// Tags consumed by @cypress/grep. Language tags (@en/@hi/@ta) let a single
// language, or all languages (@language), be run in isolation.
const TEST_TAGS = {
  SMOKE: '@smoke',
  REGRESSION: '@regression',
  UI: '@ui',
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
  SEO: '@seo',
  HOME_PAGE_SEO_CONTENT: '@homePageSeoContent',
  LANGUAGE: '@language',
  EN: '@en',
  HI: '@hi',
  TA: '@ta',
};

module.exports = {
  TIMEOUTS,
  VIEWPORT_SIZES,
  TEST_TAGS,
};
