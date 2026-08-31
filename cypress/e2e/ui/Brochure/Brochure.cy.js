const Brochure = require('../../../../pages/Brochure/Brochure');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = Brochure.supportedLanguages;

/**
 * Brochure (/en/brochure). Scope for now: only the Download Brochure lead
 * form (see pages/Brochure/Brochure.js) — not the brochure list/search.
 *
 * Run:
 * - npm run test:brochure
 * - grepTags=@en+@brochure
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.BROCHURE,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

LANGUAGES.forEach((lang) => {
  const page = new Brochure(lang);
  const pageLabel = page.pageLabel;

  describe(`Brochure - Brochure [${lang}] — ${pageLabel}`, { tags: langTags(lang) }, () => {
    beforeEach(() => {
      page.navigate();
    });

    registerRedirectionCheck({
      prefix: 'BR',
      lang,
      tags: langTags(lang, TEST_TAGS.REDIRECTION),
      label: `Brochure - ${pageLabel}`,
    });

    it(
      `TC-BR-01: Download Brochure lead submits successfully on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-BR-01',
          title: `Download Brochure lead submits successfully on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, click Download Brochure to open its lead form (the same shared Check Offers modal, submit button reads "Check Offers"), fill name, mobile and city, and submit.`,
          expectedResult: 'A Thank You confirmation is shown after a successful lead submission.',
          steps: [
            `Open the ${pageLabel} page`,
            'Click Download Brochure to open its lead form',
            'Fill name, mobile and city',
            'Submit and verify Thank You confirmation',
          ],
        });

        allureStep(`Submit Download Brochure lead on ${pageLabel}`, () => {
          page.submitCheckOffersLead();
        });
      }
    );

    page.bestSellingTabs.forEach((tabLabel, index) => {
      const tcNumber = String(index + 2).padStart(2, '0');

      it(
        `TC-BR-${tcNumber}: Download Brochure lead submits successfully from the "${tabLabel}" tab on ${pageLabel}`,
        { tags: langTags(lang, TEST_TAGS.POSITIVE) },
        () => {
          documentTestCase({
            id: `TC-BR-${tcNumber}`,
            title: `Download Brochure lead submits successfully from the "${tabLabel}" tab on ${pageLabel}`,
            language: lang,
            description: `Open the ${pageLabel} page, switch the "Best Selling Trucks" carousel to the "${tabLabel}" tab, click a card's Download Brochure button to open its lead form (the same shared Check Offers modal used elsewhere on the page), fill name, mobile and city, and submit. Every tab is its own entry point even though all tabs open the same underlying form.`,
            expectedResult: 'A Thank You confirmation is shown after a successful lead submission.',
            steps: [
              `Open the ${pageLabel} page`,
              `Switch the Best Selling Trucks carousel to the "${tabLabel}" tab`,
              'Click a card\'s Download Brochure button to open its lead form',
              'Fill name, mobile and city',
              'Submit and verify Thank You confirmation',
            ],
          });

          allureStep(`Submit Download Brochure lead from the "${tabLabel}" tab on ${pageLabel}`, () => {
            page.submitCheckOffersLeadFromTab(tabLabel);
          });
        }
      );
    });

    it(
      `TC-BR-05: Download Brochure lead form shows required validation when submitted empty on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-BR-05',
          title: `Download Brochure lead form shows required validation when submitted empty on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, click Download Brochure, and submit with name, mobile and city all left empty.`,
          expectedResult:
            'The real, page-shown validation messages for name, mobile and location are displayed, and no lead is submitted.',
          steps: [
            `Open the ${pageLabel} page`,
            'Click Download Brochure to open its lead form',
            'Leave name, mobile and city empty and submit',
            'Verify all three required-field validation messages are shown',
          ],
        });

        allureStep(`Submit Download Brochure empty on ${pageLabel} and verify validation`, () => {
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
      `TC-BR-06: Download Brochure lead form rejects mobile that is not 10 digits on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-BR-06',
          title: `Download Brochure lead form rejects mobile that is not 10 digits on ${pageLabel}`,
          language: lang,
          description: `Open the ${pageLabel} page, click Download Brochure, fill a valid name, an invalid (5-digit) mobile number, and leave city empty, then submit.`,
          expectedResult:
            'The real, page-shown mobile-format and location-required validation messages are displayed, and no lead is submitted.',
          steps: [
            `Open the ${pageLabel} page`,
            'Click Download Brochure to open its lead form',
            'Fill a valid name and an invalid mobile number',
            'Submit with city left empty',
            'Verify the mobile-format and location validation messages are shown',
          ],
        });

        allureStep(`Submit Download Brochure with invalid mobile on ${pageLabel} and verify validation`, () => {
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
      `TC-BR-07: Brochure page heading is visible on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-BR-07',
          title: `Brochure page heading is visible on ${pageLabel}`,
          language: lang,
          description: `Open ${pageLabel} and confirm the Download Truck Brochures heading.`,
          expectedResult: 'Download Truck Brochures heading is visible.',
          steps: [`Open the ${pageLabel} page`, 'Verify the page heading'],
        });

        allureStep('Verify Download Truck Brochures heading', () => {
          page.verifyPageHeading();
        });
      }
    );

    it(
      `TC-BR-08: Select Truck to download Brochure and Search are visible on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        documentTestCase({
          id: 'TC-BR-08',
          title: `Select Truck to download Brochure and Search are visible on ${pageLabel}`,
          language: lang,
          description: `Confirm the Select Truck to download Brochure block and its Search button on ${pageLabel}.`,
          expectedResult: 'Select Truck to download Brochure heading and Search are visible.',
          steps: [
            `Open the ${pageLabel} page`,
            'Locate Select Truck to download Brochure',
            'Verify Search is shown',
          ],
        });

        allureStep('Verify Select Truck to download Brochure', () => {
          page.verifySelectTruckToDownload();
        });
      }
    );

    it(
      `TC-BR-09: FAQ question expands on ${pageLabel}`,
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-BR-09',
          title: `FAQ question expands on ${pageLabel}`,
          language: lang,
          description: `Open a Frequently Asked Question on ${pageLabel} and confirm the answer is shown.`,
          expectedResult: 'The selected question’s answer is visible.',
          steps: [`Open the ${pageLabel} page`, 'Open an FAQ question', 'Verify the answer is shown'],
        });

        allureStep('Expand a Brochure FAQ question', () => {
          page.verifyFaqAndExpand();
        });
      }
    );
  });
});
