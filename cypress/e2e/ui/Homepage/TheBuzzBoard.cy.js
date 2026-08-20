const TheBuzzBoard = require('../../../../pages/Homepage/TheBuzzBoard');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = TheBuzzBoard.supportedLanguages;

const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.HOMEPAGE,
  TEST_TAGS.THE_BUZZ_BOARD,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

LANGUAGES.forEach((lang) => {
  describe(`Homepage - TheBuzzBoard [${lang}]`, { tags: langTags(lang) }, () => {
    const page = new TheBuzzBoard(lang);

    beforeEach(() => {
      page.navigate();
    });

    registerRedirectionCheck({
      prefix: 'TBB',
      lang,
      tags: langTags(lang, TEST_TAGS.REDIRECTION),
      label: 'Homepage - The Buzz Board',
    });

    it(
      'TC-TBB-01: The Buzz Board section is visible with news articles',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-TBB-01',
          title: 'The Buzz Board section is visible with news articles',
          language: lang,
          description:
            'Open the homepage and locate The Buzz Board. Confirm the section heading and at least one news article title are shown.',
          expectedResult:
            'The Buzz Board is visible with the correct localized heading and one or more news article titles.',
          steps: [
            'Open the homepage for the selected language',
            'Scroll to The Buzz Board',
            'Verify heading and article titles are visible',
          ],
        });

        allureStep('Verify The Buzz Board section and articles are visible', () => {
          page.verifySectionVisible();
        });
      }
    );

    it(
      'TC-TBB-02: first news article title navigates to news page',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-TBB-02',
          title: 'First news article title navigates to news page',
          language: lang,
          description:
            'Click the first visible news article title in The Buzz Board and confirm the news article page opens.',
          expectedResult:
            'The browser URL matches that article’s news path for the selected language.',
          steps: [
            'Open The Buzz Board',
            'Click the first visible article title',
            'Verify the URL is the matching news page',
          ],
        });

        allureStep('Click first article title and verify news navigation', () => {
          page.clickFirstArticleTitleAndVerifyNavigation();
        });
      }
    );

    it(
      'TC-TBB-03: no visible article card links to a duplicate news article',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE) },
      () => {
        documentTestCase({
          id: 'TC-TBB-03',
          title: 'No visible article card links to a duplicate news article',
          language: lang,
          description: 'Confirm every visible article title in The Buzz Board links to a distinct news article.',
          expectedResult: 'No two visible article cards share the same href.',
          steps: ['Open The Buzz Board', 'Verify all visible article links are unique'],
        });

        allureStep('Verify no duplicate article links', () => {
          page.verifyNoDuplicateArticleLinks();
        });
      }
    );

    it(
      'TC-TBB-04: last news article title navigates to news page',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-TBB-04',
          title: 'Last news article title navigates to news page',
          language: lang,
          description:
            'Click the last (not first) visible news article title in The Buzz Board and confirm the news article page opens.',
          expectedResult: 'The browser URL matches that article’s news path for the selected language.',
          steps: [
            'Open The Buzz Board',
            'Click the last visible article title',
            'Verify the URL is the matching news page',
          ],
        });

        allureStep('Click last article title and verify news navigation', () => {
          page.clickLastArticleTitleAndVerifyNavigation();
        });
      }
    );
  });
});
