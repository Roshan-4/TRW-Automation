const LatestModelsByCategory = require('../../../../pages/Homepage/LatestModelsByCategory');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');

const LANGUAGES = LatestModelsByCategory.supportedLanguages;

/**
 * Tag helpers for @cypress/grep
 * - npm run test:latestModelsByCategory
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.HOMEPAGE,
  TEST_TAGS.LATEST_MODELS_BY_CATEGORY,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  ...extra,
];

LANGUAGES.forEach((lang) => {
  describe(`Homepage - LatestModelsByCategory [${lang}]`, { tags: langTags(lang) }, () => {
    const page = new LatestModelsByCategory(lang);

    beforeEach(() => {
      page.navigate();
    });

    it(
      'TC-LMC-01: Latest Models by Category section is visible with tabs',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-LMC-01',
          title: 'Latest Models by Category section is visible with tabs',
          language: lang,
          description:
            'Open the homepage and locate Latest Models by Category. Confirm the section heading and all category tabs are shown.',
          expectedResult:
            'The section is visible with the correct heading and tabs for 3 Wheelers, Auto Rickshaw, E Rickshaw, Mini Trucks, and SCV (localized for the language).',
          steps: [
            'Open the homepage for the selected language',
            'Scroll to Latest Models by Category',
            'Verify heading and all category tabs are visible',
          ],
        });

        allureStep('Verify Latest Models by Category section and tabs are visible', () => {
          page.verifySectionVisible();
        });
      }
    );

    it(
      'TC-LMC-02: first product name on default tab navigates to truck PDP',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-LMC-02',
          title: 'First product name on default tab navigates to truck PDP',
          language: lang,
          description:
            'On the default category tab, click the first visible truck product name and confirm the truck product detail page opens.',
          expectedResult:
            'The browser URL matches that product’s truck PDP path for the selected language.',
          steps: [
            'Open Latest Models by Category',
            'Click the first visible product name on the active tab',
            'Verify the URL is the matching truck PDP',
          ],
        });

        allureStep('Click first product name and verify PDP navigation', () => {
          page.clickFirstProductNameAndVerifyNavigation();
        });
      }
    );

    const leadCases = [
      { id: 'TC-LMC-03', tabKey: 'threeWheelers' },
      { id: 'TC-LMC-04', tabKey: 'autoRickshaw' },
      { id: 'TC-LMC-05', tabKey: 'eRickshaw' },
      { id: 'TC-LMC-06', tabKey: 'miniTrucks' },
      { id: 'TC-LMC-07', tabKey: 'scv' },
    ];

    leadCases.forEach(({ id, tabKey }) => {
      it(
        `${id}: one Check Offers lead from ${page.copy.tabs[tabKey]} tab submits successfully`,
        { tags: langTags(lang, TEST_TAGS.POSITIVE) },
        () => {
          const tabLabel = page.copy.tabs[tabKey];
          documentTestCase({
            id,
            title: `One Check Offers lead from ${tabLabel} tab submits successfully`,
            language: lang,
            description: `Open the ${tabLabel} tab in Latest Models by Category, click Check Offers once, fill name/mobile/city, enter a 5-digit price/budget only if asked, and submit.`,
            expectedResult:
              'A Thank You confirmation is shown after a successful lead submission from that tab.',
            steps: [
              'Open Latest Models by Category',
              `Open the ${tabLabel} tab`,
              'Click Check Offers on one visible card',
              'Fill name, mobile and city (and 5-digit price/budget if shown)',
              'Submit and verify Thank You confirmation',
            ],
          });

          allureStep(`Submit one Check Offers lead from ${tabLabel}`, () => {
            page.submitOneCheckOffersLeadFromTab(tabKey);
          });
        }
      );
    });

    it(
      'TC-LMC-08: View All on default tab opens matching category listing',
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        documentTestCase({
          id: 'TC-LMC-08',
          title: 'View All on default tab opens matching category listing',
          language: lang,
          description:
            'On the default 3 Wheelers tab, click View All and confirm the user lands on the matching category listing page.',
          expectedResult:
            'The URL matches the View All path for 3 Wheelers (for example /en/3-wheeler in English).',
          steps: [
            'Open Latest Models by Category on the default tab',
            'Click View All',
            'Verify the category listing URL',
          ],
        });

        allureStep('Click View All on 3 Wheelers and verify listing URL', () => {
          page.clickViewAllAndVerifyNavigation('threeWheelers');
        });
      }
    );

    it(
      'TC-LMC-09: switching tabs updates View All destination URL',
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        documentTestCase({
          id: 'TC-LMC-09',
          title: 'Switching tabs updates View All destination URL',
          language: lang,
          description:
            'Switch through each category tab and confirm View All points to the correct listing URL for that tab.',
          expectedResult:
            'For every tab, View All href matches the expected category listing path from test data.',
          steps: [
            'Open Latest Models by Category',
            'Open each category tab',
            'Verify View All href for that tab',
          ],
        });

        LatestModelsByCategory.tabKeys.forEach((tabKey) => {
          allureStep(`Verify View All URL for ${page.copy.tabs[tabKey]}`, () => {
            page.openTab(tabKey);
            page.verifyViewAllForTab(tabKey);
          });
        });
      }
    );
  });
});
