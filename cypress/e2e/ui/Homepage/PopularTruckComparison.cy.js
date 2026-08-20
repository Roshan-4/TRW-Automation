const PopularTruckComparison = require('../../../../pages/Homepage/PopularTruckComparison');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = PopularTruckComparison.supportedLanguages;

const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.HOMEPAGE,
  TEST_TAGS.POPULAR_TRUCK_COMPARISON,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

LANGUAGES.forEach((lang) => {
  describe(`Homepage - PopularTruckComparison [${lang}]`, { tags: langTags(lang) }, () => {
    const page = new PopularTruckComparison(lang);

    beforeEach(() => {
      page.navigate();
    });

    registerRedirectionCheck({
      prefix: 'PTC',
      lang,
      tags: langTags(lang, TEST_TAGS.REDIRECTION),
      label: 'Homepage - Popular Truck Comparison',
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

    it(
      'TC-PTC-04: View All Comparison link does not reuse a product card\'s URL',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE) },
      () => {
        documentTestCase({
          id: 'TC-PTC-04',
          title: 'View All Comparison link does not reuse a product card\'s URL',
          language: lang,
          description: 'Confirm the View All Comparison link does not accidentally point at the first product card\'s PDP URL.',
          expectedResult: 'View All Comparison and the first product card link to different URLs.',
          steps: ['Open Popular Truck Comparison', 'Verify View All\'s href differs from the first product\'s href'],
        });

        allureStep('Verify View All link does not match a product link', () => {
          page.verifyViewAllLinkDoesNotMatchAProductLink();
        });
      }
    );

    it(
      'TC-PTC-05: no visible product card links to a duplicate truck',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-PTC-05',
          title: 'No visible product card links to a duplicate truck',
          language: lang,
          description: 'Confirm every visible product name in Popular Truck Comparison links to a distinct truck.',
          expectedResult: 'No two visible product cards share the same href.',
          steps: ['Open Popular Truck Comparison', 'Verify all visible product links are unique'],
        });

        allureStep('Verify no duplicate product links', () => {
          page.verifyNoDuplicateProductLinks();
        });
      }
    );
  });
});
