const LatestTruckUpdates = require('../../../../pages/Homepage/LatestTruckUpdates');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');

const LANGUAGES = LatestTruckUpdates.supportedLanguages;

const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.HOMEPAGE,
  TEST_TAGS.LATEST_TRUCK_UPDATES,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  ...extra,
];

LANGUAGES.forEach((lang) => {
  describe(`Homepage - LatestTruckUpdates [${lang}]`, { tags: langTags(lang) }, () => {
    const page = new LatestTruckUpdates(lang);

    beforeEach(() => {
      page.navigate();
    });

    it(
      'TC-LTU-01: Latest Truck Updates section is visible with videos',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-LTU-01',
          title: 'Latest Truck Updates section is visible with videos',
          language: lang,
          description:
            'Open the homepage and locate Latest Truck Updates. Confirm the section heading and at least one video title are shown.',
          expectedResult:
            'Latest Truck Updates is visible with the correct localized heading and one or more video titles.',
          steps: [
            'Open the homepage for the selected language',
            'Scroll to Latest Truck Updates',
            'Verify heading and video titles are visible',
          ],
        });

        allureStep('Verify Latest Truck Updates section and videos are visible', () => {
          page.verifySectionVisible();
        });
      }
    );

    it(
      'TC-LTU-02: first video title navigates to videos page',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-LTU-02',
          title: 'First video title navigates to videos page',
          language: lang,
          description:
            'Click the first visible video title in Latest Truck Updates and confirm the videos page opens.',
          expectedResult:
            'The browser URL matches that video’s path for the selected language.',
          steps: [
            'Open Latest Truck Updates',
            'Click the first visible video title',
            'Verify the URL is the matching videos page',
          ],
        });

        allureStep('Click first video title and verify videos navigation', () => {
          page.clickFirstVideoTitleAndVerifyNavigation();
        });
      }
    );
  });
});
