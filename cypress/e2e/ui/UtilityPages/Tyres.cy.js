const Tyres = require('../../../../pages/UtilityPages/Tyres');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = Tyres.supportedLanguages;

/**
 * Tyres (/en/tyres). Scope for now: only the "View August Offer" lead form
 * on the first tyre-model card (see pages/UtilityPages/Tyres.js) — no
 * page-level CTA exists here, only repeated per-model card CTAs.
 *
 * Run:
 * - npm run test:tyres
 * - grepTags=@en+@utilityPages+@tyres
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.UTILITY_PAGES,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  '@tyres',
  ...extra,
];

LANGUAGES.forEach((lang) => {
  const page = new Tyres(lang);
  const pageLabel = page.pageLabel;

  describe(`UtilityPages - Tyres [${lang}] — ${pageLabel}`, { tags: langTags(lang) }, () => {
    beforeEach(() => {
      page.navigate();
    });

    registerRedirectionCheck({
      prefix: 'TYR',
      lang,
      tags: langTags(lang, TEST_TAGS.REDIRECTION),
      label: `UtilityPages - ${pageLabel}`,
    });

    it(
      `TC-TYR-01: View August Offer lead submits successfully on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-TYR-01',
          title: `View August Offer lead submits successfully on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, click a tyre card's "View August Offer" button to open its lead form, fill name, mobile and city, and submit.`,
          expectedResult: 'A Thank You confirmation is shown after a successful lead submission.',
          steps: [
            `Open the ${pageLabel} page`,
            'Click a tyre card\'s "View August Offer" button to open its lead form',
            'Fill name, mobile and city',
            'Submit and verify Thank You confirmation',
          ],
        });

        allureStep(`Submit lead on ${pageLabel}`, () => {
          page.submitLead();
        });
      }
    );

    it(
      `TC-TYR-02: lead form shows required validation when submitted empty on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-TYR-02',
          title: `Lead form shows required validation when submitted empty on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, open the lead form via "View August Offer", and submit with name, mobile and city all left empty.`,
          expectedResult:
            'The real, page-shown validation messages for name, mobile and location are displayed, and no lead is submitted.',
          steps: [
            `Open the ${pageLabel} page`,
            'Click a tyre card\'s "View August Offer" button to open its lead form',
            'Leave name, mobile and city empty and submit',
            'Verify all three required-field validation messages are shown',
          ],
        });

        allureStep(`Submit lead empty on ${pageLabel} and verify validation`, () => {
          const validation = page.checkOffersLeadCopy.validation;
          page.openLeadFormViaCta();
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
      `TC-TYR-03: lead form rejects mobile that is not 10 digits on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-TYR-03',
          title: `Lead form rejects mobile that is not 10 digits on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, open the lead form via "View August Offer", fill a valid name, an invalid (5-digit) mobile number, and leave city empty, then submit.`,
          expectedResult:
            'The real, page-shown mobile-format and location-required validation messages are displayed, and no lead is submitted.',
          steps: [
            `Open the ${pageLabel} page`,
            'Click a tyre card\'s "View August Offer" button to open its lead form',
            'Fill a valid name and an invalid mobile number',
            'Submit with city left empty',
            'Verify the mobile-format and location validation messages are shown',
          ],
        });

        allureStep(`Submit lead with invalid mobile on ${pageLabel} and verify validation`, () => {
          const lead = page.checkOffersLeadCopy;
          const validation = lead.validation;
          page.openLeadFormViaCta();
          page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
          page.checkOffersLead.submit();
          page.checkOffersLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
        });
      }
    );
  });
});
