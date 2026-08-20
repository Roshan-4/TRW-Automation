const VehicleReport = require('../../../../pages/UsedTruck/VehicleReport');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = VehicleReport.supportedLanguages;

/**
 * Vehicle Report (/en/vehicle-history-report). Scope for now: only the three
 * lead forms — Check Offers, Contact Seller, and Check Vehicle Report (see
 * pages/UsedTruck/VehicleReport.js) — not the report content itself.
 *
 * Run:
 * - npm run test:vehicleReport
 * - grepTags=@en+@vehicleReport
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.USED_TRUCK,
  TEST_TAGS.VEHICLE_REPORT,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

LANGUAGES.forEach((lang) => {
  const page = new VehicleReport(lang);
  const pageLabel = page.pageLabel;

  describe(`UsedTruck - VehicleReport [${lang}] — ${pageLabel}`, { tags: langTags(lang) }, () => {
    beforeEach(() => {
      page.navigate();
    });

    registerRedirectionCheck({
      prefix: 'VHR',
      lang,
      tags: langTags(lang, TEST_TAGS.REDIRECTION),
      label: `UsedTruck - ${pageLabel}`,
    });

    it(
      `TC-VHR-01: Check Offers lead submits successfully on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-VHR-01',
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
      `TC-VHR-02: Contact Seller lead submits successfully on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        documentTestCase({
          id: 'TC-VHR-02',
          title: `Contact Seller lead submits successfully on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, open the shared Check Offers lead form via Contact Seller, fill name, mobile and city, and submit.`,
          expectedResult:
            'A Thank You confirmation is shown after a successful lead submission. The submitted name is tagged with a page/CTA identifier for CRM traceability.',
          steps: [
            `Open the ${pageLabel} page`,
            'Open the Contact Seller lead form',
            'Fill name, mobile and city',
            'Submit and verify Thank You confirmation',
          ],
        });

        allureStep(`Submit Contact Seller lead on ${pageLabel}`, () => {
          page.submitContactSellerLead();
        });
      }
    );

    it(
      `TC-VHR-03: Check Vehicle Report lead requests OTP successfully on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        documentTestCase({
          id: 'TC-VHR-03',
          title: `Check Vehicle Report lead requests OTP successfully on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, enter a sample vehicle registration number, click Check Vehicle Report to open its Get Information lead form (a distinct form from Check Offers), fill name, mobile and truck brand, and submit. This form is OTP-gated — there is no configured test OTP in this repo, so completion is verified up to the OTP screen, not full end-to-end submission.`,
          expectedResult:
            'An OTP verification screen (with an Enter OTP field) appears, confirming the lead request succeeded. The submitted name is tagged with a page/CTA identifier for CRM traceability.',
          steps: [
            `Open the ${pageLabel} page`,
            'Enter a sample vehicle registration number',
            'Click Check Vehicle Report to open its lead form',
            'Fill name, mobile and truck brand',
            'Submit and verify the OTP screen appears',
          ],
        });

        allureStep(`Submit Check Vehicle Report lead on ${pageLabel}`, () => {
          page.submitGetInformationLead();
        });
      }
    );

    it(
      `TC-VHR-04: Check Offers lead form shows required validation when submitted empty on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-VHR-04',
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
          page.openCheckOffersLeadViaCta(page.page.checkOffers.leadTriggerCta);
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
      `TC-VHR-05: Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-VHR-05',
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
          page.openCheckOffersLeadViaCta(page.page.checkOffers.leadTriggerCta);
          page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
          page.checkOffersLead.submit();
          page.checkOffersLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
        });
      }
    );
  });
});
