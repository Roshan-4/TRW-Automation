/**
 * Pages included in the daily SEO heading / FAQ snapshot suite.
 * Paths come from existing UI test data — do not invent URLs here.
 */

const listingPages = require('../../testData/ListingPages/NewListingPagesData.json');
const categoryListing = require('../../testData/CategoryPages/CategoryListingData.json');
const electricVehicle = require('../../testData/CategoryPages/ElectricVehicleData.json');
const buses = require('../../testData/Buses/BusListingData.json');
const buyUsed = require('../../testData/UsedTruck/BuyUsedTrucksData.json');
const sellUsed = require('../../testData/UsedTruck/SellUsedTrucksData.json');
const cvPermit = require('../../testData/UsedTruck/CvPermitData.json');
const vehicleReport = require('../../testData/UsedTruck/VehicleReportData.json');
const eChallan = require('../../testData/UsedTruck/EChallanData.json');
const contentPages = require('../../testData/UtilityPages/ContentPageData.json');
const directoryPages = require('../../testData/UtilityPages/DirectoryPageData.json');
const contentDetailPages = require('../../testData/UtilityPages/ContentDetailPageData.json');
const tabbedOffers = require('../../testData/UtilityPages/TabbedModelOffersData.json');
const tyresSeo = require('../../testData/Seo/UtilityPages/TyresSeoContentData.json');
const pdp = require('../../testData/PDP/NewTruckPdpData.json');
const pdpInternal = require('../../testData/PDP/NewTruckInternalPagesData.json');
const busPdp = require('../../testData/Buses/BusPdpData.json');
const usedTruckPdp = require('../../testData/UsedTruck/UsedTruckPdpData.json');
const compare = require('../../testData/Compare/CompareTrucksData.json');
const brochure = require('../../testData/Brochure/BrochureData.json');

const pick = (pages) =>
  pages.map((page) => ({
    key: page.key,
    name: page.name || page.label,
    path: typeof page.path === 'string' ? page.path : page.path.en,
    // Per-page override for a page that isn't localized into every
    // SEO_STRUCTURE_LANGUAGES entry (e.g. one specific article still
    // awaiting a translation) — omit to inherit the group's languages.
    ...(page.languages ? { languages: page.languages } : {}),
  }));

const categoryByKey = Object.fromEntries(
  (categoryListing.CategoryListing.en.pages || []).map((page) => [page.key, page])
);

const keys = (list) => list.map((key) => categoryByKey[key]).filter(Boolean);

const GROUPS = [
  {
    area: 'Homepage',
    group: 'home',
    dataFile: 'testData/Seo/Homepage/SeoStructureData.json',
    pages: [{ key: 'home', name: 'Homepage', path: '/' }],
  },
  {
    area: 'ListingPages',
    group: 'listing',
    dataFile: 'testData/Seo/ListingPages/SeoStructureData.json',
    pages: pick(listingPages.NewListingPages.en.pages),
  },
  {
    area: 'CategoryPages',
    group: 'category',
    dataFile: 'testData/Seo/CategoryPages/SeoStructureData.json',
    pages: pick(
      keys([
        'tippers',
        'trailers',
        'miniTrucks',
        'pickups',
        'transitMixer',
        'autoRickshaw',
        'tempoTraveller',
        'threeWheeler',
      ])
    ),
  },
  {
    area: 'CategoryPages',
    group: 'wheelers',
    dataFile: 'testData/Seo/CategoryPages/SeoStructureData.json',
    pages: pick(
      keys([
        'fourWheeler',
        'sixWheeler',
        'eightWheeler',
        'tenWheeler',
        'twelveWheeler',
        'fourteenWheeler',
        'sixteenWheeler',
        'eighteenWheeler',
        'twentyTwoWheeler',
      ])
    ),
  },
  {
    area: 'CategoryPages',
    group: 'fuelType',
    dataFile: 'testData/Seo/CategoryPages/SeoStructureData.json',
    pages: pick(keys(['diesel', 'petrol', 'cng', 'lpg', 'lng', 'hydrogen', 'biFuel'])),
  },
  {
    area: 'CategoryPages',
    group: 'gvw',
    dataFile: 'testData/Seo/CategoryPages/SeoStructureData.json',
    pages: pick(keys(['lcv', 'hcv', 'scv', 'icv'])),
  },
  {
    area: 'CategoryPages',
    group: 'brands',
    dataFile: 'testData/Seo/CategoryPages/SeoStructureData.json',
    pages: pick(keys(['tataBrand', 'ashokLeylandBrand', 'eicherBrand', 'mahindraBrand'])),
  },
  {
    area: 'CategoryPages',
    group: 'truckSeries',
    dataFile: 'testData/Seo/CategoryPages/SeoStructureData.json',
    pages: pick(
      keys(['tataAce', 'mahindraBlazo', 'mahindraBolero', 'ashokLeylandBoss', 'ashokLeylandDost'])
    ),
  },
  {
    area: 'CategoryPages',
    group: 'payload',
    dataFile: 'testData/Seo/CategoryPages/SeoStructureData.json',
    pages: pick(
      keys([
        'under1Ton',
        'ton1to2_5',
        'ton2_5to5',
        'ton5to10',
        'ton10to20',
        'ton20to40',
        'ton40to300',
      ])
    ),
  },
  {
    area: 'CategoryPages',
    group: 'electricVehicle',
    dataFile: 'testData/Seo/CategoryPages/SeoStructureData.json',
    pages: [
      {
        key: 'electricVehicle',
        name: 'Electric Vehicle',
        path: electricVehicle.ElectricVehicle.en.path,
      },
    ],
  },
  {
    area: 'Buses',
    group: 'buses',
    dataFile: 'testData/Seo/Buses/SeoStructureData.json',
    pages: pick(buses.BusListing.en.pages),
  },
  {
    area: 'UsedTruck',
    group: 'usedTruck',
    dataFile: 'testData/Seo/UsedTruck/SeoStructureData.json',
    pages: [
      {
        key: 'buyUsedTrucks',
        name: buyUsed.BuyUsedTrucks.en.name,
        path: buyUsed.BuyUsedTrucks.en.path,
      },
      {
        key: 'sellUsedTrucks',
        name: sellUsed.SellUsedTrucks.en.name,
        path: sellUsed.SellUsedTrucks.en.path,
      },
      { key: 'cvPermit', name: cvPermit.CvPermit.en.name, path: cvPermit.CvPermit.en.path },
      {
        key: 'vehicleReport',
        name: vehicleReport.VehicleReport.en.name,
        path: vehicleReport.VehicleReport.en.path,
      },
      { key: 'eChallan', name: eChallan.EChallan.en.name, path: eChallan.EChallan.en.path },
    ],
  },
  {
    area: 'UtilityPages',
    group: 'content',
    dataFile: 'testData/Seo/UtilityPages/ContentSeoStructureData.json',
    pages: pick(contentPages.ContentPage.en.pages),
  },
  {
    area: 'UtilityPages',
    group: 'directory',
    dataFile: 'testData/Seo/UtilityPages/DirectorySeoStructureData.json',
    pages: pick(directoryPages.DirectoryPage.en.pages),
  },
  {
    area: 'UtilityPages',
    group: 'contentDetail',
    dataFile: 'testData/Seo/UtilityPages/ContentDetailSeoStructureData.json',
    pages: pick(contentDetailPages.ContentDetailPage.en.pages),
  },
  {
    area: 'UtilityPages',
    group: 'offers',
    dataFile: 'testData/Seo/UtilityPages/OffersSeoStructureData.json',
    pages: [
      ...pick(tabbedOffers.TabbedModelOffers.en.pages),
      { key: 'bodyMakers', name: 'Body Makers', path: '/en/body-makers' },
    ],
  },
  {
    area: 'UtilityPages',
    group: 'tyresHub',
    dataFile: 'testData/Seo/UtilityPages/TyresSeoStructureData.json',
    // en only: /hi and /ta tyre URLs have never resolved (404 since this
    // suite's first commit) — the Tyres section has no hi/ta translation.
    languages: ['en'],
    pages: pick(
      tyresSeo.TyresSeoContent.en.pages.filter((page) => ['tyres', 'latestTruckTyres'].includes(page.key))
    ),
  },
  {
    area: 'UtilityPages',
    group: 'tyresBrands',
    dataFile: 'testData/Seo/UtilityPages/TyresSeoStructureData.json',
    // en only — see tyresHub above.
    languages: ['en'],
    pages: pick(
      tyresSeo.TyresSeoContent.en.pages.filter(
        (page) => !['tyres', 'latestTruckTyres', 'continentalHdw2'].includes(page.key)
      )
    ),
  },
  {
    area: 'UtilityPages',
    group: 'tyresPdp',
    dataFile: 'testData/Seo/UtilityPages/TyresSeoStructureData.json',
    // en only — see tyresHub above.
    languages: ['en'],
    pages: pick(tyresSeo.TyresSeoContent.en.pages.filter((page) => page.key === 'continentalHdw2')),
  },
  {
    area: 'PDP',
    group: 'pdp',
    dataFile: 'testData/Seo/PDP/SeoStructureData.json',
    pages: [
      {
        key: pdp.products.mostPopular.key,
        name: pdp.products.mostPopular.label,
        path: pdp.products.mostPopular.path.en,
      },
      {
        key: pdp.products.leastPopular.key,
        name: pdp.products.leastPopular.label,
        path: pdp.products.leastPopular.path.en,
      },
    ],
  },
  {
    area: 'PDP',
    group: 'pdpInternalPrice',
    dataFile: 'testData/Seo/PDP/InternalSeoStructureData.json',
    pages: pick(
      pdpInternal.NewTruckInternalPages.en.pages.filter((page) =>
        ['yodhaPriceGurgaon', 'ekaPriceMumbai'].includes(page.key)
      )
    ),
  },
  {
    area: 'PDP',
    group: 'pdpInternalSpecMileage',
    dataFile: 'testData/Seo/PDP/InternalSeoStructureData.json',
    pages: pick(
      pdpInternal.NewTruckInternalPages.en.pages.filter((page) =>
        ['yodhaSpecifications', 'yodhaMileage'].includes(page.key)
      )
    ),
  },
  {
    area: 'PDP',
    group: 'pdpInternalMedia',
    dataFile: 'testData/Seo/PDP/InternalSeoStructureData.json',
    pages: pick(
      pdpInternal.NewTruckInternalPages.en.pages.filter((page) =>
        ['yodhaImages', 'yodhaBrochure', 'yodhaVideos'].includes(page.key)
      )
    ),
  },
  {
    area: 'PDP',
    group: 'pdpInternalReviews',
    dataFile: 'testData/Seo/PDP/InternalSeoStructureData.json',
    pages: pick(
      pdpInternal.NewTruckInternalPages.en.pages.filter((page) =>
        ['yodhaReview', 'ekaReview'].includes(page.key)
      )
    ),
  },
  {
    area: 'Buses',
    group: 'busPdp',
    dataFile: 'testData/Seo/Buses/BusPdpSeoStructureData.json',
    pages: pick(busPdp.BusPdp.en.pages),
  },
  {
    area: 'UsedTruck',
    group: 'usedTruckPdp',
    dataFile: 'testData/Seo/UsedTruck/UsedTruckPdpSeoStructureData.json',
    pages: [
      {
        key: 'usedTruckPdp',
        name: usedTruckPdp.UsedTruckPdp.en.seoSampleName,
        path: usedTruckPdp.UsedTruckPdp.en.seoSamplePath,
      },
    ],
  },
  {
    area: 'Compare',
    group: 'compare',
    dataFile: 'testData/Seo/Compare/SeoStructureData.json',
    pages: [{ key: 'compareTrucks', name: 'Compare Trucks', path: compare.CompareTrucks.en.path }],
  },
  {
    area: 'Brochure',
    group: 'brochure',
    dataFile: 'testData/Seo/Brochure/SeoStructureData.json',
    pages: [{ key: 'brochure', name: 'Brochure', path: brochure.Brochure.en.path }],
  },
];

const SEO_STRUCTURE_LANGUAGES = ['en', 'hi', 'ta'];

/**
 * Localized route for a stored English path.
 * Homepage: `/` → `/hi`, `/ta`. Listing-style `/en/...` → `/hi/...`.
 * `/web-stories` has no language prefix (it 404s with `/en/`).
 */
const pathForLang = (enPath, lang) => {
  if (lang === 'en') {
    return enPath;
  }
  if (!enPath || enPath === '/') {
    return `/${lang}`;
  }
  if (enPath === '/web-stories' || !enPath.startsWith('/en')) {
    return enPath;
  }
  return `/${lang}${enPath.slice(3)}`;
};

const resolveSnapshot = (raw, lang) => {
  if (!raw) {
    return null;
  }
  if (raw.byLanguage && raw.byLanguage[lang]) {
    return {
      key: raw.key,
      name: raw.name,
      lang,
      ...raw.byLanguage[lang],
    };
  }
  if (lang === 'en' && raw.path) {
    return { ...raw, lang };
  }
  return null;
};

const uniquePages = () => {
  const seen = new Set();
  const pages = [];
  GROUPS.forEach((group) => {
    group.pages.forEach((page) => {
      const id = `${group.dataFile}::${page.key}`;
      if (seen.has(id)) {
        return;
      }
      seen.add(id);
      pages.push({
        ...page,
        area: group.area,
        group: group.group,
        dataFile: group.dataFile,
        languages: page.languages || group.languages || SEO_STRUCTURE_LANGUAGES,
      });
    });
  });
  return pages;
};

const getGroup = (groupId) => GROUPS.find((group) => group.group === groupId);

/** Languages a given group's suite should run — defaults to all when unset. */
const languagesForGroup = (group) => group.languages || SEO_STRUCTURE_LANGUAGES;

/** Languages a given page within a group should run — page overrides group overrides all. */
const languagesForPage = (page, group) =>
  page.languages || group.languages || SEO_STRUCTURE_LANGUAGES;

module.exports = {
  GROUPS,
  uniquePages,
  getGroup,
  SEO_STRUCTURE_LANGUAGES,
  pathForLang,
  resolveSnapshot,
  languagesForGroup,
  languagesForPage,
};
