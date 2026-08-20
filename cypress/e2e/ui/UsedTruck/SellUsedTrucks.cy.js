const SellUsedTrucks = require('../../../../pages/UsedTruck/SellUsedTrucks');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = SellUsedTrucks.supportedLanguages;

/**
 * Sell Used Trucks (/en/sell-used-truck). Not a simple lead form — a full
 * 4-step truck-listing wizard (see pages/UsedTruck/SellUsedTrucks.js).
 * Drives the entire wizard for real (brand/model/year/km/price, a real
 * 2-image upload, real name/mobile/state/district) and verifies up to the
 * OTP screen — the wizard is OTP-gated at the final step and there is no
 * configured test OTP in this repo, so full listing completion is out of
 * scope for now.
 *
 * Run:
 * - npm run test:sellUsedTrucks
 * - grepTags=@en+@sellUsedTrucks
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.USED_TRUCK,
  TEST_TAGS.SELL_USED_TRUCKS,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

LANGUAGES.forEach((lang) => {
  const page = new SellUsedTrucks(lang);
  const pageLabel = page.pageLabel;

  describe(`UsedTruck - SellUsedTrucks [${lang}] — ${pageLabel}`, { tags: langTags(lang) }, () => {
    beforeEach(() => {
      page.navigate();
    });

    registerRedirectionCheck({
      prefix: 'SUT',
      lang,
      tags: langTags(lang, TEST_TAGS.REDIRECTION),
      label: `UsedTruck - ${pageLabel}`,
    });

    it(
      `TC-SUT-01: Sell truck wizard requests OTP successfully on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-SUT-01',
          title: `Sell truck wizard requests OTP successfully on ${pageLabel}`,
          language: lang,
          description:
            'Walk the full 4-step Sell Used Trucks wizard: pick a brand, fill model/year/kilometers driven/expected price, upload two images, and submit seller contact info (name/mobile/state/district). This wizard is OTP-gated at the final step — there is no configured test OTP in this repo, so completion is verified up to the OTP screen, not full listing creation.',
          expectedResult:
            'Each step advances successfully with the given inputs, and a "Verify and sell your Truck" OTP verification screen (with an Enter OTP field) appears after submitting contact info. The submitted name is tagged with a page identifier for CRM traceability.',
          steps: [
            `Open the ${pageLabel} page`,
            'Step 1: pick a truck brand',
            'Step 2: fill model, year, kilometers driven and expected price',
            'Step 3: upload two placeholder images',
            'Step 4: fill name, mobile, state and district',
            'Verify the OTP screen appears',
          ],
        });

        allureStep(`Complete Sell Used Trucks wizard up to OTP on ${pageLabel}`, () => {
          page.fillEntireWizardUpToOtp();
        });
      }
    );

    it(
      `TC-SUT-02: wizard does not advance past Step 1 without a brand selected on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-SUT-02',
          title: `Wizard does not advance past Step 1 without a brand selected on ${pageLabel}`,
          language: lang,
          description: 'Click Next on Step 1 without picking a truck brand.',
          expectedResult: 'The wizard stays on Step 1 — the Brands field is still shown and Model (Step 2) never appears.',
          steps: [
            `Open the ${pageLabel} page`,
            'Click Next without selecting a brand',
            'Verify the wizard remains on Step 1',
          ],
        });

        allureStep(`Click Next without a brand on ${pageLabel} and verify no advance`, () => {
          page.attemptNextWithoutBrand();
        });
      }
    );

    it(
      `TC-SUT-03: wizard rejects fewer than 2 uploaded photos on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-SUT-03',
          title: `Wizard rejects fewer than 2 uploaded photos on ${pageLabel}`,
          language: lang,
          description:
            'Complete Steps 1 and 2, then on Step 3 upload only one photo (the site requires a minimum of 2) and click Next.',
          expectedResult:
            'The real "Please upload atleast 2 images for your listing" validation message is shown, and the wizard stays on Step 3 — the Full Name field (Step 4) never appears.',
          steps: [
            `Open the ${pageLabel} page`,
            'Complete Step 1 (brand) and Step 2 (model/year/km/price)',
            'Upload only one photo on Step 3 and click Next',
            'Verify the minimum-2-images validation message is shown',
          ],
        });

        allureStep(`Upload one photo on ${pageLabel} and verify minimum-images validation`, () => {
          page.fillStep1Brand();
          page.fillStep2TruckDetails();
          page.attemptNextWithOnlyOnePhoto();
        });
      }
    );
  });
});
