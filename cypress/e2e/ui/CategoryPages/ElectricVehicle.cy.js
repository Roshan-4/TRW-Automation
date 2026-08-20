const ElectricVehicle = require('../../../../pages/CategoryPages/ElectricVehicle');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = ElectricVehicle.supportedLanguages;

/**
 * Electric Commercial Vehicles category page (/en/electric). Scope for now:
 * only the two lead forms found on this page (see
 * pages/CategoryPages/ElectricVehicle.js) — not the truck list/filters/
 * comparisons/FAQ content.
 *
 * Run:
 * - npm run test:electricVehicle
 * - grepTags=@en+@electricVehicle
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.CATEGORY_PAGES,
  TEST_TAGS.ELECTRIC_VEHICLE,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

LANGUAGES.forEach((lang) => {
  const page = new ElectricVehicle(lang);
  const pageLabel = page.pageLabel;

  describe(`CategoryPages - ElectricVehicle [${lang}] — ${pageLabel}`, { tags: langTags(lang) }, () => {
    beforeEach(() => {
      page.navigate();
    });

    registerRedirectionCheck({
      prefix: 'EV',
      lang,
      tags: langTags(lang, TEST_TAGS.REDIRECTION),
      label: `CategoryPages - ${pageLabel}`,
    });

    it(
      `TC-EV-01: Check Truck Price lead submits successfully on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-EV-01',
          title: `Check Truck Price lead submits successfully on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, click a truck card's "Check Truck Price" button to open its lead form (the same shared Check Offers modal used elsewhere on the site), fill name, mobile and city, and submit.`,
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
      `TC-EV-02: Call Now assistance lead submits successfully on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        documentTestCase({
          id: 'TC-EV-02',
          title: `Call Now assistance lead submits successfully on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, click the "Still confused?" widget's Call Now button to open the assistance lead form (a different component from Check Truck Price — placeholder-only inputs, heading "SHARE YOUR DETAILS TO GET ASSISTANCE"), fill model, name, mobile and city, and submit.`,
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

    it(
      `TC-EV-03: Check Truck Price lead form shows required validation when submitted empty on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-EV-03',
          title: `Check Truck Price lead form shows required validation when submitted empty on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, open Check Truck Price on a truck card, and submit with name, mobile and city all left empty.`,
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
          page.openCheckOffersLeadViaCta(page.page.checkTruckPriceCta);
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
      `TC-EV-04: Check Truck Price lead form rejects mobile that is not 10 digits on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-EV-04',
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
          page.openCheckOffersLeadViaCta(page.page.checkTruckPriceCta);
          page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
          page.checkOffersLead.submit();
          page.checkOffersLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
        });
      }
    );
  });
});
