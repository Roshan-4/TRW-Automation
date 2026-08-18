const SearchRightTruck = require('../../../../pages/Homepage/SearchRightTruck');
const { TEST_TAGS } = require('../../../../constants/constants');

const LANGUAGES = SearchRightTruck.supportedLanguages;
const SAMPLE_BRAND_KEYS = ['tata', 'ashok-leyland', 'mahindra'];

/**
 * Tag helpers for @cypress/grep
 * - Run one language:  npm run test:en  |  npm run cypress:run:tags --tags=@en
 * - Run all languages: npm run test:language
 * - Combine:           grepTags=@en+@positive
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.HOMEPAGE,
  TEST_TAGS.SEARCH_RIGHT_TRUCK,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  ...extra,
];

LANGUAGES.forEach((lang) => {
  describe(`Homepage - SearchRightTruck [${lang}]`, { tags: langTags(lang) }, () => {
    const page = new SearchRightTruck(lang);
    const copy = page.copy;
    const errors = copy.errorMessages;

    beforeEach(() => {
      page.navigate();
    });

    // ── Positive ───────────────────────────────────────────────────────────

    it(
      'TC-SRT-01: Search The Right Truck section shows tabs, fields and Brand active by default',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        page.verifySectionTabsFieldsAndDefaultState();
      }
    );

    it(
      'TC-SRT-02: Verify Only Brand selection navigates to brand page',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        page.searchAllBrandsAndVerifyBrandPages();
      }
    );

    it(
      'TC-SRT-03: Verify brand and model selection navigates to model PDP page',
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        page.searchAllBrandModelsAndVerifyModelPages();
      }
    );

    it(
      'TC-SRT-04: searches by body type and lands on a body-type result URL',
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        const bodyType = page.bodyTypes[0];
        page.selectBodyTypeBySlug(bodyType.slug);
        page.clickSearchUntilUrlIncludes(bodyType.slug);
      }
    );

    it(
      'TC-SRT-05: searches by budget and navigates away from the homepage form',
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        const budget = page.budgets[1];
        page.selectBudgetByLabel(budget.name);
        cy.url().then((startUrl) => {
          page.clickSearch();
          cy.url().should('not.eq', startUrl);
        });
      }
    );

    it(
      'TC-SRT-06: navigates via Find All Trucks to the new trucks listing',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        page.clickFindAllTrucks();
        cy.url().should('include', 'new-trucks');
        if (lang === 'en') {
          cy.url().should('include', '/en/');
        } else {
          cy.url().should('include', `/${lang}/`);
        }
      }
    );

    // ── Negative ───────────────────────────────────────────────────────────

    it(
      'TC-SRT-07: shows brand/model error when Search is clicked with no brand selection',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE) },
      () => {
        page.openBrandTab();
        page.clickSearch();
        page.verifyErrorMessage(errors.selectBrandOrModel);
        cy.url().should('include', page.pageUrl === '/' ? 'tractorjunction.com' : page.pageUrl);
      }
    );

    it(
      'TC-SRT-08: shows body-type/brand error when Search is clicked with no body type selected',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE) },
      () => {
        page.openBodyTypeTab();
        page.clickSearch();
        page.verifyErrorMessage(errors.selectBodyTypeOrBrand);
      }
    );

    it(
      'TC-SRT-09: shows budget/brand error when Search is clicked with no budget selected',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE) },
      () => {
        page.openBudgetTab();
        page.clickSearch();
        page.verifyErrorMessage(errors.selectBudgetOrBrand);
      }
    );

    // ── Edge ───────────────────────────────────────────────────────────────

    it(
      'TC-SRT-10: switches tabs and updates select placeholders',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        page.verifyBrandTabPlaceholders();
        page.verifyBodyTypeTabPlaceholder();
        page.verifyBudgetTabPlaceholder();
        page.verifyBrandTabPlaceholders();
      }
    );

    it(
      'TC-SRT-11: lists expected sample brands with localized labels',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        SAMPLE_BRAND_KEYS.forEach((brandKey) => {
          const brand = page.getBrand(brandKey);
          page.verifyBrandOptionPresent(brand.slug, brand[lang]);
        });
      }
    );

    it(
      'TC-SRT-12: loads model options for a brand including top models from test data',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        const brand = page.getBrand('eicher');
        const models = page.getTopModels('eicher');
        page.selectBrandBySlug(brand.slug);
        page.verifyModelOptionsInclude(models.map((m) => m.slug));
      }
    );

    it(
      'TC-SRT-13: lists expected body types with localized labels',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        page.bodyTypes.slice(0, 4).forEach((bodyType) => {
          page.verifyBodyTypeOptionPresent(bodyType.slug, bodyType.name);
        });
      }
    );

    it(
      'TC-SRT-14: lists expected budget ranges with localized labels',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        page.budgets.forEach((budget) => {
          page.verifyBudgetOptionPresent(budget.name);
        });
      }
    );

    it(
      'TC-SRT-15: keeps brand selection usable after switching away and back to Brand tab',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        const brand = page.getBrand('volvo');
        page.selectBrandBySlug(brand.slug);
        page.openBodyTypeTab();
        page.openBrandTab();
        page.withinForm(() => {
          page.getBrandSelect().should('have.value', brand.slug);
        });
      }
    );

    it(
      'TC-SRT-16: does not navigate when Search is double-clicked with empty Brand tab',
      { tags: langTags(lang, TEST_TAGS.EDGE, TEST_TAGS.NEGATIVE) },
      () => {
        page.openBrandTab();
        page.clickSearch();
        page.clickSearch();
        page.verifyErrorMessage(errors.selectBrandOrModel);
        cy.url().then((url) => {
          expect(url).to.match(lang === 'en' ? /tractorjunction\.com\/?$/ : new RegExp(`/${lang}/?$`));
        });
      }
    );
  });
});
