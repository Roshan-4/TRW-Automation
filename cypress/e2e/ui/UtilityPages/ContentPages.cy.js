const ContentPage = require('../../../../pages/UtilityPages/ContentPage');
const { TEST_TAGS } = require('../../../../constants/constants');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = ContentPage.supportedLanguages;
const PAGE_KEYS = ContentPage.pageKeys;

/**
 * Dealers, Service Center, Spare Parts, EMI Calculator, Brand And Tonnage,
 * News, Videos, Web Story — see pages/UtilityPages/ContentPage.js for the
 * full live-audited findings. None of these 8 pages has a lead form of any
 * kind, so scope here is redirection/load health only (TC-CNT-00), matching
 * the baseline every other page object in this project gets.
 *
 * Run:
 * - npm run test:contentPages
 * - grepTags=@en+@utilityPages
 */
const langTags = (lang, pageKey) => [
  TEST_TAGS.UI,
  TEST_TAGS.UTILITY_PAGES,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  `@${pageKey}`,
];

LANGUAGES.forEach((lang) => {
  PAGE_KEYS.forEach((pageKey) => {
    const page = new ContentPage(lang, pageKey);
    const pageLabel = page.pageLabel;

    describe(
      `UtilityPages - ContentPage [${pageKey}] [${lang}] — ${pageLabel}`,
      { tags: langTags(lang, pageKey) },
      () => {
        beforeEach(() => {
          page.navigate();
        });

        registerRedirectionCheck({
          prefix: 'CNT',
          lang,
          tags: [...langTags(lang, pageKey), TEST_TAGS.REDIRECTION],
          label: `UtilityPages - ${pageLabel}`,
        });
      }
    );
  });
});
