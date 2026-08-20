const FindReliableUsedTrucksNearYou = require('../../../../pages/Homepage/FindReliableUsedTrucksNearYou');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = FindReliableUsedTrucksNearYou.supportedLanguages;

const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.HOMEPAGE,
  TEST_TAGS.FIND_RELIABLE_USED_TRUCKS,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

LANGUAGES.forEach((lang) => {
  describe(`Homepage - FindReliableUsedTrucksNearYou [${lang}]`, { tags: langTags(lang) }, () => {
    const page = new FindReliableUsedTrucksNearYou(lang);

    beforeEach(() => {
      page.navigate();
    });

    registerRedirectionCheck({
      prefix: 'FRU',
      lang,
      tags: langTags(lang, TEST_TAGS.REDIRECTION),
      label: 'Homepage - Find Reliable Used Trucks Near You',
    });

    it(
      'TC-FRU-01: Find Reliable Used Trucks Near You section is visible',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-FRU-01',
          title: 'Find Reliable Used Trucks Near You section is visible',
          language: lang,
          description:
            'Open the homepage and locate Find Reliable Used Trucks Near You. Confirm the section and heading are shown.',
          expectedResult:
            'The section is visible with the correct localized heading and at least one city link.',
          steps: [
            'Open the homepage for the selected language',
            'Scroll to Find Reliable Used Trucks Near You',
            'Verify the section and heading are visible',
          ],
        });

        allureStep('Verify Find Reliable Used Trucks Near You is visible', () => {
          page.verifySectionVisible();
        });
      }
    );

    it(
      'TC-FRU-02: all city links show expected name and used-truck-in URL',
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        documentTestCase({
          id: 'TC-FRU-02',
          title: 'All city links show expected name and used-truck-in URL',
          language: lang,
          description:
            'In Find Reliable Used Trucks Near You, verify every expected city appears with the correct name and city listing URL.',
          expectedResult:
            'Each city from test data is visible with the matching title and /{lang}/used-truck-in-{city} path.',
          steps: [
            'Open Find Reliable Used Trucks Near You',
            'For each expected city, verify name and URL',
            'Confirm the number of city links matches test data',
          ],
        });

        allureStep('Verify all city links name and URL', () => {
          page.verifyAllCityLinksPresent();
        });
      }
    );

    it(
      'TC-FRU-03: first city link navigates to used trucks in that city',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-FRU-03',
          title: 'First city link navigates to used trucks in that city',
          language: lang,
          description:
            'Click the first city in Find Reliable Used Trucks Near You and confirm the used-trucks-in-city listing opens.',
          expectedResult:
            'The browser URL matches that city’s used-truck-in listing for the selected language.',
          steps: [
            'Open Find Reliable Used Trucks Near You',
            'Click the first city link',
            'Verify the city used-trucks listing URL',
          ],
        });

        allureStep('Click first city and verify used-trucks-in-city navigation', () => {
          page.clickFirstCityAndVerifyNavigation();
        });
      }
    );

    it(
      'TC-FRU-04: no city link shares another city\'s listing URL',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE) },
      () => {
        documentTestCase({
          id: 'TC-FRU-04',
          title: 'No city link shares another city\'s listing URL',
          language: lang,
          description: 'Confirm the first two city links do not point at each other\'s used-truck-in URL.',
          expectedResult: 'Each city card links only to its own city listing URL.',
          steps: [
            'Open Find Reliable Used Trucks Near You',
            'Verify the first city\'s link does not use the second city\'s URL, and vice versa',
          ],
        });

        allureStep('Verify no city link shares another city\'s URL', () => {
          page.verifyNoCityLinkSharesAnotherCitysUrl();
        });
      }
    );

    it(
      'TC-FRU-05: last city link navigates to used trucks in that city',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-FRU-05',
          title: 'Last city link navigates to used trucks in that city',
          language: lang,
          description:
            'Click the last (not first) city in Find Reliable Used Trucks Near You and confirm the used-trucks-in-city listing opens.',
          expectedResult:
            'The browser URL matches that city’s used-truck-in listing for the selected language.',
          steps: [
            'Open Find Reliable Used Trucks Near You',
            'Click the last city link',
            'Verify the city used-trucks listing URL',
          ],
        });

        allureStep('Click last city and verify used-trucks-in-city navigation', () => {
          page.clickCityAndVerifyNavigation(page.copy.cities.length - 1);
        });
      }
    );
  });
});
