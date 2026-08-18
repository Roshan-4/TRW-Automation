const PopularTruckComparison = require('../../../../pages/Homepage/PopularTruckComparison');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');

const LANGUAGES = PopularTruckComparison.supportedLanguages;

const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.HOMEPAGE,
  TEST_TAGS.POPULAR_TRUCK_COMPARISON,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  ...extra,
];

LANGUAGES.forEach((lang) => {
  describe(`Homepage - PopularTruckComparison [${lang}]`, { tags: langTags(lang) }, () => {
    const page = new PopularTruckComparison(lang);

    beforeEach(() => {
      page.navigate();
    });

    it(
      'TC-PTC-01: Popular Truck Comparison section is visible',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-PTC-01',
          title: 'Popular Truck Comparison section is visible',
          language: lang,
          description:
            'Open the homepage and locate Popular Truck Comparison. Confirm the section and heading are shown.',
          expectedResult:
            'The Popular Truck Comparison section is visible with the correct localized heading.',
          steps: [
            'Open the homepage for the selected language',
            'Scroll to Popular Truck Comparison',
            'Verify the section and heading are visible',
          ],
        });

        allureStep('Verify Popular Truck Comparison section is visible', () => {
          page.verifySectionVisible();
        });
      }
    );

    it(
      'TC-PTC-02: first compared truck name navigates to truck PDP',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-PTC-02',
          title: 'First compared truck name navigates to truck PDP',
          language: lang,
          description:
            'Click the first visible truck name in Popular Truck Comparison and confirm that truck’s product detail page opens.',
          expectedResult:
            'The browser URL matches that truck’s PDP path for the selected language.',
          steps: [
            'Open Popular Truck Comparison',
            'Click the first visible truck name',
            'Verify the URL is the matching truck PDP',
          ],
        });

        allureStep('Click first compared truck name and verify PDP navigation', () => {
          page.clickFirstProductNameAndVerifyNavigation();
        });
      }
    );

    it(
      'TC-PTC-03: View All Comparison opens compare listing',
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        documentTestCase({
          id: 'TC-PTC-03',
          title: 'View All Comparison opens compare listing',
          language: lang,
          description:
            'Click View All Comparison in Popular Truck Comparison and confirm the compare listing opens.',
          expectedResult:
            'The URL is the compare listing for the language (for example /en/compare).',
          steps: [
            'Open Popular Truck Comparison',
            'Click View All Comparison',
            'Verify the compare listing URL',
          ],
        });

        allureStep('Click View All Comparison and verify listing URL', () => {
          page.clickViewAllAndVerifyNavigation();
        });
      }
    );
  });
});
