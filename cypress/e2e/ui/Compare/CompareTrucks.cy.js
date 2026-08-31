const CompareTrucks = require('../../../../pages/Compare/CompareTrucks');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = CompareTrucks.supportedLanguages;

/**
 * Compare Trucks (/en/compare). Scope for now: only the Check Offers lead
 * form (see pages/Compare/CompareTrucks.js) — not the comparison tool itself.
 *
 * Run:
 * - npm run test:compareTrucks
 * - grepTags=@en+@compareTrucks
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.COMPARE_TRUCKS,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

LANGUAGES.forEach((lang) => {
  const page = new CompareTrucks(lang);
  const pageLabel = page.pageLabel;

  describe(`Compare - CompareTrucks [${lang}] — ${pageLabel}`, { tags: langTags(lang) }, () => {
    beforeEach(() => {
      page.navigate();
    });

    registerRedirectionCheck({
      prefix: 'CT',
      lang,
      tags: langTags(lang, TEST_TAGS.REDIRECTION),
      label: `Compare - ${pageLabel}`,
    });

    it(
      `TC-CT-01: Check Offers lead submits successfully on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-CT-01',
          title: `Check Offers lead submits successfully on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, open the shared Check Offers lead form, fill name, mobile and city, and submit.`,
          expectedResult:
            'A Thank You confirmation is shown after a successful lead submission (the same shared Check Offers lead form used elsewhere on the site). The submitted name is tagged with a page/CTA identifier for CRM traceability.',
          steps: [
            `Open the ${pageLabel} page`,
            'Open the Check Offers lead form',
            'Fill name, mobile and city',
            'Submit and verify Thank You confirmation',
          ],
        });

        allureStep(`Submit Check Offers lead on ${pageLabel}`, () => {
          page.submitCheckOffersLead();
        });
      }
    );

    it(
      `TC-CT-02: Check Offers lead form shows required validation when submitted empty on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-CT-02',
          title: `Check Offers lead form shows required validation when submitted empty on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, open the Check Offers lead form, and submit with name, mobile and city all left empty.`,
          expectedResult:
            'The real, page-shown validation messages for name, mobile and location are displayed, and no lead is submitted.',
          steps: [
            `Open the ${pageLabel} page`,
            'Open the Check Offers lead form',
            'Leave name, mobile and city empty and submit',
            'Verify all three required-field validation messages are shown',
          ],
        });

        allureStep(`Submit Check Offers empty on ${pageLabel} and verify validation`, () => {
          const validation = page.checkOffersLeadCopy.validation;
          page.openCheckOffersLead();
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
      `TC-CT-03: Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-CT-03',
          title: `Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, open the Check Offers lead form, fill a valid name, an invalid (5-digit) mobile number, and leave city empty, then submit.`,
          expectedResult:
            'The real, page-shown mobile-format and location-required validation messages are displayed, and no lead is submitted.',
          steps: [
            `Open the ${pageLabel} page`,
            'Open the Check Offers lead form',
            'Fill a valid name and an invalid mobile number',
            'Submit with city left empty',
            'Verify the mobile-format and location validation messages are shown',
          ],
        });

        allureStep(`Submit Check Offers with invalid mobile on ${pageLabel} and verify validation`, () => {
          const lead = page.checkOffersLeadCopy;
          const validation = lead.validation;
          page.openCheckOffersLead();
          page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
          page.checkOffersLead.submit();
          page.checkOffersLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
        });
      }
    );

    it(
      `TC-CT-04: Compare Trucks heading and Compare button are visible on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-CT-04',
          title: `Compare Trucks heading and Compare button are visible on ${pageLabel}`,
          language: lang,
          description: `Open ${pageLabel} and confirm the comparison tool heading and Compare button.`,
          expectedResult: 'Compare Trucks heading and a Compare button are visible.',
          steps: [`Open the ${pageLabel} page`, 'Verify heading', 'Verify Compare button'],
        });

        allureStep('Verify Compare Trucks heading and Compare button', () => {
          page.verifyPageHeading();
          page.verifyCompareToolCta();
        });
      }
    );

    it(
      `TC-CT-05: Popular Truck Comparison section is visible on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        documentTestCase({
          id: 'TC-CT-05',
          title: `Popular Truck Comparison section is visible on ${pageLabel}`,
          language: lang,
          description: `Confirm the Popular Truck Comparison block is shown on ${pageLabel}.`,
          expectedResult: 'Popular Truck Comparison heading is visible.',
          steps: [`Open the ${pageLabel} page`, 'Scroll to Popular Truck Comparison', 'Verify heading'],
        });

        allureStep('Verify Popular Truck Comparison', () => {
          page.verifyPopularTruckComparison();
        });
      }
    );

    it(
      `TC-CT-06: Popular Models by Category tab switch on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-CT-06',
          title: `Popular Models by Category tab switch on ${pageLabel}`,
          language: lang,
          description: `Switch Popular Models by Category to Mini Trucks on ${pageLabel}.`,
          expectedResult: 'Mini Trucks becomes the active tab.',
          steps: [
            `Open the ${pageLabel} page`,
            'Scroll to Popular Models by Category',
            'Click Mini Trucks',
            'Verify Mini Trucks is active',
          ],
        });

        allureStep('Switch Popular Models by Category to Mini Trucks', () => {
          page.selectModelsByCategoryTab(page.page.categoryTabToSelect);
        });
      }
    );

    it(
      `TC-CT-07: FAQ question expands on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-CT-07',
          title: `FAQ question expands on ${pageLabel}`,
          language: lang,
          description: `Open a Frequently Asked Question on ${pageLabel} and confirm the answer is shown.`,
          expectedResult: 'The selected question’s answer is visible.',
          steps: [`Open the ${pageLabel} page`, 'Open an FAQ question', 'Verify the answer is shown'],
        });

        allureStep('Expand a Compare Trucks FAQ question', () => {
          page.verifyFaqAndExpand();
        });
      }
    );
  });
});
