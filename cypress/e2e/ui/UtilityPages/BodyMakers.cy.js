const BodyMakers = require('../../../../pages/UtilityPages/BodyMakers');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = BodyMakers.supportedLanguages;

/**
 * Body Makers (/en/body-makers). Scope for now: only the "Talk To Dealer"
 * lead form on the first dealer card (see pages/UtilityPages/BodyMakers.js)
 * — no page-level CTA exists here, only repeated per-dealer card CTAs, and
 * the modal itself is a bespoke variant (extra Brand/Model dropdowns) of
 * the shared CheckOffersLead component.
 *
 * Run:
 * - npm run test:bodyMakers
 * - grepTags=@en+@utilityPages+@bodyMakers
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.UTILITY_PAGES,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  '@bodyMakers',
  ...extra,
];

LANGUAGES.forEach((lang) => {
  const page = new BodyMakers(lang);
  const pageLabel = page.pageLabel;

  describe(`UtilityPages - BodyMakers [${lang}] — ${pageLabel}`, { tags: langTags(lang) }, () => {
    beforeEach(() => {
      page.navigate();
    });

    registerRedirectionCheck({
      prefix: 'BDM',
      lang,
      tags: langTags(lang, TEST_TAGS.REDIRECTION),
      label: `UtilityPages - ${pageLabel}`,
    });

    it(
      `TC-BDM-01: Talk To Dealer lead submits successfully on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-BDM-01',
          title: `Talk To Dealer lead submits successfully on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, click a dealer card's "Talk To Dealer" button to open its lead form, fill name, mobile, city, brand and model, and submit.`,
          expectedResult: 'A Thank You confirmation is shown after a successful lead submission.',
          steps: [
            `Open the ${pageLabel} page`,
            'Click a dealer card\'s "Talk To Dealer" button to open its lead form',
            'Fill name, mobile, city, brand and model',
            'Submit and verify Thank You confirmation',
          ],
        });

        allureStep(`Submit Talk To Dealer lead on ${pageLabel}`, () => {
          page.submitLead();
        });
      }
    );

    it(
      `TC-BDM-02: lead form shows required validation when submitted empty on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-BDM-02',
          title: `Lead form shows required validation when submitted empty on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, open the lead form via "Talk To Dealer", and submit with every field left empty.`,
          expectedResult:
            'The real, page-shown validation messages for name, mobile, location, brand and model are displayed, and no lead is submitted.',
          steps: [
            `Open the ${pageLabel} page`,
            'Click a dealer card\'s "Talk To Dealer" button to open its lead form',
            'Leave every field empty and submit',
            'Verify all five required-field validation messages are shown',
          ],
        });

        allureStep(`Submit lead empty on ${pageLabel} and verify validation`, () => {
          const validation = page.validation;
          page.openLeadFormViaCta();
          page.fillFields({ name: '', mobile: '', city: '', selectCity: false });
          page.submit();
          page.verifyValidationMessages([
            validation.nameRequired,
            validation.mobileRequired,
            validation.locationRequired,
            validation.brandRequired,
            validation.modelRequired,
          ]);
        });
      }
    );

    it(
      `TC-BDM-03: lead form rejects mobile that is not 10 digits on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-BDM-03',
          title: `Lead form rejects mobile that is not 10 digits on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, open the lead form via "Talk To Dealer", fill a valid name, an invalid (5-digit) mobile number, and leave city/brand/model empty, then submit.`,
          expectedResult:
            'The real, page-shown mobile-format and other required validation messages are displayed, and no lead is submitted.',
          steps: [
            `Open the ${pageLabel} page`,
            'Click a dealer card\'s "Talk To Dealer" button to open its lead form',
            'Fill a valid name and an invalid mobile number',
            'Submit with city, brand and model left empty',
            'Verify the mobile-format and other validation messages are shown',
          ],
        });

        allureStep(`Submit lead with invalid mobile on ${pageLabel} and verify validation`, () => {
          const validation = page.validation;
          page.openLeadFormViaCta();
          page.fillFields({ name: 'testqa', mobile: '12345', city: '', selectCity: false });
          page.submit();
          page.verifyValidationMessages([
            validation.mobileInvalid,
            validation.locationRequired,
            validation.brandRequired,
            validation.modelRequired,
          ]);
        });
      }
    );
  });
});
