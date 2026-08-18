const ElectricCommercialVehicles = require('../../../../pages/Homepage/ElectricCommercialVehicles');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');

const LANGUAGES = ElectricCommercialVehicles.supportedLanguages;

/**
 * Tag helpers for @cypress/grep
 * - npm run test:electricCommercialVehicles
 * - grepTags=@en+@electricCommercialVehicles
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.HOMEPAGE,
  TEST_TAGS.ELECTRIC_COMMERCIAL_VEHICLES,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  ...extra,
];

LANGUAGES.forEach((lang) => {
  describe(`Homepage - ElectricCommercialVehicles [${lang}]`, { tags: langTags(lang) }, () => {
    const page = new ElectricCommercialVehicles(lang);

    beforeEach(() => {
      page.navigate();
    });

    it(
      'TC-ECV-01: Electric Commercial Vehicles section is visible',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-ECV-01',
          title: 'Electric Commercial Vehicles section is visible',
          language: lang,
          description:
            'Open the homepage and locate the Electric Commercial Vehicles section. Confirm the section is shown with the correct heading for the selected language.',
          expectedResult:
            'The Electric Commercial Vehicles section is visible and the heading matches the expected localized text (for example, “Electric Commercial Vehicles” in English).',
          steps: [
            'Open the homepage for the selected language',
            'Scroll to the Electric Commercial Vehicles section',
            'Verify the section and heading are visible',
          ],
        });

        allureStep('Verify Electric Commercial Vehicles section and heading are visible', () => {
          page.verifySectionVisible();
        });
      }
    );

    it(
      'TC-ECV-02: first product name navigates to truck PDP',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-ECV-02',
          title: 'First product name navigates to truck PDP',
          language: lang,
          description:
            'In Electric Commercial Vehicles, click the first visible truck product name (not the image) and confirm the user opens that truck’s product detail page.',
          expectedResult:
            'The browser URL matches the product’s truck PDP path for the selected language (for example /en/{brand}-truck/{model}).',
          steps: [
            'Open the Electric Commercial Vehicles section',
            'Click the first visible product name link',
            'Verify the URL is the matching truck PDP',
          ],
        });

        allureStep('Click first product name and verify PDP navigation', () => {
          page.clickFirstProductNameAndVerifyNavigation();
        });
      }
    );

    it(
      'TC-ECV-03: one Check Offers lead submits successfully',
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        documentTestCase({
          id: 'TC-ECV-03',
          title: 'One Check Offers lead submits successfully',
          language: lang,
          description:
            'Open Check Offers once from a card in Electric Commercial Vehicles, fill name, mobile and city, and submit. Only one lead form is exercised for this section.',
          expectedResult:
            'A Thank You confirmation is shown after a successful lead submission (same outcome users see after Check Offers elsewhere on the homepage).',
          steps: [
            'Open Electric Commercial Vehicles',
            'Click Check Offers on one visible card',
            'Fill name, mobile and city',
            'Submit and verify Thank You confirmation',
          ],
        });

        allureStep('Submit one Check Offers lead and verify Thank You', () => {
          page.submitOneCheckOffersLead();
        });
      }
    );

    it(
      'TC-ECV-04: View All opens electric listing',
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        documentTestCase({
          id: 'TC-ECV-04',
          title: 'View All opens electric listing',
          language: lang,
          description:
            'In Electric Commercial Vehicles, click View All and confirm the user is taken to the electric vehicles listing page.',
          expectedResult:
            'The URL is the electric listing path for the language (for example /en/electric in English).',
          steps: [
            'Open Electric Commercial Vehicles',
            'Click View All',
            'Verify the URL is the electric listing page',
          ],
        });

        allureStep('Click View All and verify electric listing URL', () => {
          page.clickViewAllAndVerifyNavigation();
        });
      }
    );
  });
});
