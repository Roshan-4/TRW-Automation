const NewListingPages = require('../../pages/ListingPages/NewListingPages');
const { TEST_TAGS } = require('../../constants/constants');
const { documentTestCase, allureStep } = require('../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../helpers/deviceTags');

const LANGUAGES = NewListingPages.supportedLanguages;

const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.LISTING_PAGES,
  TEST_TAGS.NEW_LISTING_PAGES,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

const pageTags = (pageKey) => [`@${pageKey}`];

const LEAD_FORM_TC_NUMBERS = {
  checkOffers: '01',
  checkTruckPrice: '02',
  contactSeller: '03',
  notifyMe: '04',
  getOffers: '05',
};

/**
 * Shared test body for New Listing Pages, factored out so each of the 6
 * pages runs as its own spec file instead of one file covering all 6.
 * Running multiple pages' full suites back-to-back in a single Cypress
 * session hit the same cumulative session-length degradation documented for
 * CategoryListing (golden rule 22) — confirmed live: even a single page's
 * ~7 tests intermittently ran past 5 minutes and got killed by the harness,
 * and a live spot-check outside Cypress showed the underlying CTA
 * click/modal mechanism working correctly in isolation, ruling out a real
 * site bug. Each spec file (cypress/e2e/ui/ListingPages/BestTrucks.cy.js,
 * PopularTruck.cy.js, FindNewTrucks.cy.js, UpcomingTrucks.cy.js,
 * LatestTrucks.cy.js, Bs6Trucks.cy.js) calls this with its own single page
 * key, each a fresh Cypress session.
 */
function runNewListingPagesSuite(pageKeys) {
  LANGUAGES.forEach((lang) => {
    pageKeys.forEach((pageKey) => {
      const page = new NewListingPages(lang, pageKey);
      const pageLabel = page.pageLabel;

      describe(
        `ListingPages - NewListingPages [${pageKey}] [${lang}] — ${pageLabel}`,
        { tags: [...langTags(lang), ...pageTags(pageKey)] },
        () => {
          beforeEach(() => {
            page.navigate();
          });

          registerRedirectionCheck({
            prefix: 'NLP',
            lang,
            tags: langTags(lang, TEST_TAGS.REDIRECTION, ...pageTags(pageKey)),
            label: `ListingPages - ${pageLabel}`,
          });

          NewListingPages.leadFormSlots.forEach((slot) => {
            const tcNumber = LEAD_FORM_TC_NUMBERS[slot.key];

            it(
              `TC-NLP-${tcNumber}: ${slot.cta} lead submits successfully on ${pageLabel}`,
              {
                tags: langTags(
                  lang,
                  TEST_TAGS.POSITIVE,
                  ...(slot.key === 'checkOffers' ? [TEST_TAGS.SMOKE] : []),
                  ...pageTags(pageKey)
                ),
              },
              function () {
                if (!page.hasLeadForm(slot.key)) {
                  this.skip();
                }

                documentTestCase({
                  id: `TC-NLP-${tcNumber}`,
                  title: `${slot.cta} lead submits successfully on ${pageLabel}`,
                  language: lang,
                  description: `Open the ${pageLabel} listing page, click ${slot.cta} to open its lead form, fill name, mobile and city, and submit.`,
                  expectedResult:
                    slot.formType === 'getOffers'
                      ? 'The assistance lead form closes after a successful submission (verified via the real submit network call). The submitted name is tagged with a page/CTA identifier for CRM traceability.'
                      : slot.formType === 'getSellerDetails'
                        ? 'A “Thank You For Contact” confirmation is shown after a successful Contact Seller submission.'
                        : 'A Thank You confirmation is shown after a successful lead submission. The submitted name is tagged with a page/CTA identifier for CRM traceability.',
                  steps: [
                    `Open the ${pageLabel} listing page`,
                    `Click ${slot.cta} to open its lead form`,
                    'Fill name, mobile and city',
                    'Submit and verify the confirmation',
                  ],
                });

                allureStep(`Submit ${slot.cta} lead on ${pageLabel}`, () => {
                  page.submitLeadForm(slot.key);
                });
              }
            );
          });

          it(
            `TC-NLP-06: Check Offers lead form shows required validation when submitted empty on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
            function () {
              if (!page.hasLeadForm('checkOffers')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NLP-06',
                title: `Check Offers lead form shows required validation when submitted empty on ${pageLabel}`,
                language: lang,
                description: `Open the ${pageLabel} listing page, open Check Offers, and submit with name, mobile and city all left empty.`,
                expectedResult:
                  'The real, page-shown validation messages for name, mobile and location are displayed, and no lead is submitted.',
                steps: [
                  `Open the ${pageLabel} listing page`,
                  'Click Check Offers to open its lead form',
                  'Leave name, mobile and city empty and submit',
                  'Verify all three required-field validation messages are shown',
                ],
              });

              allureStep(`Submit Check Offers empty on ${pageLabel} and verify validation`, () => {
                const validation = page.checkOffersLeadCopy.validation;
                page.openCheckOffersLeadViaCta('Check Offers');
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
            `TC-NLP-07: Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.EDGE, ...pageTags(pageKey)) },
            function () {
              if (!page.hasLeadForm('checkOffers')) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NLP-07',
                title: `Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`,
                language: lang,
                description: `Open the ${pageLabel} listing page, open Check Offers, fill a valid name, an invalid (5-digit) mobile number, and leave city empty, then submit.`,
                expectedResult:
                  'The real, page-shown mobile-format and location-required validation messages are displayed, and no lead is submitted.',
                steps: [
                  `Open the ${pageLabel} listing page`,
                  'Click Check Offers to open its lead form',
                  'Fill a valid name and an invalid mobile number',
                  'Submit with city left empty',
                  'Verify the mobile-format and location validation messages are shown',
                ],
              });

                allureStep(`Submit Check Offers with invalid mobile on ${pageLabel} and verify validation`, () => {
                const lead = page.checkOffersLeadCopy;
                const validation = lead.validation;
                page.openCheckOffersLeadViaCta('Check Offers');
                page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
                page.checkOffersLead.submit();
                page.checkOffersLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
              });
            }
          );

          it(
            `TC-NLP-08: page heading is visible on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
            () => {
              documentTestCase({
                id: 'TC-NLP-08',
                title: `page heading is visible on ${pageLabel}`,
                language: lang,
                description: `Open the ${pageLabel} listing page and confirm the main page heading the user sees.`,
                expectedResult: `The heading “${page.heading}” is visible.`,
                steps: [`Open the ${pageLabel} listing page`, 'Verify the page heading'],
              });

              allureStep(`Verify ${pageLabel} page heading`, () => {
                page.verifyPageHeading();
              });
            }
          );

          it(
            `TC-NLP-09: SecondaryNavbar jump links on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...pageTags(pageKey)) },
            function () {
              if (!page.hasSecondaryNav()) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NLP-09',
                title: `SecondaryNavbar jump links on ${pageLabel}`,
                language: lang,
                description: `Confirm the sticky SecondaryNavbar on ${pageLabel} shows every expected in-page jump link, then use FAQs to jump to Frequently Asked Questions.`,
                expectedResult: 'SecondaryNavbar items are visible and FAQs jumps to the FAQ heading.',
                steps: [
                  `Open the ${pageLabel} listing page`,
                  'Verify SecondaryNavbar items',
                  'Click FAQs',
                  'Verify the FAQ heading is shown',
                ],
              });

              allureStep(`Verify SecondaryNavbar on ${pageLabel}`, () => {
                page.verifyListingSecondaryNavbar();
                page.clickListingSecondaryNav('FAQs');
                if (page.hasFaq()) {
                  page.verifyFaqHeading();
                }
              });
            }
          );

          it(
            `TC-NLP-10: truck listing, filters and cards on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
            () => {
              documentTestCase({
                id: 'TC-NLP-10',
                title: `truck listing, filters and cards on ${pageLabel}`,
                language: lang,
                description: `Confirm the truck listing block on ${pageLabel} shows a count heading, the Filter By row, and at least one truck card CTA.`,
                expectedResult:
                  'Listing heading with a count, Filter By / Reset All / Apply Filter, and at least one card button are visible.',
                steps: [
                  `Open the ${pageLabel} listing page`,
                  'Verify the listing heading',
                  'Verify Filter By controls',
                  `Verify at least one “${page.page.cardCta}” card button`,
                ],
              });

              allureStep(`Verify truck listing and filters on ${pageLabel}`, () => {
                page.verifyTruckListingAndFilters();
              });
            }
          );

          it(
            `TC-NLP-11: FAQ question expands on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.EDGE, ...pageTags(pageKey)) },
            function () {
              if (!page.hasFaq()) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NLP-11',
                title: `FAQ question expands on ${pageLabel}`,
                language: lang,
                description: `Open a Frequently Asked Question on ${pageLabel} and confirm the answer is shown.`,
                expectedResult: 'The selected question’s answer is visible.',
                steps: [
                  `Open the ${pageLabel} listing page`,
                  'Scroll to Frequently Asked Questions',
                  'Open a question',
                  'Verify the answer is shown',
                ],
              });

              allureStep(`Expand an FAQ question on ${pageLabel}`, () => {
                page.expandFaqQuestion();
              });
            }
          );

          it(
            `TC-NLP-12: Load More shows more truck cards on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.EDGE, ...pageTags(pageKey)) },
            function () {
              if (!page.hasLoadMore()) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-NLP-12',
                title: `Load More shows more truck cards on ${pageLabel}`,
                language: lang,
                description: `Click Load More on ${pageLabel} and confirm more truck cards appear.`,
                expectedResult: 'The number of visible card buttons increases after Load More.',
                steps: [
                  `Open the ${pageLabel} listing page`,
                  'Note how many truck cards are shown',
                  'Click Load More',
                  'Verify more cards are shown',
                ],
              });

              allureStep(`Click Load More on ${pageLabel}`, () => {
                page.clickLoadMoreAndExpectMoreCards();
              });
            }
          );
        }
      );
    });
  });
}

module.exports = { runNewListingPagesSuite };
