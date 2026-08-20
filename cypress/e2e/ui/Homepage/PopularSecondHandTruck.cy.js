const PopularSecondHandTruck = require('../../../../pages/Homepage/PopularSecondHandTruck');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = PopularSecondHandTruck.supportedLanguages;

const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.HOMEPAGE,
  TEST_TAGS.POPULAR_SECOND_HAND_TRUCK,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

LANGUAGES.forEach((lang) => {
  describe(`Homepage - PopularSecondHandTruck [${lang}]`, { tags: langTags(lang) }, () => {
    const page = new PopularSecondHandTruck(lang);

    beforeEach(() => {
      page.navigate();
    });

    registerRedirectionCheck({
      prefix: 'PSH',
      lang,
      tags: langTags(lang, TEST_TAGS.REDIRECTION),
      label: 'Homepage - Popular Second Hand Truck',
    });

    it(
      'TC-PSH-01: Popular Second Hand Truck section is visible',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-PSH-01',
          title: 'Popular Second Hand Truck section is visible',
          language: lang,
          description:
            'Open the homepage and locate Popular Second Hand Truck. Confirm the section and heading are shown.',
          expectedResult:
            'The Popular Second Hand Truck section is visible with the correct localized heading.',
          steps: [
            'Open the homepage for the selected language',
            'Scroll to Popular Second Hand Truck',
            'Verify the section and heading are visible',
          ],
        });

        allureStep('Verify Popular Second Hand Truck section is visible', () => {
          page.verifySectionVisible();
        });
      }
    );

    it(
      'TC-PSH-02: first used-truck product name navigates to used PDP',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-PSH-02',
          title: 'First used-truck product name navigates to used PDP',
          language: lang,
          description:
            'Click the first visible used-truck product name in Popular Second Hand Truck and confirm the used-truck detail page opens.',
          expectedResult:
            'The browser URL matches that listing’s used-truck PDP path for the selected language.',
          steps: [
            'Open Popular Second Hand Truck',
            'Click the first visible product name',
            'Verify the URL is the matching used-truck PDP',
          ],
        });

        allureStep('Click first used-truck name and verify PDP navigation', () => {
          page.clickFirstProductNameAndVerifyNavigation();
        });
      }
    );

    it(
      'TC-PSH-03: View All Used Trucks opens buy-used-trucks listing',
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        documentTestCase({
          id: 'TC-PSH-03',
          title: 'View All Used Trucks opens buy-used-trucks listing',
          language: lang,
          description:
            'Click View All Used Trucks in Popular Second Hand Truck and confirm the used trucks listing opens.',
          expectedResult:
            'The URL is the buy-used-trucks listing for the language (for example /en/buy-used-trucks).',
          steps: [
            'Open Popular Second Hand Truck',
            'Click View All Used Trucks',
            'Verify the buy-used-trucks listing URL',
          ],
        });

        allureStep('Click View All Used Trucks and verify listing URL', () => {
          page.clickViewAllAndVerifyNavigation();
        });
      }
    );

    it(
      'TC-PSH-04: View All Used Trucks link does not reuse a product card\'s URL',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE) },
      () => {
        documentTestCase({
          id: 'TC-PSH-04',
          title: 'View All Used Trucks link does not reuse a product card\'s URL',
          language: lang,
          description: 'Confirm the View All Used Trucks link does not accidentally point at the first product card\'s PDP URL.',
          expectedResult: 'View All Used Trucks and the first product card link to different URLs.',
          steps: ['Open Popular Second Hand Truck', 'Verify View All\'s href differs from the first product\'s href'],
        });

        allureStep('Verify View All link does not match a product link', () => {
          page.verifyViewAllLinkDoesNotMatchAProductLink();
        });
      }
    );

    it(
      'TC-PSH-05: no visible product card links to a duplicate used truck',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-PSH-05',
          title: 'No visible product card links to a duplicate used truck',
          language: lang,
          description: 'Confirm every visible product name in Popular Second Hand Truck links to a distinct used truck.',
          expectedResult: 'No two visible product cards share the same href.',
          steps: ['Open Popular Second Hand Truck', 'Verify all visible product links are unique'],
        });

        allureStep('Verify no duplicate product links', () => {
          page.verifyNoDuplicateProductLinks();
        });
      }
    );
  });
});
