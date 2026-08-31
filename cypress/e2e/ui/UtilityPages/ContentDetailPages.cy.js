const ContentDetailPage = require('../../../../pages/UtilityPages/ContentDetailPage');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = ContentDetailPage.supportedLanguages;
const PAGE_KEYS = ContentDetailPage.pageKeys;

/**
 * Legal, blog/news detail, and author pages — see pages/UtilityPages/ContentDetailPage.js.
 *
 * Run:
 * - npm run test:contentDetailPages
 */
const langTags = (lang, pageKey) => [
  TEST_TAGS.UI,
  TEST_TAGS.UTILITY_PAGES,
  TEST_TAGS.CONTENT_DETAIL,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  `@${pageKey}`,
];

LANGUAGES.forEach((lang) => {
  PAGE_KEYS.forEach((pageKey) => {
    const page = new ContentDetailPage(lang, pageKey);
    const pageLabel = page.pageLabel;

    describe(
      `UtilityPages - ContentDetailPage [${pageKey}] [${lang}] — ${pageLabel}`,
      { tags: langTags(lang, pageKey) },
      () => {
        beforeEach(() => {
          page.navigate();
        });

        registerRedirectionCheck({
          prefix: 'CDT',
          lang,
          tags: [...langTags(lang, pageKey), TEST_TAGS.REDIRECTION],
          label: `UtilityPages - ${pageLabel}`,
        });

        it(
          `TC-CDT-01: page heading is visible on ${pageLabel}`,
          { tags: [...langTags(lang, pageKey), TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE] },
          () => {
            documentTestCase({
              id: 'TC-CDT-01',
              title: `Page heading is visible on ${pageLabel}`,
              language: lang,
              description: `Open the ${pageLabel} page and verify its main heading is shown.`,
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
