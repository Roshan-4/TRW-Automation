const CategoryListing = require('../../../pages/CategoryPages/CategoryListing');
const { TEST_TAGS } = require('../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../helpers/documentTestCase');
const { ALL_LEAD_LANG, suiteLangTags } = require('./shared');

const pageTags = (pageKey) => [`@${pageKey}`];

/**
 * Category-listing lead forms only — no redirection or listing-chrome tests.
 * Reuses the same TC-*-01..04 bodies as CategoryListing*.cy.js.
 */
function runCategoryListingLeadFormSuite({
  pageKeys,
  tcPrefix,
  areaTags = [TEST_TAGS.CATEGORY_PAGES],
  chunkTag,
}) {
  pageKeys.forEach((pageKey) => {
    const page = new CategoryListing(ALL_LEAD_LANG, pageKey);
    const pageLabel = page.pageLabel;
    const chunkTags = chunkTag ? [chunkTag] : [];

    describe(
      `AllLeadForm - CategoryListing [${pageKey}] [${ALL_LEAD_LANG}] — ${pageLabel}`,
      { tags: [...suiteLangTags(areaTags, ...chunkTags), ...pageTags(pageKey)] },
      () => {
        beforeEach(() => {
          page.navigate();
        });

        it(
          `TC-${tcPrefix}-01: Check Truck Price lead submits successfully on ${pageLabel}`,
          { tags: suiteLangTags(areaTags, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: `TC-${tcPrefix}-01`,
              title: `Check Truck Price lead submits successfully on ${pageLabel}`,
              language: ALL_LEAD_LANG,
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
          `TC-${tcPrefix}-02: Check Truck Price lead form shows required validation when submitted empty on ${pageLabel}`,
          { tags: suiteLangTags(areaTags, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: `TC-${tcPrefix}-02`,
              title: `Check Truck Price lead form shows required validation when submitted empty on ${pageLabel}`,
              language: ALL_LEAD_LANG,
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
          `TC-${tcPrefix}-03: Check Truck Price lead form rejects mobile that is not 10 digits on ${pageLabel}`,
          { tags: suiteLangTags(areaTags, TEST_TAGS.EDGE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: `TC-${tcPrefix}-03`,
              title: `Check Truck Price lead form rejects mobile that is not 10 digits on ${pageLabel}`,
              language: ALL_LEAD_LANG,
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

        it(
          `TC-${tcPrefix}-04: Call Now assistance lead submits successfully on ${pageLabel}`,
          { tags: suiteLangTags(areaTags, TEST_TAGS.POSITIVE, ...pageTags(pageKey)) },
          function () {
            if (!page.hasCallNow) {
              this.skip();
            }

            documentTestCase({
              id: `TC-${tcPrefix}-04`,
              title: `Call Now assistance lead submits successfully on ${pageLabel}`,
              language: ALL_LEAD_LANG,
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
      }
    );
  });
}

module.exports = { runCategoryListingLeadFormSuite };
