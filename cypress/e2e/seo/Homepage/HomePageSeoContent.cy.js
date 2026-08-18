const HomePageSeoContent = require('../../../../pages/Seo/Homepage/HomePageSeoContent');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');

const LANGUAGES = HomePageSeoContent.supportedLanguages;

const langTags = (lang, ...extra) => [
  TEST_TAGS.SEO,
  TEST_TAGS.HOMEPAGE,
  TEST_TAGS.HOME_PAGE_SEO_CONTENT,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  ...extra,
];

LANGUAGES.forEach((lang) => {
  describe(`SEO - HomePageSeoContent [${lang}]`, { tags: langTags(lang) }, () => {
    const page = new HomePageSeoContent(lang);

    beforeEach(() => {
      page.navigate();
    });

    it(
      'TC-SEO-01: About Truck Junction SEO block is visible with Read More',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-SEO-01',
          title: 'About Truck Junction SEO block is visible with Read More',
          language: lang,
          description:
            'Open the homepage and locate the About Truck Junction content block. Confirm the about heading and Read More control are shown.',
          expectedResult:
            'The About Truck Junction block is visible with the correct localized heading and a Read More button.',
          steps: [
            'Open the homepage for the selected language',
            'Scroll to the About Truck Junction block',
            'Verify the about heading and Read More are visible',
          ],
        });

        allureStep('Verify About Truck Junction block and Read More are visible', () => {
          page.verifyAboutSectionVisible();
        });
      }
    );

    it(
      'TC-SEO-02: Read More expands the About Truck Junction content',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-SEO-02',
          title: 'Read More expands the About Truck Junction content',
          language: lang,
          description:
            'Click Read More on the About Truck Junction block and confirm the content expands (Read Less is shown).',
          expectedResult:
            'After Read More, the block is expanded and the Read Less control is visible to the user.',
          steps: [
            'Open the About Truck Junction block',
            'Click Read More',
            'Verify Read Less is shown',
          ],
        });

        allureStep('Click Read More and verify content expands', () => {
          page.expandReadMore();
        });
      }
    );

    if (lang === 'en') {
      it(
        'TC-SEO-03: expanded English SEO headings are visible',
        { tags: langTags(lang, TEST_TAGS.POSITIVE) },
        () => {
          documentTestCase({
            id: 'TC-SEO-03',
            title: 'Expanded English SEO headings are visible',
            language: lang,
            description:
              'After expanding Read More on English, confirm all expected SEO sub-headings inside the About block are visible.',
            expectedResult:
              'Each expected SEO heading (for example Get the Best Trucks in India 2026, Why Choose Truck Junction?) is visible in the expanded block.',
            steps: [
              'Open About Truck Junction',
              'Click Read More',
              'Verify each expected SEO heading is visible',
            ],
          });

          allureStep('Expand Read More and verify English SEO headings', () => {
            page.expandReadMore();
            page.verifySeoHeadingsVisible();
          });
        }
      );

      it(
        'TC-SEO-04: Find Top Brands sample link navigates to brand page',
        { tags: langTags(lang, TEST_TAGS.POSITIVE) },
        () => {
          documentTestCase({
            id: 'TC-SEO-04',
            title: 'Find Top Brands sample link navigates to brand page',
            language: lang,
            description:
              'After expanding Read More, click the Ashok Leyland Truck link under Find Top Brands of Trucks in India and confirm the brand page opens.',
            expectedResult:
              'The browser URL is /en/ashok-leyland after clicking Ashok Leyland Truck.',
            steps: [
              'Open About Truck Junction and click Read More',
              'Click Ashok Leyland Truck in the Top Brands SEO section',
              'Verify the brand page URL',
            ],
          });

          allureStep('Expand Read More, click brand link, verify navigation', () => {
            page.expandReadMore();
            page.clickSampleBrandLinkAndVerifyNavigation();
          });
        }
      );
    }
  });
});
