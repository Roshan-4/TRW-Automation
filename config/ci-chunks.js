/**
 * Cypress CI chunk definitions — each chunk is one fresh browser session
 * targeting GitHub Actions' 6-hour job limit. Used by scripts/run-ci-chunk.js
 * and .github/workflows/cypress.yml matrix.
 */
module.exports = {
  ui: [
    {
      id: 'ui-homepage',
      label: 'UI — Homepage',
      specs: ['cypress/e2e/ui/Homepage/**/*.cy.js'],
    },
    {
      id: 'ui-pdp',
      label: 'UI — PDP',
      specs: ['cypress/e2e/ui/PDP/**/*.cy.js'],
    },
    {
      id: 'ui-listing',
      label: 'UI — Listing, Brochure, Compare',
      specs: [
        'cypress/e2e/ui/ListingPages/**/*.cy.js',
        'cypress/e2e/ui/Brochure/**/*.cy.js',
        'cypress/e2e/ui/Compare/**/*.cy.js',
      ],
    },
    {
      id: 'ui-category-a',
      label: 'UI — Category (Category + Wheelers + Electric)',
      specs: [
        'cypress/e2e/ui/CategoryPages/CategoryListingCategory.cy.js',
        'cypress/e2e/ui/CategoryPages/CategoryListingWheelers.cy.js',
        'cypress/e2e/ui/CategoryPages/ElectricVehicle.cy.js',
      ],
    },
    {
      id: 'ui-category-b',
      label: 'UI — Category (Fuel + GVW + Brands + Series + Payload)',
      specs: [
        'cypress/e2e/ui/CategoryPages/CategoryListingFuelType.cy.js',
        'cypress/e2e/ui/CategoryPages/CategoryListingGvw.cy.js',
        'cypress/e2e/ui/CategoryPages/CategoryListingBrands.cy.js',
        'cypress/e2e/ui/CategoryPages/CategoryListingTruckSeries.cy.js',
        'cypress/e2e/ui/CategoryPages/CategoryListingPayload.cy.js',
      ],
    },
    {
      id: 'ui-used-buses',
      label: 'UI — Used Truck + Buses',
      specs: ['cypress/e2e/ui/UsedTruck/**/*.cy.js', 'cypress/e2e/ui/Buses/**/*.cy.js'],
    },
    {
      id: 'ui-utility',
      label: 'UI — Utility pages',
      specs: ['cypress/e2e/ui/UtilityPages/**/*.cy.js'],
    },
    {
      id: 'ui-lead-suite',
      label: 'UI — All lead form suite',
      specs: ['cypress/e2e/ui/AllLeadformsuite.cy.js'],
    },
    {
      id: 'ui-login',
      label: 'UI — Login',
      specs: ['cypress/e2e/ui/Login/**/*.cy.js'],
    },
  ],
  seo: [
    {
      id: 'seo-home-listing',
      label: 'SEO — Homepage + Listing',
      specs: [
        'cypress/e2e/seo/Homepage/**/*.cy.js',
        'cypress/e2e/seo/ListingPages/**/*.cy.js',
      ],
    },
    {
      id: 'seo-category-a',
      label: 'SEO — Category + Wheelers + Fuel',
      specs: [
        'cypress/e2e/seo/CategoryPages/SeoStructureCategory.cy.js',
        'cypress/e2e/seo/CategoryPages/SeoStructureWheelers.cy.js',
        'cypress/e2e/seo/CategoryPages/SeoStructureFuelType.cy.js',
      ],
    },
    {
      id: 'seo-category-b',
      label: 'SEO — GVW + Brands + Series + Payload + Electric',
      specs: [
        'cypress/e2e/seo/CategoryPages/SeoStructureGvw.cy.js',
        'cypress/e2e/seo/CategoryPages/SeoStructureBrands.cy.js',
        'cypress/e2e/seo/CategoryPages/SeoStructureTruckSeries.cy.js',
        'cypress/e2e/seo/CategoryPages/SeoStructurePayload.cy.js',
        'cypress/e2e/seo/CategoryPages/SeoStructureElectricVehicle.cy.js',
      ],
    },
    {
      id: 'seo-pdp-buses',
      label: 'SEO — PDP + Buses',
      specs: [
        'cypress/e2e/seo/PDP/**/*.cy.js',
        'cypress/e2e/seo/Buses/**/*.cy.js',
      ],
    },
    {
      id: 'seo-used',
      label: 'SEO — Used Truck',
      specs: ['cypress/e2e/seo/UsedTruck/**/*.cy.js'],
    },
    {
      id: 'seo-utility',
      label: 'SEO — Utility + Compare + Brochure + Tyres SEO',
      specs: [
        'cypress/e2e/seo/UtilityPages/**/*.cy.js',
        'cypress/e2e/seo/Compare/**/*.cy.js',
        'cypress/e2e/seo/Brochure/**/*.cy.js',
      ],
    },
  ],
};
