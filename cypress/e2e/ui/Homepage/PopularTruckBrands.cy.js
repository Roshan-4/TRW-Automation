const PopularTruckBrands = require('../../../../pages/Homepage/PopularTruckBrands');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = PopularTruckBrands.supportedLanguages;

/**
 * Tag helpers for @cypress/grep
 * - npm run test:popularTruckBrands
 * - grepTags=@en+@popularTruckBrands
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.HOMEPAGE,
  TEST_TAGS.POPULAR_TRUCK_BRANDS,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

LANGUAGES.forEach((lang) => {
  describe(`Homepage - PopularTruckBrands [${lang}]`, { tags: langTags(lang) }, () => {
    const page = new PopularTruckBrands(lang);

    beforeEach(() => {
      page.navigate();
    });

    registerRedirectionCheck({
      prefix: 'PTB',
      lang,
      tags: langTags(lang, TEST_TAGS.REDIRECTION),
      label: 'Homepage - Popular Truck Brands',
    });

    it(
      'TC-PTB-01: Popular Truck Brands section is visible with heading',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-PTB-01',
          title: 'Popular Truck Brands section is visible with heading',
          language: lang,
          description:
            'Open the homepage and locate the Popular Truck Brands section. Confirm the section is shown to the user with the correct section heading for the selected language.',
          expectedResult:
            'The Popular Truck Brands section is visible and the heading text matches the expected localized heading (for example, “Popular Truck Brands” in English).',
          steps: [
            'Open the homepage for the selected language',
            'Scroll to the Popular Truck Brands section',
            'Verify the section and heading are visible',
          ],
        });

        allureStep('Verify Popular Truck Brands section and heading are visible', () => {
          page.verifySectionVisible();
        });
      }
    );

    it(
      'TC-PTB-02: all popular brand cards show name, logo, title and brand URL',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-PTB-02',
          title: 'All popular brand cards show name, logo, title and brand URL',
          language: lang,
          description:
            'In the Popular Truck Brands section, verify every brand card shown on this device displays the brand name, logo image, accessible title, and link to that brand’s page. Desktop shows 12 brands; mobile shows the first 6 of that same list (the extra cards are not in the page at all on mobile).',
          expectedResult:
            'Each brand the current device actually displays appears once with the correct visible name, logo, title attribute, and href pointing to the brand page for that language. The number of cards matches this device (12 on desktop, 6 on mobile).',
          steps: [
            'Open the Popular Truck Brands section',
            'For each brand shown on this device, verify name, logo, title and URL',
            'Confirm the total number of brand cards matches this device, not the other device’s count',
          ],
        });

        allureStep('Verify all popular brand cards show name, logo, title and URL', () => {
          page.verifyAllBrandCardsPresent();
        });
      }
    );

    it(
      'TC-PTB-03: no duplicate brand cards appear in Popular Truck Brands',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-PTB-03',
          title: 'No duplicate brand cards appear in Popular Truck Brands',
          language: lang,
          description:
            'Check that the Popular Truck Brands grid does not show the same brand more than once (by URL, title, or visible name).',
          expectedResult:
            'All brand card URLs, titles, and visible brand names in the section are unique — no duplicate brand appears.',
          steps: [
            'Open the Popular Truck Brands section',
            'Collect brand URLs, titles and names from all cards',
            'Verify each list has no duplicates',
          ],
        });

        allureStep('Verify no duplicate brand cards are shown', () => {
          page.verifyNoDuplicateBrands();
        });
      }
    );

    it(
      'TC-PTB-04: no broken brand logos appear in Popular Truck Brands',
      { tags: langTags(lang, TEST_TAGS.EDGE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-PTB-04',
          title: 'No broken brand logos appear in Popular Truck Brands',
          language: lang,
          description:
            'Verify every brand logo image in the Popular Truck Brands section loads successfully and is not broken or missing.',
          expectedResult:
            'Each brand card logo has a valid image URL and the image finishes loading with a non-zero size (logo is visible to the user).',
          steps: [
            'Open the Popular Truck Brands section',
            'For each brand card, check the logo image source',
            'Confirm each logo image has loaded successfully',
          ],
        });

        allureStep('Verify all brand logos load without broken images', () => {
          page.verifyNoBrokenBrandLogos();
        });
      }
    );

    it(
      'TC-PTB-05: clicking each popular brand card navigates to that brand page',
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        documentTestCase({
          id: 'TC-PTB-05',
          title: 'Clicking each popular brand card navigates to that brand page',
          language: lang,
          description:
            'From the Popular Truck Brands section, click each brand card shown on this device and confirm the user is taken to the correct brand listing page for that brand and language. Mobile only shows the first 6 brands, so only those 6 are clicked.',
          expectedResult:
            'After each shown brand card click, the browser URL path is /{language}/{brand-slug} for that brand (real navigation to the brand page).',
          steps: [
            'Open the Popular Truck Brands section',
            'Click each brand card in turn',
            'Verify navigation to the matching brand page URL',
            'Return to the homepage and continue with the next brand',
          ],
        });

        allureStep('Click each brand card and verify brand page navigation', () => {
          page.verifyEachBrandCardNavigatesToBrandPage();
        });
      }
    );

    it(
      'TC-PTB-06: View All Brands link navigates to the brands listing page',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-PTB-06',
          title: 'View All Brands link navigates to the brands listing page',
          language: lang,
          description:
            'Locate the View All Brands link near the Popular Truck Brands section and open it to confirm it leads to the full brands listing page.',
          expectedResult:
            'The View All Brands link is visible with the correct label and href, and clicking it navigates to /{language}/brands.',
          steps: [
            'Open the Popular Truck Brands section',
            'Verify the View All Brands link label and URL',
            'Click View All Brands',
            'Verify the brands listing page opens',
          ],
        });

        allureStep('Click View All Brands and verify brands listing page opens', () => {
          page.verifyViewAllBrandsNavigates();
        });
      }
    );

    it(
      'TC-PTB-07: Popular Truck Brands shows no card for a nonexistent brand',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE) },
      () => {
        documentTestCase({
          id: 'TC-PTB-07',
          title: 'Popular Truck Brands shows no card for a nonexistent brand',
          language: lang,
          description: 'Confirm no brand card links to a made-up, nonexistent brand slug.',
          expectedResult: 'Zero brand cards match a nonexistent brand slug.',
          steps: [
            'Open the Popular Truck Brands section',
            'Look for a card linking to a nonexistent brand slug',
            'Verify none exists',
          ],
        });

        allureStep('Verify no card exists for a nonexistent brand', () => {
          page.scrollToSection();
          page.getBrandCardBySlug('this-brand-does-not-exist').should('not.exist');
        });
      }
    );
  });
});
