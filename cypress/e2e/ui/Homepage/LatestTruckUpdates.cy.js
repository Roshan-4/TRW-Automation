const LatestTruckUpdates = require('../../../../pages/Homepage/LatestTruckUpdates');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = LatestTruckUpdates.supportedLanguages;

const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.HOMEPAGE,
  TEST_TAGS.LATEST_TRUCK_UPDATES,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

LANGUAGES.forEach((lang) => {
  describe(`Homepage - LatestTruckUpdates [${lang}]`, { tags: langTags(lang) }, () => {
    const page = new LatestTruckUpdates(lang);

    beforeEach(() => {
      page.navigate();
    });

    registerRedirectionCheck({
      prefix: 'LTU',
      lang,
      tags: langTags(lang, TEST_TAGS.REDIRECTION),
      label: 'Homepage - Latest Truck Updates',
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

    it(
      'TC-LTU-03: no visible video card links to a duplicate video',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE) },
      () => {
        documentTestCase({
          id: 'TC-LTU-03',
          title: 'No visible video card links to a duplicate video',
          language: lang,
          description: 'Confirm every visible video title in Latest Truck Updates links to a distinct video.',
          expectedResult: 'No two visible video cards share the same href.',
          steps: ['Open Latest Truck Updates', 'Verify all visible video links are unique'],
        });

        allureStep('Verify no duplicate video links', () => {
          page.verifyNoDuplicateVideoLinks();
        });
      }
    );

    it(
      'TC-LTU-04: last video title navigates to videos page',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-LTU-04',
          title: 'Last video title navigates to videos page',
          language: lang,
          description:
            'Click the last (not first) visible video title in Latest Truck Updates and confirm the videos page opens.',
          expectedResult: 'The browser URL matches that video’s path for the selected language.',
          steps: [
            'Open Latest Truck Updates',
            'Click the last visible video title',
            'Verify the URL is the matching videos page',
          ],
        });

        allureStep('Click last video title and verify videos navigation', () => {
          page.getVisibleVideoTitleLinks().its('length').then((count) => {
            page.clickVideoTitleAndVerifyNavigation(count - 1);
          });
        });
      }
    );
  });
});
