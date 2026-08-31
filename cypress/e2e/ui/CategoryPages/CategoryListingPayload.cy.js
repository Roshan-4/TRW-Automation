const CategoryListing = require('../../../../pages/CategoryPages/CategoryListing');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');
const { registerListingChromeTests } = require('../../../support/listingChromeTests');

const LANGUAGES = CategoryListing.supportedLanguages;

// Brand And Tonnage hub links to these seven generic payload-range listing
// pages (Under 1 Ton through 40–300 ton). Live-audited: every page has Check
// Truck Price on truck cards and a Still confused? Call Now widget — same
// underlying component as Fuel Type / GVW category listings.
const PAGE_KEYS = [
  'under1Ton',
  'ton1to2_5',
  'ton2_5to5',
  'ton5to10',
  'ton10to20',
  'ton20to40',
  'ton40to300',
];

/**
 * Payload / tonnage range listing pages linked from Brand And Tonnage.
 * Reuses CategoryListing (see pages/CategoryPages/CategoryListing.js).
 *
 * Run:
 * - npm run test:categoryListing:payload
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.CATEGORY_PAGES,
  TEST_TAGS.PAYLOAD_LISTING,
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
      `CategoryPages - PayloadListing [${pageKey}] [${lang}] — ${pageLabel}`,
      { tags: [...langTags(lang), ...pageTags(pageKey)] },
      () => {
        beforeEach(() => {
          page.navigate();
        });

        registerRedirectionCheck({
          prefix: 'PL',
          lang,
          tags: langTags(lang, TEST_TAGS.REDIRECTION, ...pageTags(pageKey)),
          label: `CategoryPages - ${pageLabel}`,
        });

        it(
          `TC-PL-01: Check Truck Price lead submits successfully on ${pageLabel}`,
          { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-PL-01',
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

        if (lang === 'en') {
          it(
            `TC-PL-02: Check Truck Price lead form shows required validation when submitted empty on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
            () => {
              documentTestCase({
                id: 'TC-PL-02',
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
            `TC-PL-03: Check Truck Price lead form rejects mobile that is not 10 digits on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.EDGE, ...pageTags(pageKey)) },
            () => {
              documentTestCase({
                id: 'TC-PL-03',
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
                page.checkOffersLead.fillFields({
                  name: lead.name,
                  mobile: lead.invalidMobile,
                  city: '',
                  selectCity: false,
                });
                page.checkOffersLead.submit();
                page.checkOffersLead.verifyValidationMessages([
                  validation.mobileInvalid,
                  validation.locationRequired,
                ]);
              });
            }
          );
        }

        it(
          `TC-PL-04: Call Now assistance lead submits successfully on ${pageLabel}`,
          { tags: langTags(lang, TEST_TAGS.POSITIVE, ...pageTags(pageKey)) },
          function () {
            if (!page.hasCallNow) {
              this.skip();
            }

            documentTestCase({
              id: 'TC-PL-04',
              title: `Call Now assistance lead submits successfully on ${pageLabel}`,
              language: lang,
              description: `Open the ${pageLabel} page, click the "Still confused?" widget's Call Now button to open the assistance lead form, fill model, name, mobile and city, and submit.`,
              expectedResult: 'The assistance form closes after a successful submission.',
              steps: [
                `Open the ${pageLabel} page`,
                'Click Call Now to open the assistance lead form',
                'Fill model, name, mobile and city',
                'Submit and verify the assistance form closes',
              ],
            });

            allureStep(`Submit Call Now assistance lead on ${pageLabel}`, () => {
              page.submitCallNowLead();
            });
          }
        );

        registerListingChromeTests({
          page,
          pageLabel,
          id: 'TC-PL-05',
          langTags: langTags(lang, TEST_TAGS.POSITIVE, ...pageTags(pageKey)),
        });
      }
    );
  });
});
