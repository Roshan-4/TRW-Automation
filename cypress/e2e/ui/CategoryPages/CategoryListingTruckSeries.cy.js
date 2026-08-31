const CategoryListing = require('../../../../pages/CategoryPages/CategoryListing');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');
const { registerListingChromeTests } = require('../../../support/listingChromeTests');

const LANGUAGES = CategoryListing.supportedLanguages;

// The main nav's "Truck Series" submenu (under More): Tata Ace, Mahindra
// Blazo, Mahindra Bolero, Ashok Leyland Boss, Ashok Leyland Dost.
// Live-audited: identical underlying component to the Wheelers/Fuel Type/
// GVW/Category/Brand pages — "Check Truck Price" present on every page, no
// "Call Now" widget on any of them. Reuses the same
// pages/CategoryPages/CategoryListing.js page object (added as more
// pageKeys in the shared CategoryListingData.json) rather than a new class,
// since the pattern is identical.
//
// "View All" (/en/commercial-vehicle-series) is deliberately out of scope:
// live-audited as a pure link directory (170+ "Check Offers" buttons, no
// page-level truck listing, no "Check Truck Price" at all) — a
// structurally different page type from the individual series pages, not a
// lead-form page in its own right.
const PAGE_KEYS = ['tataAce', 'mahindraBlazo', 'mahindraBolero', 'ashokLeylandBoss', 'ashokLeylandDost'];

/**
 * Truck series pages — Tata Ace, Mahindra Blazo, Mahindra Bolero, Ashok
 * Leyland Boss, Ashok Leyland Dost (see pages/CategoryPages/CategoryListing.js
 * for the full live-audited CTA findings, shared across all
 * CategoryListing* spec files). Scope for now: only the lead form on each
 * page.
 *
 * Run:
 * - npm run test:categoryListing:truckSeries
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.CATEGORY_PAGES,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

const pageTags = (pageKey) => [`@${pageKey}`];

LANGUAGES.forEach((lang) => {
  PAGE_KEYS.forEach((pageKey) => {
    const page = new CategoryListing(lang, pageKey);
    const pageLabel = page.pageLabel;

    describe(
      `CategoryPages - CategoryListingTruckSeries [${pageKey}] [${lang}] — ${pageLabel}`,
      { tags: [...langTags(lang), ...pageTags(pageKey)] },
      () => {
        beforeEach(() => {
          page.navigate();
        });

        registerRedirectionCheck({
          prefix: 'TSR',
          lang,
          tags: langTags(lang, TEST_TAGS.REDIRECTION, ...pageTags(pageKey)),
          label: `CategoryPages - ${pageLabel}`,
        });

        it(
          `TC-TSR-01: Check Truck Price lead submits successfully on ${pageLabel}`,
          { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-TSR-01',
              title: `Check Truck Price lead submits successfully on ${pageLabel}`,
              language: lang,
              description: `Open the ${pageLabel} page, click a truck card's "Check Truck Price" button to open its lead form, fill name, mobile and city, and submit.`,
              expectedResult: 'A Thank You confirmation is shown after a successful lead submission.',
              steps: [
                `Open the ${pageLabel} page`,
                'Click a truck card\'s "Check Truck Price" button to open its lead form',
                'Fill name, mobile and city',
                'Submit and verify Thank You confirmation',
              ],
            });

            allureStep(`Submit Check Truck Price lead on ${pageLabel}`, () => {
              page.submitCheckTruckPriceLead();
            });
          }
        );

        it(
          `TC-TSR-02: Check Truck Price lead form shows required validation when submitted empty on ${pageLabel}`,
          { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-TSR-02',
              title: `Check Truck Price lead form shows required validation when submitted empty on ${pageLabel}`,
              language: lang,
              description: `Open the ${pageLabel} page, open Check Truck Price, and submit with name, mobile and city all left empty.`,
              expectedResult:
                'The real, page-shown validation messages for name, mobile and location are displayed, and no lead is submitted.',
              steps: [
                `Open the ${pageLabel} page`,
                'Click a truck card\'s "Check Truck Price" button to open its lead form',
                'Leave name, mobile and city empty and submit',
                'Verify all three required-field validation messages are shown',
              ],
            });

            allureStep(`Submit Check Truck Price empty on ${pageLabel} and verify validation`, () => {
              const validation = page.checkOffersLeadCopy.validation;
              page.openCheckOffersLeadViaCta(page.checkTruckPriceCta);
              page.checkOffersLead.fillFields({ name: '', mobile: '', city: '', selectCity: false });
              page.checkOffersLead.submit();
              page.checkOffersLead.verifyValidationMessages([
                validation.nameRequired,
                validation.mobileRequired,
                validation.locationRequired,
              ]);
            });
          }
        );

        it(
          `TC-TSR-03: Check Truck Price lead form rejects mobile that is not 10 digits on ${pageLabel}`,
          { tags: langTags(lang, TEST_TAGS.EDGE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-TSR-03',
              title: `Check Truck Price lead form rejects mobile that is not 10 digits on ${pageLabel}`,
              language: lang,
              description: `Open the ${pageLabel} page, open Check Truck Price, fill a valid name, an invalid (5-digit) mobile number, and leave city empty, then submit.`,
              expectedResult:
                'The real, page-shown mobile-format and location-required validation messages are displayed, and no lead is submitted.',
              steps: [
                `Open the ${pageLabel} page`,
                'Click a truck card\'s "Check Truck Price" button to open its lead form',
                'Fill a valid name and an invalid mobile number',
                'Submit with city left empty',
                'Verify the mobile-format and location validation messages are shown',
              ],
            });

            allureStep(`Submit Check Truck Price with invalid mobile on ${pageLabel} and verify validation`, () => {
              const lead = page.checkOffersLeadCopy;
              const validation = lead.validation;
              page.openCheckOffersLeadViaCta(page.checkTruckPriceCta);
              page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
              page.checkOffersLead.submit();
              page.checkOffersLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
            });
          }
        );

        registerListingChromeTests({
          page,
          pageLabel,
          id: 'TC-TSR-04',
          langTags: langTags(lang, TEST_TAGS.POSITIVE, ...pageTags(pageKey)),
        });
      }
    );
  });
});
