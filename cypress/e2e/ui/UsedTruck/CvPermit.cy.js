const CvPermit = require('../../../../pages/UsedTruck/CvPermit');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = CvPermit.supportedLanguages;

/**
 * CV Permit (/en/vehicle-permit-check). Scope for now: only the two lead
 * forms — Check Offers and Check Permit Info (see
 * pages/UsedTruck/CvPermit.js) — not the permit-info content itself.
 *
 * Run:
 * - npm run test:cvPermit
 * - grepTags=@en+@cvPermit
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.USED_TRUCK,
  TEST_TAGS.CV_PERMIT,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

LANGUAGES.forEach((lang) => {
  const page = new CvPermit(lang);
  const pageLabel = page.pageLabel;

  describe(`UsedTruck - CvPermit [${lang}] — ${pageLabel}`, { tags: langTags(lang) }, () => {
    beforeEach(() => {
      page.navigate();
    });

    registerRedirectionCheck({
      prefix: 'CVP',
      lang,
      tags: langTags(lang, TEST_TAGS.REDIRECTION),
      label: `UsedTruck - ${pageLabel}`,
    });

    it(
      `TC-CVP-01: Check Offers lead submits successfully on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-CVP-01',
          title: `Check Offers lead submits successfully on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, open the shared Check Offers lead form, fill name, mobile and city, and submit.`,
          expectedResult:
            'A Thank You confirmation is shown after a successful lead submission. The submitted name is tagged with a page/CTA identifier for CRM traceability.',
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
      `TC-CVP-02: Check Permit Info lead requests OTP successfully on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        documentTestCase({
          id: 'TC-CVP-02',
          title: `Check Permit Info lead requests OTP successfully on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, enter a sample vehicle registration number, click Check Permit Info to open its Get Information lead form (a distinct form from Check Offers), fill name, mobile and truck brand, and submit. This form is OTP-gated — there is no configured test OTP in this repo, so completion is verified up to the OTP screen, not full end-to-end submission.`,
          expectedResult:
            'An OTP verification screen (with an Enter OTP field) appears, confirming the lead request succeeded. The submitted name is tagged with a page/CTA identifier for CRM traceability.',
          steps: [
            `Open the ${pageLabel} page`,
            'Enter a sample vehicle registration number',
            'Click Check Permit Info to open its lead form',
            'Fill name, mobile and truck brand',
            'Submit and verify the OTP screen appears',
          ],
        });

        allureStep(`Submit Check Permit Info lead on ${pageLabel}`, () => {
          page.submitGetInformationLead();
        });
      }
    );

    it(
      `TC-CVP-03: Check Offers lead form shows required validation when submitted empty on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-CVP-03',
          title: `Check Offers lead form shows required validation when submitted empty on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, open Check Offers, and submit with name, mobile and city all left empty.`,
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
      `TC-CVP-04: Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-CVP-04',
          title: `Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, open Check Offers, fill a valid name, an invalid (5-digit) mobile number, and leave city empty, then submit.`,
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
  });
});
