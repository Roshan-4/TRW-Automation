const DirectoryPage = require('../../../../pages/UtilityPages/DirectoryPage');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = DirectoryPage.supportedLanguages;
const PAGE_KEYS = DirectoryPage.pageKeys;

/**
 * All Truck Brands, Top Bus Brands, Popular Truck Series — see
 * pages/UtilityPages/DirectoryPage.js for live-audited findings. These are
 * pure link directories, not listing pages with page-level lead forms.
 *
 * Run:
 * - npm run test:directoryPages
 */
const langTags = (lang, pageKey) => [
  TEST_TAGS.UI,
  TEST_TAGS.UTILITY_PAGES,
  TEST_TAGS.DIRECTORY_PAGES,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  `@${pageKey}`,
];

LANGUAGES.forEach((lang) => {
  PAGE_KEYS.forEach((pageKey) => {
    const page = new DirectoryPage(lang, pageKey);
    const pageLabel = page.pageLabel;

    describe(
      `UtilityPages - DirectoryPage [${pageKey}] [${lang}] — ${pageLabel}`,
      { tags: langTags(lang, pageKey) },
      () => {
        beforeEach(() => {
          page.navigate();
        });

        registerRedirectionCheck({
          prefix: 'DIR',
          lang,
          tags: [...langTags(lang, pageKey), TEST_TAGS.REDIRECTION],
          label: `UtilityPages - ${pageLabel}`,
        });

        it(
          `TC-DIR-01: page heading is visible on ${pageLabel}`,
          { tags: [...langTags(lang, pageKey), TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE] },
          () => {
            documentTestCase({
              id: 'TC-DIR-01',
              title: `Page heading is visible on ${pageLabel}`,
              language: lang,
              description: `Open the ${pageLabel} directory page and verify its main heading is shown.`,
              expectedResult: `The user sees the "${page.expectedHeading}" heading at the top of the page.`,
              steps: [`Open the ${pageLabel} page`, 'Verify the main page heading is visible'],
            });

            allureStep(`Verify heading on ${pageLabel}`, () => {
              page.verifyPageHeadingVisible();
            });
          }
        );
      }
    );
  });
});
