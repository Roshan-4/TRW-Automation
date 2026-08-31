const BuyUsedTrucks = require('../../../../pages/UsedTruck/BuyUsedTrucks');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = BuyUsedTrucks.supportedLanguages;

/**
 * Buy Used Trucks (/en/buy-used-trucks). Scope for now: only the Contact
 * Seller lead form (see pages/UsedTruck/BuyUsedTrucks.js).
 *
 * Run:
 * - npm run test:buyUsedTrucks
 * - grepTags=@en+@buyUsedTrucks
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.USED_TRUCK,
  TEST_TAGS.BUY_USED_TRUCKS,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

LANGUAGES.forEach((lang) => {
  const page = new BuyUsedTrucks(lang);
  const pageLabel = page.pageLabel;

  describe(`UsedTruck - BuyUsedTrucks [${lang}] — ${pageLabel}`, { tags: langTags(lang) }, () => {
    beforeEach(() => {
      page.navigate();
    });

    registerRedirectionCheck({
      prefix: 'BUT',
      lang,
      tags: langTags(lang, TEST_TAGS.REDIRECTION),
      label: `UsedTruck - ${pageLabel}`,
    });

    it(
      `TC-BUT-01: Contact Seller lead submits successfully on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-BUT-01',
          title: `Contact Seller lead submits successfully on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, open the per-listing "Get Seller Details" lead form via Contact Seller on a visible truck card, fill name, mobile and city, and submit.`,
          expectedResult:
            'A Thank You confirmation is shown after a successful lead submission. The submitted name is tagged with a page/CTA identifier for CRM traceability.',
          steps: [
            `Open the ${pageLabel} page`,
            'Open the Contact Seller lead form from a visible card',
            'Fill name, mobile and city',
            'Submit and verify Thank You confirmation',
          ],
        });

        allureStep(`Submit Contact Seller lead on ${pageLabel}`, () => {
          page.submitGetSellerDetailsLead();
        });
      }
    );

    it(
      `TC-BUT-02: Contact Seller lead form shows required validation when submitted empty on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-BUT-02',
          title: `Contact Seller lead form shows required validation when submitted empty on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, open Contact Seller on a visible card, and submit with name, mobile and city all left empty.`,
          expectedResult:
            'The real, page-shown validation messages for name, mobile and location are displayed, and no lead is submitted.',
          steps: [
            `Open the ${pageLabel} page`,
            'Open the Contact Seller lead form from a visible card',
            'Leave name, mobile and city empty and submit',
            'Verify all three required-field validation messages are shown',
          ],
        });

        allureStep(`Submit Contact Seller empty on ${pageLabel} and verify validation`, () => {
          const validation = page.checkOffersLeadCopy.validation;
          page.openGetSellerDetailsLead();
          page.getSellerDetailsLead.fillFields({ name: '', mobile: '', city: '', selectCity: false });
          page.getSellerDetailsLead.submit();
          page.getSellerDetailsLead.verifyValidationMessages([
            validation.nameRequired,
            validation.mobileRequired,
            validation.locationRequired,
          ]);
        });
      }
    );

    it(
      `TC-BUT-03: Contact Seller lead form rejects mobile that is not 10 digits on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-BUT-03',
          title: `Contact Seller lead form rejects mobile that is not 10 digits on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, open Contact Seller, fill a valid name, an invalid (5-digit) mobile number, and leave city empty, then submit.`,
          expectedResult:
            'The real, page-shown mobile-format and location-required validation messages are displayed, and no lead is submitted.',
          steps: [
            `Open the ${pageLabel} page`,
            'Open the Contact Seller lead form from a visible card',
            'Fill a valid name and an invalid mobile number',
            'Submit with city left empty',
            'Verify the mobile-format and location validation messages are shown',
          ],
        });

        allureStep(`Submit Contact Seller with invalid mobile on ${pageLabel} and verify validation`, () => {
          const lead = page.checkOffersLeadCopy;
          const validation = lead.validation;
          page.openGetSellerDetailsLead();
          page.getSellerDetailsLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
          page.getSellerDetailsLead.submit();
          page.getSellerDetailsLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
        });
      }
    );

    it(
      `TC-BUT-04: page heading and used-truck listing are visible on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-BUT-04',
          title: `page heading and used-truck listing are visible on ${pageLabel}`,
          language: lang,
          description: `Open ${pageLabel} and confirm the page heading, the used-truck count, and at least one Contact Seller card.`,
          expectedResult: 'Used Trucks heading, a “N Used Truck Found” count, and at least one Contact Seller button are visible.',
          steps: [
            `Open the ${pageLabel} page`,
            'Verify the page heading',
            'Verify the listing count and a truck card',
          ],
        });

        allureStep('Verify Used Trucks heading and listing cards', () => {
          page.verifyPageHeading();
          page.verifyListingCountAndCards();
        });
      }
    );

    it(
      `TC-BUT-05: listing filters are visible on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        documentTestCase({
          id: 'TC-BUT-05',
          title: `listing filters are visible on ${pageLabel}`,
          language: lang,
          description: `Confirm Reset All and Apply Filters are shown on ${pageLabel}.`,
          expectedResult: 'Reset All and Apply Filters are visible.',
          steps: [`Open the ${pageLabel} page`, 'Verify Reset All and Apply Filters'],
        });

        allureStep('Verify used-truck listing filters', () => {
          page.verifyFilters();
        });
      }
    );

    it(
      `TC-BUT-06: FAQ question expands on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-BUT-06',
          title: `FAQ question expands on ${pageLabel}`,
          language: lang,
          description: `Open a Frequently Asked Question on ${pageLabel} and confirm the answer is shown.`,
          expectedResult: 'The selected question’s answer is visible.',
          steps: [`Open the ${pageLabel} page`, 'Open an FAQ question', 'Verify the answer is shown'],
        });

        allureStep('Expand a Used Trucks FAQ question', () => {
          page.verifyFaqAndExpand();
        });
      }
    );

    it(
      `TC-BUT-07: Load More shows more used-truck cards on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-BUT-07',
          title: `Load More shows more used-truck cards on ${pageLabel}`,
          language: lang,
          description: `Click Load More on ${pageLabel} and confirm more Contact Seller cards appear.`,
          expectedResult: 'The number of visible Contact Seller buttons increases after Load More.',
          steps: [
            `Open the ${pageLabel} page`,
            'Note how many cards are shown',
            'Click Load More',
            'Verify more cards are shown',
          ],
        });

        allureStep('Click Load More on Buy Used Trucks', () => {
          page.clickLoadMoreAndExpectMoreCards();
        });
      }
    );
  });
});
