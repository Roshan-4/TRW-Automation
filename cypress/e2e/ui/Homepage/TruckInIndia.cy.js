const TruckInIndia = require('../../../../pages/Homepage/TruckInIndia');
const { TEST_TAGS } = require('../../../../constants/constants');
const { randomNumberGenerator } = require('../../../../helpers/randomNumberGenerator');

const LANGUAGES = TruckInIndia.supportedLanguages;

/**
 * Tag helpers for @cypress/grep
 * - npm run test:truckInIndia
 * - grepTags=@en+@positive  |  @truckInIndia+@smoke
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.HOMEPAGE,
  TEST_TAGS.TRUCK_IN_INDIA,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  ...extra,
];

LANGUAGES.forEach((lang) => {
  describe(`Homepage - TruckInIndia [${lang}]`, { tags: langTags(lang) }, () => {
    const page = new TruckInIndia(lang);
    const lead = () => page.leadFormCopy;
    const validation = () => page.leadFormCopy.validation;

    beforeEach(() => {
      page.navigate();
    });

    // ── Positive ───────────────────────────────────────────────────────────

    it(
      'TC-TIY-01: section is visible with dynamic year heading Truck in India {year}',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        page.verifySectionVisibleWithYearHeading();
      }
    );

    it(
      'TC-TIY-02: Popular, Latest and Upcoming tabs are visible with Popular active by default',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        page.verifyTabsVisible();
        page.verifyActiveTab('popular');
      }
    );

    it(
      'TC-TIY-03: Popular tab shows truck cards with Check Offers CTA',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        page.openTab('popular');
        page.verifyTruckCardsWithCheckOffers();
        page.verifyCardsHaveTitlePriceAndCta();
      }
    );

    it(
      'TC-TIY-04: View All Popular Trucks link shows label, arrow and popular URL',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        page.openTab('popular');
        page.verifyViewAllLink('popular');
      }
    );

    it(
      'TC-TIY-05: switching to Latest updates View All label and URL for latest trucks',
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        page.openTab('latest');
        page.verifyActiveTab('latest');
        page.verifyViewAllLink('latest');
        page.verifyTruckCardsWithCheckOffers();
      }
    );

    it(
      'TC-TIY-06: switching to Upcoming updates View All label and URL for upcoming trucks',
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        page.openTab('upcoming');
        page.verifyActiveTab('upcoming');
        page.verifyViewAllLink('upcoming');
        page.verifyTruckCardsWithCheckOffers();
      }
    );

    it(
      'TC-TIY-07: Popular tab has no duplicate truck cards',
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        page.openTab('popular');
        page.verifyNoDuplicateVisibleCards();
      }
    );

    it(
      'TC-TIY-17: Popular Check Offers submits lead and shows Thank You modal',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        page.submitCheckOffersLeadFromTab('popular');
      }
    );

    it(
      'TC-TIY-18: Latest Check Offers submits lead and shows Thank You modal',
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        page.submitCheckOffersLeadFromTab('latest');
      }
    );

    it(
      'TC-TIY-19: Upcoming Check Offers submits lead and shows Thank You modal',
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        page.submitCheckOffersLeadFromTab('upcoming');
      }
    );

    // ── Negative ───────────────────────────────────────────────────────────

    it(
      'TC-TIY-08: Latest and Upcoming are not active while Popular is selected',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE) },
      () => {
        page.openTab('popular');
        page.verifyActiveTab('popular');
        page.getTab('latest').should('not.have.class', 'tabsBorder');
        page.getTab('upcoming').should('not.have.class', 'tabsBorder');
      }
    );

    it(
      'TC-TIY-09: View All does not keep Popular URL after switching to Latest',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE) },
      () => {
        const popularHref = page.copy.viewAll.popular.href;
        page.openTab('latest');
        page.getViewAllLink().should('not.have.attr', 'href', popularHref);
        page.verifyViewAllLink('latest');
      }
    );

    it(
      'TC-TIY-10: View All does not keep Popular URL after switching to Upcoming',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE) },
      () => {
        const popularHref = page.copy.viewAll.popular.href;
        page.openTab('upcoming');
        page.getViewAllLink().should('not.have.attr', 'href', popularHref);
        page.verifyViewAllLink('upcoming');
      }
    );

    it(
      'TC-TIY-11: heading year is present and is a four-digit year (not missing or static placeholder)',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE) },
      () => {
        page.getHeading()
          .invoke('text')
          .then((text) => {
            expect(text.trim()).to.match(new RegExp(`^${page.copy.headingPrefix} \\d{4}$`));
            expect(text.trim()).to.not.eq(`${page.copy.headingPrefix} {year}`);
            expect(text.trim()).to.include(String(page.year));
          });
      }
    );

    it(
      'TC-TIY-20: Check Offers lead form shows required validation when submitted empty',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE) },
      () => {
        page.submitCheckOffersLeadExpectingValidation(
          'popular',
          { name: '', mobile: '', city: '', selectCity: false },
          [
            validation().nameRequired,
            validation().mobileRequired,
            validation().locationRequired,
          ]
        );
      }
    );

    it(
      'TC-TIY-21: Check Offers lead form rejects mobile that is not 10 digits',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE) },
      () => {
        page.submitCheckOffersLeadExpectingValidation(
          'popular',
          {
            name: lead().name,
            mobile: lead().invalidMobile,
            city: '',
            selectCity: false,
          },
          [validation().mobileInvalid, validation().locationRequired]
        );
      }
    );

    it(
      'TC-TIY-22: Check Offers lead form requires location even when name and mobile are valid',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE) },
      () => {
        page.submitCheckOffersLeadExpectingValidation(
          'popular',
          {
            name: lead().name,
            mobile: randomNumberGenerator(),
            city: '',
            selectCity: false,
          },
          [validation().locationRequired]
        );
      }
    );

    // ── Edge ───────────────────────────────────────────────────────────────

    it(
      'TC-TIY-12: tab cycle Popular → Latest → Upcoming → Popular restores Popular View All link',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        page.openTab('popular');
        page.verifyViewAllLink('popular');
        page.openTab('latest');
        page.verifyViewAllLink('latest');
        page.openTab('upcoming');
        page.verifyViewAllLink('upcoming');
        page.openTab('popular');
        page.verifyActiveTab('popular');
        page.verifyViewAllLink('popular');
      }
    );

    it(
      'TC-TIY-13: Latest tab has no duplicate truck cards',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        page.openTab('latest');
        page.verifyNoDuplicateVisibleCards();
      }
    );

    it(
      'TC-TIY-14: Upcoming tab has no duplicate truck cards',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        page.openTab('upcoming');
        page.verifyNoDuplicateVisibleCards();
      }
    );

    it(
      'TC-TIY-15: every visible Popular card has title, price and Check Offers CTA',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        page.openTab('popular');
        page.verifyCardsHaveTitlePriceAndCta();
      }
    );

    it(
      'TC-TIY-16: View All link always includes an arrow icon for each tab',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        ['popular', 'latest', 'upcoming'].forEach((tabKey) => {
          page.openTab(tabKey);
          page.getViewAllLink().find('svg').should('exist');
        });
      }
    );
  });
});
