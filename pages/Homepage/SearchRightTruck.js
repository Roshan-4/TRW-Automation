const searchRightTruckData = require('../../testData/HomePage/SearchRightTruckData.json');

const LANG_HOME_PATH = {
  en: '/',
  hi: '/hi',
  ta: '/ta',
};

const exactText = (text) =>
  new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);

const STICKY_HEADER_OFFSET = 140;
const ACTIVE_TAB_CLASS = 'border-[#244052]';

/**
 * Page object for the homepage "Search The Right Truck" hero form.
 * Locators are based on the live DOM captured with Playwright:
 * semantic elements, exact localized text, option values/placeholders and hrefs.
 * Generated CSS-module/Tailwind classes and positional selectors are avoided.
 * Cypress scrollBehavior is disabled — every interaction scrolls explicitly.
 */
class SearchRightTruck {
  constructor(lang = 'en') {
    this.lang = lang;
    this.pageUrl = LANG_HOME_PATH[lang] || '/';
    this.data = searchRightTruckData;
    this.copy = searchRightTruckData.SearchRightTruck[lang];
    this.brands = searchRightTruckData.Brands;
    this.bodyTypes = searchRightTruckData.BodyTypes[lang];
    this.budgets = searchRightTruckData.Budget[lang];
  }

  static get supportedLanguages() {
    return Object.keys(searchRightTruckData.SearchRightTruck);
  }

  static getData() {
    return searchRightTruckData;
  }

  navigate() {
    cy.visit(this.pageUrl);
    cy.document().its('readyState').should('eq', 'complete');
    this.dismissBlockingOverlays();
    this.scrollToForm();
  }

  dismissBlockingOverlays() {
    // Cookie / consent / location prompts (best-effort; ignore if absent).
    cy.get('body').then(($body) => {
      const dismissTexts = [/accept/i, /agree/i, /got it/i, /allow/i, /close/i, /ठीक/i];
      dismissTexts.forEach((pattern) => {
        const btn = $body.find('button').filter((_, el) => pattern.test(el.textContent || ''));
        if (btn.length) {
          cy.wrap(btn.first()).click({ force: true });
        }
      });
    });
  }

  /** Explicit test-wise scroll — keep the form below the sticky topbar. */
  scrollToForm() {
    this.getFormTitle()
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('exist');
  }

  getForm() {
    return this.getFormTitle().parent();
  }

  withinForm(callback) {
    this.getForm().within(callback);
  }

  getFormTitle() {
    return cy.contains('h1', exactText(this.copy.heroFormTitle));
  }

  openTab(tabLabel) {
    this.scrollToForm();
    this.getFormTitle().then(($heading) => {
      const isActive = (el) => (el.getAttribute('class') || '').includes(ACTIVE_TAB_CLASS);
      const clickTab = () => {
        const button = Cypress.$($heading)
          .parent()
          .find('button')
          .filter((_, el) => (el.textContent || '').trim() === tabLabel)
          .get(0);
        if (button) {
          button.click();
        }
      };

      clickTab();

      cy.wrap($heading, { log: false })
        .parent()
        .contains('button', exactText(tabLabel))
        .should(($btn) => {
          if (!isActive($btn[0])) {
            clickTab();
          }
          expect(
            isActive($btn[0]),
            `Expected the "${tabLabel}" tab to be selected`
          ).to.eq(true);
        });
    });
    this.logCurrentTabAndDropdowns(tabLabel);
  }

  /**
   * Prints which tab is active and the visible dropdown placeholder labels
   * so non-technical reviewers can confirm Brand / Body Type / Budget switches.
   */
  logCurrentTabAndDropdowns(expectedTab) {
    this.getFormTitle().then(($heading) => {
      const $form = Cypress.$($heading).parent();
      const activeTab =
        $form
          .find('button')
          .filter((_, el) => (el.getAttribute('class') || '').includes(ACTIVE_TAB_CLASS))
          .first()
          .text()
          .trim() || '(none)';
      const placeholders = [...$form.find('select:visible')]
        .map((select) => {
          const blank = select.querySelector('option[value=""]');
          return blank ? (blank.textContent || '').trim() : '(no placeholder)';
        })
        .filter(Boolean);
      const placeholderText = placeholders.length
        ? placeholders.map((label, index) => `Dropdown ${index + 1}: "${label}"`).join(' | ')
        : 'No visible dropdowns';

      const summary = `Tab switched to "${expectedTab}" (active UI tab: "${activeTab}") → ${placeholderText}`;
      cy.log(summary);
      cy.task('log', `[SearchRightTruck] ${summary}`, { log: false });
    });
  }

  openBrandTab() {
    this.openTab(this.copy.heroFormBrand);
  }

  openBodyTypeTab() {
    this.openTab(this.copy.heroFormBodyType);
  }

  openBudgetTab() {
    this.openTab(this.copy.heroFormBudget);
  }

  getSelectByPlaceholder(placeholder) {
    return cy
      .get('select:visible', { log: false })
      .filter((_, el) => {
        const blank = el.querySelector('option[value=""]');
        return Boolean(blank) && (blank.textContent || '').trim() === placeholder;
      })
      .first();
  }

  getBrandSelect() {
    // Brand slugs are language-independent; Tata is always present on the Brand tab.
    return cy.get('select:has(option.brand-options[value="tata"])', { log: false });
  }

  getModelSelect() {
    return this.getSelectByPlaceholder(this.copy.heroSelectModel);
  }

  getBodyTypeSelect() {
    return cy.get('select:has(option.body-type-options)', { log: false });
  }

  getBudgetSelect() {
    return cy.get('select:has(option.budget-options)', { log: false });
  }

  setSelectValue($heading, findSelect, value, friendlyName = 'dropdown') {
    const apply = () => {
      const el = findSelect(Cypress.$($heading).parent()).get(0);
      if (!el) {
        return;
      }
      const option = [...el.options].find((opt) => opt.value === value);
      if (!option) {
        return;
      }
      const descriptor = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value');
      descriptor.set.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    apply();
    cy.wrap($heading, { log: false })
      .parent()
      .should(($form) => {
        const $select = findSelect($form);
        if (!$select.length || $select.val() !== value) {
          apply();
        }
        const refreshed = findSelect(Cypress.$($heading).parent());
        const label = (refreshed.find('option:selected').text() || '').trim();
        const actual = refreshed.val();
        expect(
          actual,
          `${friendlyName} should be selected (expected "${value}", shown as "${label}")`
        ).to.eq(value);
      });
  }

  selectBrandBySlug(brandSlug) {
    this.openBrandTab();
    this.getFormTitle().then(($heading) => {
      this.setSelectValue(
        $heading,
        ($form) => $form.find('select:has(option.brand-options[value="tata"])'),
        brandSlug,
        'Select Brand'
      );
    });
  }

  selectModelBySlug(modelSlug) {
    this.getModelSelect()
      .find(`option[value="${modelSlug}"]`)
      .should('exist');
    this.getFormTitle().then(($heading) => {
      this.setSelectValue(
        $heading,
        ($form) =>
          $form.find('select').filter((_, el) => el.querySelector(`option[value="${modelSlug}"]`)),
        modelSlug,
        'Select Model'
      );
    });
  }

  selectBodyTypeBySlug(bodyTypeSlug) {
    this.openBodyTypeTab();
    this.getFormTitle().then(($heading) => {
      this.setSelectValue(
        $heading,
        ($form) => $form.find('select:has(option.body-type-options)'),
        bodyTypeSlug,
        'Select Body Type'
      );
    });
  }

  selectBudgetByLabel(budgetLabel) {
    this.openBudgetTab();
    this.getFormTitle().then(($heading) => {
      const valueOf = ($form) => {
        const $select = $form.find('select:has(option.budget-options)');
        const $opt = $select.find('option').filter((_, el) => (el.textContent || '').trim() === budgetLabel);
        return { $select, value: $opt.attr('value') };
      };
      const apply = () => {
        const { $select, value } = valueOf(Cypress.$($heading).parent());
        const el = $select.get(0);
        if (!el || value == null) {
          return;
        }
        const descriptor = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value');
        descriptor.set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      apply();
      cy.wrap($heading, { log: false })
        .parent()
        .then(($form) => {
          const { $select } = valueOf($form);
          let selectedText = $select.find('option:selected').text().trim();
          if (selectedText !== budgetLabel) {
            apply();
            selectedText = valueOf(Cypress.$($heading).parent()).$select.find('option:selected').text().trim();
          }
          expect(
            selectedText,
            `Select Budget should show "${budgetLabel}"`
          ).to.eq(budgetLabel);
        });
    });
  }

  clickSearch() {
    this.scrollToForm();
    this.getFormTitle().then(($heading) => {
      const button = Cypress.$($heading)
        .parent()
        .find(`button[title="${this.copy.heroSearchButton}"]`)
        .get(0);
      if (button) {
        button.click();
      }
    });
  }

  clickSearchUntilUrlIncludes(fragment) {
    this.scrollToForm();
    this.getFormTitle().then(($heading) => {
      const click = () => {
        const $form = Cypress.$($heading).parent();
        const select = $form.find('select:has(option.brand-options[value="tata"])').get(0);
        if (select && select.querySelector(`option[value="${fragment}"]`)) {
          [...select.options].forEach((opt) => {
            opt.selected = opt.value === fragment;
          });
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const button = $form.find(`button[title="${this.copy.heroSearchButton}"]`).get(0);
        if (button) {
          button.click();
        }
      };
      click();
      cy.url().should((url) => {
        if (!url.includes(fragment)) {
          click();
        }
        expect(url).to.include(fragment);
      });
    });
  }

  verifySelectedBrand(brandSlug, brandLabel) {
    this.withinForm(() => {
      this.getBrandSelect().then(($select) => {
        const shownLabel = ($select.find('option:selected').text() || '').trim();
        const shownValue = $select.val();
        expect(
          shownLabel,
          `Select Brand should display "${brandLabel}"`
        ).to.eq(brandLabel);
        expect(
          shownValue,
          `Select Brand should keep "${brandLabel}" selected`
        ).to.eq(brandSlug);
        cy.log(`Selected brand shown in dropdown: "${shownLabel}"`);
      });
    });
  }

  expectedBrandPagePath(brandSlug) {
    return `/${this.lang}/${brandSlug}`;
  }

  verifyBrandPageUrl(brandSlug) {
    const expectedPath = this.expectedBrandPagePath(brandSlug);
    cy.location('pathname').then((pathname) => {
      expect(
        pathname,
        `After Search, user should land on the "${brandSlug}" brand page (URL path ${expectedPath})`
      ).to.eq(expectedPath);
    });
  }

  clickFindAllTrucks() {
    this.scrollToForm();
    this.withinForm(() => {
      cy.get(`a[href="/${this.lang}/new-trucks"]`)
        .should('contain.text', this.copy.herofindAllTrucks)
        .click({ force: true });
    });
  }

  verifyFormLabelsVisible() {
    this.scrollToForm();
    this.getFormTitle().should('be.visible');
    this.withinForm(() => {
      cy.contains('button', exactText(this.copy.heroFormBrand)).should('be.visible');
      cy.contains('button', exactText(this.copy.heroFormBodyType)).should('be.visible');
      cy.contains('button', exactText(this.copy.heroFormBudget)).should('be.visible');
      cy.contains('button', exactText(this.copy.heroSearchButton)).should('be.visible');
      cy.get(`a[href="/${this.lang}/new-trucks"]`)
        .should('contain.text', this.copy.herofindAllTrucks)
        .and('be.visible');
    });
  }

  verifyActiveTab(tabLabel) {
    this.getForm()
      .contains('button', exactText(tabLabel))
      .should(($btn) => {
        const active = ($btn.attr('class') || '').includes(ACTIVE_TAB_CLASS);
        expect(active, `Expected the "${tabLabel}" tab to be selected`).to.eq(true);
      });
  }

  verifySelectPlaceholderVisible(placeholder) {
    this.getSelectByPlaceholder(placeholder).then(($select) => {
      expect($select.is(':visible'), `Dropdown "${placeholder}" should be visible`).to.eq(true);
      const blankText = ($select.find('option[value=""]').text() || '').trim();
      expect(
        blankText,
        `Dropdown placeholder should read "${placeholder}"`
      ).to.eq(placeholder);
      cy.log(`Found dropdown placeholder: "${blankText}"`);
    });
  }

  verifyBrandTabPlaceholders() {
    this.openBrandTab();
    this.verifyActiveTab(this.copy.heroFormBrand);
    this.withinForm(() => {
      this.verifySelectPlaceholderVisible(this.copy.heroSelectBrand);
      this.verifySelectPlaceholderVisible(this.copy.heroSelectModel);
    });
  }

  verifyBodyTypeTabFields() {
    this.openBodyTypeTab();
    this.verifyActiveTab(this.copy.heroFormBodyType);
    this.withinForm(() => {
      this.verifySelectPlaceholderVisible(this.copy.heroSelectBodyType);
      this.verifySelectPlaceholderVisible(this.copy.heroSelectBrand);
    });
  }

  verifyBudgetTabFields() {
    this.openBudgetTab();
    this.verifyActiveTab(this.copy.heroFormBudget);
    this.withinForm(() => {
      this.verifySelectPlaceholderVisible(this.copy.heroSelectBudget);
      this.verifySelectPlaceholderVisible(this.copy.heroSelectBrand);
    });
  }

  verifyBodyTypeTabPlaceholder() {
    this.verifyBodyTypeTabFields();
  }

  verifyBudgetTabPlaceholder() {
    this.verifyBudgetTabFields();
  }

  /**
   * TC-SRT-01: section visibility, heading, three tabs, Brand default,
   * and per-tab dropdown fields for Brand / Body Type / Budget.
   */
  verifySectionTabsFieldsAndDefaultState() {
    this.scrollToForm();
    this.getForm().should('be.visible');
    this.getFormTitle().should('be.visible').and('have.text', this.copy.heroFormTitle);

    this.withinForm(() => {
      cy.contains('button', exactText(this.copy.heroFormBrand)).should('be.visible');
      cy.contains('button', exactText(this.copy.heroFormBodyType)).should('be.visible');
      cy.contains('button', exactText(this.copy.heroFormBudget)).should('be.visible');
    });

    cy.log('Checking default Brand tab fields');
    this.verifyActiveTab(this.copy.heroFormBrand);
    this.logCurrentTabAndDropdowns(this.copy.heroFormBrand);
    this.withinForm(() => {
      this.verifySelectPlaceholderVisible(this.copy.heroSelectBrand);
      this.verifySelectPlaceholderVisible(this.copy.heroSelectModel);
    });

    cy.log('Switching to Body Type tab');
    this.verifyBodyTypeTabFields();

    cy.log('Switching to Budget tab');
    this.verifyBudgetTabFields();

    cy.log('Switching back to Brand tab');
    this.verifyBrandTabPlaceholders();
  }

  getBrandKeys() {
    return Object.keys(this.brands);
  }

  /**
   * TC-SRT-02: every brand in test data → Search → matching brand page.
   */
  searchAllBrandsAndVerifyBrandPages() {
    this.getBrandKeys().forEach((brandKey, index) => {
      if (index > 0) {
        this.navigate();
      }
      this.searchBrandAndVerifyBrandPage(brandKey);
    });
  }

  /**
   * TC-SRT-02: select brand, confirm selection, Search → brand listing page.
   */
  searchBrandAndVerifyBrandPage(brandKey) {
    const brand = this.getBrand(brandKey);
    const brandLabel = this.getBrandLabel(brandKey);
    cy.task('log', `[SearchRightTruck] Brand-only search for "${brandLabel}" (${brand.slug})`, {
      log: false,
    });
    this.selectBrandBySlug(brand.slug);
    this.verifySelectedBrand(brand.slug, brandLabel);
    this.clickSearchUntilBrandPage(brand.slug);
    this.verifyBrandPageUrl(brand.slug);
  }

  clickSearchUntilBrandPage(brandSlug) {
    const expectedPath = this.expectedBrandPagePath(brandSlug);
    this.scrollToForm();
    this.getFormTitle().then(($heading) => {
      const click = () => {
        const $form = Cypress.$($heading).parent();
        const select = $form.find('select:has(option.brand-options[value="tata"])').get(0);
        if (select) {
          const descriptor = Object.getOwnPropertyDescriptor(
            window.HTMLSelectElement.prototype,
            'value'
          );
          descriptor.set.call(select, brandSlug);
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const button = $form.find(`button[title="${this.copy.heroSearchButton}"]`).get(0);
        if (button) {
          button.click();
        }
      };
      click();
      cy.location('pathname').should((pathname) => {
        if (pathname !== expectedPath) {
          if (Cypress.$('h1').filter((_, el) => (el.textContent || '').trim() === this.copy.heroFormTitle).length) {
            click();
          }
        }
        expect(
          pathname,
          `After Search with brand only, user should open the brand page "${expectedPath}"`
        ).to.eq(expectedPath);
      });
    });
  }

  expectedModelPagePath(brandSlug, modelSlug) {
    return `/${this.lang}/${brandSlug}-truck/${modelSlug}`;
  }

  verifySelectedModel(modelSlug, modelLabel) {
    this.getModelSelect().then(($select) => {
      const shownLabel = ($select.find('option:selected').text() || '').trim();
      const shownValue = $select.val();
      expect(
        shownValue,
        `Select Model should keep "${modelLabel}" selected`
      ).to.eq(modelSlug);
      expect(
        shownLabel,
        `Select Model should display a model name for "${modelLabel}"`
      ).to.not.equal('');
      expect(
        shownLabel,
        `Select Model should not remain on "${this.copy.heroSelectModel}"`
      ).to.not.eq(this.copy.heroSelectModel);
      cy.log(`Selected model shown in dropdown: "${shownLabel}"`);
    });
  }

  verifyModelPageUrl(brandSlug, modelSlug, modelLabel) {
    const expectedPath = this.expectedModelPagePath(brandSlug, modelSlug);
    cy.location('pathname').then((pathname) => {
      expect(
        pathname,
        `After Search, user should land on the "${modelLabel}" model page (URL path ${expectedPath})`
      ).to.eq(expectedPath);
    });
  }

  clickSearchUntilModelPage(brandSlug, modelSlug, modelLabel) {
    const expectedPath = this.expectedModelPagePath(brandSlug, modelSlug);
    this.scrollToForm();
    this.getFormTitle().then(($heading) => {
      const nativeSet = (el, value) => {
        if (!el) {
          return;
        }
        const descriptor = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value');
        descriptor.set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const click = () => {
        const $form = Cypress.$($heading).parent();
        const brandSelect = $form.find('select:has(option.brand-options[value="tata"])').get(0);
        nativeSet(brandSelect, brandSlug);
        const modelSelect = [...$form.find('select')].find((el) =>
          el.querySelector(`option[value="${modelSlug}"]`)
        );
        nativeSet(modelSelect, modelSlug);
        const button = $form.find(`button[title="${this.copy.heroSearchButton}"]`).get(0);
        if (button) {
          button.click();
        }
      };
      click();
      cy.location('pathname').should((pathname) => {
        if (pathname !== expectedPath) {
          if (Cypress.$('h1').filter((_, el) => (el.textContent || '').trim() === this.copy.heroFormTitle).length) {
            click();
          }
        }
        expect(
          pathname,
          `After Search with brand and model, user should open the "${modelLabel}" model page "${expectedPath}"`
        ).to.eq(expectedPath);
      });
    });
  }

  /**
   * TC-SRT-03: brand + model → model PDP for every brand/model in test data.
   */
  searchBrandModelAndVerifyModelPage(brandKey, model) {
    const brand = this.getBrand(brandKey);
    const brandLabel = this.getBrandLabel(brandKey);
    cy.task(
      'log',
      `[SearchRightTruck] Brand+Model search: "${brandLabel}" + "${model.name}" → ${brand.slug}-truck/${model.slug}`,
      { log: false }
    );
    this.selectBrandBySlug(brand.slug);
    this.verifySelectedBrand(brand.slug, brandLabel);
    this.waitForModelOptionsAfterBrand(brand.slug, model.slug);
    this.selectModelBySlug(model.slug);
    this.verifySelectedModel(model.slug, model.name);
    this.clickSearchUntilModelPage(brand.slug, model.slug, model.name);
    this.verifyModelPageUrl(brand.slug, model.slug, model.name);
  }

  waitForModelOptionsAfterBrand(brandSlug, modelSlug) {
    this.getFormTitle().then(($heading) => {
      cy.wrap($heading, { log: false })
        .parent()
        .should(($form) => {
          const brandSelect = $form.find('select:has(option.brand-options[value="tata"])').get(0);
          if (brandSelect) {
            const descriptor = Object.getOwnPropertyDescriptor(
              window.HTMLSelectElement.prototype,
              'value'
            );
            descriptor.set.call(brandSelect, brandSlug);
            brandSelect.dispatchEvent(new Event('input', { bubbles: true }));
            brandSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }

          const modelSelect = [...$form.find('select')].find((el) => {
            const blank = el.querySelector('option[value=""]');
            return blank && (blank.textContent || '').trim() === this.copy.heroSelectModel;
          });
          const optionCount = modelSelect ? modelSelect.options.length : 0;
          const hasModel = Boolean(modelSelect && modelSelect.querySelector(`option[value="${modelSlug}"]`));
          expect(
            optionCount,
            `Select Model should list models after choosing brand "${brandSlug}"`
          ).to.be.greaterThan(1);
          expect(
            hasModel,
            `Select Model should include "${modelSlug}" after choosing brand "${brandSlug}"`
          ).to.eq(true);
        });
    });
  }

  searchAllBrandModelsAndVerifyModelPages() {
    let isFirst = true;
    this.getBrandKeys().forEach((brandKey) => {
      this.getTopModels(brandKey).forEach((model) => {
        if (!isFirst) {
          this.navigate();
        }
        isFirst = false;
        this.searchBrandModelAndVerifyModelPage(brandKey, model);
      });
    });
  }

  verifyErrorMessage(message) {
    this.getFormTitle().then(($heading) => {
      const clickSearch = () => {
        const button = Cypress.$($heading)
          .parent()
          .find(`button[title="${this.copy.heroSearchButton}"]`)
          .get(0);
        if (button) {
          button.click();
        }
      };
      cy.wrap($heading, { log: false })
        .parent()
        .should(($form) => {
          if (!$form.find('span').filter((_, el) => (el.textContent || '').trim() === message).length) {
            clickSearch();
          }
          expect(
            $form.find('span').filter((_, el) => (el.textContent || '').trim() === message).length,
            `error "${message}"`
          ).to.be.greaterThan(0);
        });
    });
  }

  verifyBrandOptionPresent(brandSlug, brandLabel) {
    this.openBrandTab();
    this.withinForm(() => {
      this.getBrandSelect()
        .find(`option[value="${brandSlug}"]`)
        .should('have.text', brandLabel);
    });
  }

  /**
   * Confirmed live: after selecting a brand, the Model dropdown's options
   * are populated asynchronously, and for brands with a large model catalog
   * (e.g. Eicher, 92 models) this can take well over the default 15s
   * command timeout — anywhere from under a second to 20+ seconds observed
   * across repeated runs, not a fixed/predictable delay. A longer
   * `.should()` timeout (still a real, dynamically-retried assertion, not a
   * fixed wait) rides out that variance instead of failing on a slow but
   * genuine population.
   */
  verifyModelOptionsInclude(modelSlugs) {
    this.withinForm(() => {
      modelSlugs.forEach((slug) => {
        this.getModelSelect().find(`option[value="${slug}"]`, { timeout: 30000 }).should('exist');
      });
    });
  }

  verifyBodyTypeOptionPresent(bodyTypeSlug, bodyTypeLabel) {
    this.openBodyTypeTab();
    this.withinForm(() => {
      this.getBodyTypeSelect()
        .find(`option[value="${bodyTypeSlug}"]`)
        .should('have.text', bodyTypeLabel);
    });
  }

  verifyBudgetOptionPresent(budgetLabel) {
    this.openBudgetTab();
    this.withinForm(() => {
      this.getBudgetSelect().contains('option', exactText(budgetLabel)).should('exist');
    });
  }

  getBrand(brandKey) {
    return this.brands[brandKey];
  }

  getBrandLabel(brandKey) {
    return this.brands[brandKey][this.lang];
  }

  getTopModels(brandKey) {
    return this.brands[brandKey].top5Models[this.lang];
  }
}

module.exports = SearchRightTruck;
