const newTruckPdpData = require('../../testData/PDP/NewTruckPdpData.json');
const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { LeadFormFiller, exactText } = require('../../helpers/leadFormFiller');
const { randomNumberGenerator } = require('../../helpers/randomNumberGenerator');

const STICKY_HEADER_OFFSET = 140;

/**
 * New Truck Product Detail Page.
 *
 * One page object for all New Truck PDPs (most / least popular).
 * Each UI block is its own method so failures stay isolated.
 *
 * Lead forms = reusable methods named from visible CTA short form
 * (GetOffersLead, CheckOffersLead) — never a separate lead page class.
 * Field fill reuses helpers/leadFormFiller.js when name/mobile/city match.
 *
 * Sticky jump links = SecondaryNavbar (div.secondaryNav.sticky).
 *
 * Locators prefer title / visible text / stable class tokens
 * (secondaryNav, sticky) — never CSS-module hashes.
 */
class NewTruckPdp {
  constructor(lang = 'en', productKey = 'mostPopular') {
    this.lang = lang;
    this.productKey = productKey;
    this.product = newTruckPdpData.products[productKey];
    if (!this.product) {
      throw new Error(`Unknown New Truck PDP product key: ${productKey}`);
    }
    this.pageUrl = this.product.path[lang];
    if (!this.pageUrl) {
      throw new Error(`No New Truck PDP path for product=${productKey} lang=${lang}`);
    }

    const sharedLead =
      truckInIndiaData.CheckOffersForm[lang] || truckInIndiaData.CheckOffersForm.en;
    const getOffersLead =
      newTruckPdpData.GetOffersLead[lang] || newTruckPdpData.GetOffersLead.en;
    const checkOffersLead =
      newTruckPdpData.CheckOffersLead[lang] || newTruckPdpData.CheckOffersLead.en;

    this.getOffersLeadCopy = { ...sharedLead, ...getOffersLead };
    this.checkOffersLeadCopy = { ...sharedLead, ...checkOffersLead };
    this.heroCopy = newTruckPdpData.Hero[lang] || newTruckPdpData.Hero.en;
    this.componentsCopy = newTruckPdpData.Components[lang] || newTruckPdpData.Components.en;
    this.secondaryNavbarCopy =
      newTruckPdpData.SecondaryNavbar[productKey]?.[lang] ||
      newTruckPdpData.SecondaryNavbar[productKey]?.en;

    this.getOffersLeadForm = new LeadFormFiller({
      cityPlaceholder: this.getOffersLeadCopy.cityPlaceholder,
      submitText: this.getOffersLeadCopy.submitCta,
    });
    this.checkOffersLeadForm = new LeadFormFiller({
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: this.checkOffersLeadCopy.submitCta,
    });
  }

  static get supportedLanguages() {
    return Object.keys(newTruckPdpData.GetOffersLead);
  }

  static get productKeys() {
    return Object.keys(newTruckPdpData.products);
  }

  get productLabel() {
    return this.product.label;
  }

  get blocks() {
    return this.product.blocks || [];
  }

  hasBlock(blockKey) {
    return this.blocks.includes(blockKey);
  }

  /**
   * @param {{ dismissLaunchLead?: boolean }} options
   */
  navigate({ dismissLaunchLead = true } = {}) {
    cy.visit(this.pageUrl, { timeout: 90000, failOnStatusCode: false });
    cy.document().its('readyState').should('eq', 'complete');
    cy.get('body').should('be.visible');
    if (dismissLaunchLead) {
      this.dismissGetOffersLeadIfVisible();
    }
  }

  /**
   * Close Get Offers / Check Offers lead popup when visible (launch or re-opened).
   */
  dismissGetOffersLeadIfVisible() {
    cy.get('body', { timeout: 25000, log: false }).should(($body) => {
      const hasLead = $body.find('input#name[name="name"]').filter(':visible').length > 0;
      const hasClose =
        $body
          .find(`button[aria-label="${this.getOffersLeadCopy.closeAriaLabel}"]`)
          .filter(':visible').length > 0;
      expect(
        !hasLead || hasClose,
        'Get Offers lead should be closed or Close control available'
      ).to.eq(true);
    });

    cy.get('body', { log: false }).then(($body) => {
      const $name = $body.find('input#name[name="name"]').filter(':visible');
      if (!$name.length) {
        return;
      }
      this.closeGetOffersLead();
    });
  }

  /** @deprecated use dismissGetOffersLeadIfVisible */
  dismissLaunchLeadIfPresent() {
    this.dismissGetOffersLeadIfVisible();
  }

  /**
   * A successful submission can swap the form into a "you may also be
   * interested in" upsell screen (same shared component as
   * pages/UtilityPages/TabbedModelOffers.js) with several interactive
   * elements (alternative-truck cards, a "Receive similar offers" button).
   * Live testing found no reliably distinguishable close control there —
   * every click attempt (by aria-label, by glyph text, by glyph text
   * scoped to the modal and corner-positioned) ended up landing on one of
   * the alternative-truck cards instead and navigating to a *different*
   * truck's PDP entirely, derailing the rest of this truck's shared
   * session. A fresh re-navigation to this same truck's URL sidesteps the
   * screen completely rather than risking another wrong click, matching
   * the fix already proven for TabbedModelOffers.
   */
  dismissThankYouIfVisible() {
    cy.get('body', { log: false }).then(($body) => {
      const isThankYouVisible = $body
        .find('h3')
        .filter((_, el) =>
          exactText(this.getOffersLeadCopy.thankYouHeading).test((el.textContent || '').trim())
        )
        .filter(':visible').length > 0;
      if (!isThankYouVisible) {
        return;
      }
      this.navigate({ dismissLaunchLead: true });
    });
  }

  dismissBlockingOverlays() {
    this.dismissThankYouIfVisible();
    this.dismissGetOffersLeadIfVisible();
  }

  /**
   * Re-open Get Offers lead from hero Check Offers (same session — no cy.visit).
   */
  openGetOffersLeadFromHero() {
    this.openCheckOffersLead();
  }

  clickGetOffersOrCheckOffersSubmit() {
    this.getOffersLeadForm
      .getFormRoot()
      .contains('button', /^(Get Offers|Check Offers)$/i)
      .should('be.visible')
      .then(($btn) => {
        $btn[0].click();
      });
  }

  scrollToHeading(headingText) {
    cy.contains('h2,h3', exactText(headingText), { timeout: 20000, log: false })
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 }, log: false })
      .should('be.visible');
  }

  verifyHeadingVisible(headingText, level = 'h2') {
    cy.contains(level, exactText(headingText), { timeout: 20000, log: false })
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 }, log: false })
      .should('be.visible');
  }

  // --- GetOffersLead (launch popup) ---

  waitForGetOffersLead() {
    this.getOffersLeadForm.getNameInput().should('be.visible');
    cy.contains('p', new RegExp(this.getOffersLeadCopy.titlePrefix, 'i')).should(
      'be.visible'
    );
    this.getOffersLeadForm.getSubmitButton().should('be.visible');
  }

  verifyGetOffersLeadVisible() {
    this.waitForGetOffersLead();
    cy.contains(
      'p',
      exactText(`${this.getOffersLeadCopy.titlePrefix} ${this.productLabel}`)
    ).should('be.visible');
  }

  closeGetOffersLead() {
    const closeSelector = `button[aria-label="${this.getOffersLeadCopy.closeAriaLabel}"]`;

    cy.get('body').then(($body) => {
      const $name = $body.find('input#name[name="name"]');
      if (!$name.length || !$name.is(':visible')) {
        return;
      }

      const clickClose = () => {
        const closeBtn = Cypress.$(closeSelector).filter(':visible').get(0);
        if (closeBtn) {
          closeBtn.click();
        }
      };

      clickClose();
      cy.get('input#name[name="name"]').should(($input) => {
        if ($input.is(':visible')) {
          clickClose();
        }
        expect(
          $input.is(':visible'),
          'Get Offers lead should be closed after clicking Cross'
        ).to.eq(false);
      });
    });
  }

  submitGetOffersLead(overrides = {}) {
    this.waitForGetOffersLead();
    this.getOffersLeadForm.fillFields({
      name: overrides.name ?? this.getOffersLeadCopy.name,
      city: overrides.city ?? this.getOffersLeadCopy.city,
      mobile: overrides.mobile ?? randomNumberGenerator(),
      selectCity: true,
    });
    this.getOffersLeadForm.fillPriceOrBudgetIfPresent(overrides.priceBudget);
    this.clickGetOffersOrCheckOffersSubmit();
    this.verifyGetOffersLeadSubmitted();
  }

  submitGetOffersLeadExpectingValidation(fields, expectedMessages) {
    this.waitForGetOffersLead();
    this.getOffersLeadForm.fillFields(fields);
    this.clickGetOffersOrCheckOffersSubmit();
    this.getOffersLeadForm.verifyValidationMessages(expectedMessages);
    this.verifyGetOffersLeadNotSubmitted();
  }

  verifyGetOffersLeadSubmitted() {
    cy.contains('h3', exactText(this.getOffersLeadCopy.thankYouHeading)).should(
      'be.visible'
    );
    cy.contains('p', exactText(this.getOffersLeadCopy.interestedIn)).should(
      'be.visible'
    );
  }

  verifyGetOffersLeadNotSubmitted() {
    cy.contains('h3', exactText(this.getOffersLeadCopy.thankYouHeading)).should(
      'not.exist'
    );
    this.getOffersLeadForm.getNameInput().should('be.visible');
  }

  // --- CheckOffersLead (hero / in-page Check Offers CTA) ---

  openCheckOffersLead() {
    cy.contains('h1', exactText(this.productLabel))
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('be.visible');

    const clickHeroCheckOffers = () => {
      const $onRoad = Cypress.$(
        `button[title="${this.heroCopy.getOnRoadPriceCta}"], a[title="${this.heroCopy.getOnRoadPriceCta}"]`
      )
        .filter(':visible')
        .first();
      const $heroCheckOffers = $onRoad
        .parent()
        .find(`button[title="${this.heroCopy.checkOffersCta}"]`)
        .filter(':visible')
        .first();
      const $btn = $heroCheckOffers.length ? $heroCheckOffers : Cypress.$(
        `button[title="${this.heroCopy.checkOffersCta}"]`
      )
        .filter(':visible')
        .not('.slick-cloned *')
        .first();
      if ($btn.length) {
        $btn[0].click();
      }
    };

    clickHeroCheckOffers();
    cy.get('input#name[name="name"]').should(($input) => {
      if (!$input.is(':visible')) {
        clickHeroCheckOffers();
      }
      expect($input.is(':visible'), 'Check Offers lead form should be visible').to.eq(true);
    });
  }

  submitCheckOffersLead(overrides = {}) {
    this.openCheckOffersLead();
    this.checkOffersLeadForm.fillAndSubmit({
      name: this.checkOffersLeadCopy.name,
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    cy.contains('h3', exactText(this.checkOffersLeadCopy.thankYouHeading)).should(
      'be.visible'
    );
  }

  // --- SecondaryNavbar ---

  getSecondaryNavbar() {
    return cy
      .get('div.secondaryNav.sticky', { timeout: 20000, log: false })
      .should('be.visible');
  }

  verifySecondaryNavbar() {
    const items = this.secondaryNavbarCopy?.items || [];
    cy.get('div.secondaryNav.sticky', { timeout: 20000, log: false }).should(($nav) => {
      expect($nav.is(':visible'), 'SecondaryNavbar should be visible').to.eq(true);
      items.forEach((item) => {
        const match = $nav
          .find('a, div, span, button')
          .filter((_, el) => exactText(item).test((el.textContent || '').trim()));
        expect(
          match.length,
          `SecondaryNavbar should show the "${item}" jump link for ${this.productLabel}`
        ).to.be.greaterThan(0);
      });
    });
  }

  // --- Hero ---

  verifyHero() {
    cy.contains('h1', exactText(this.productLabel), { timeout: 20000 }).should(
      'be.visible'
    );
    cy.get(
      `button[title="${this.heroCopy.getOnRoadPriceCta}"], a[title="${this.heroCopy.getOnRoadPriceCta}"]`
    )
      .filter(':visible')
      .first()
      .should('be.visible');
    cy.get(
      `button[title="${this.heroCopy.checkOffersCta}"], a[title="${this.heroCopy.checkOffersCta}"]`
    )
      .filter(':visible')
      .first()
      .should('be.visible');
  }

  verifyBookFreeTestDriveCta() {
    cy.contains(
      'button, a',
      exactText(this.heroCopy.bookFreeTestDriveCta),
      { timeout: 20000 }
    )
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('be.visible');
  }

  // --- Content blocks (one method each) ---

  verifyKeySpecs() {
    const heading = `Key Specs of ${this.productLabel}`;
    const section = () =>
      cy
        .contains('h2', exactText(heading))
        .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
        .should('be.visible')
        .closest('.headingbar')
        .parent();

    (this.product.keySpecLabels || []).forEach((label) => {
      section()
        .find(`p[title*="${label}"]`, { log: false })
        .should('exist');
    });
  }

  getEmiCalculator() {
    return cy.get('#calculateEmi', { timeout: 20000 });
  }

  verifyEmi() {
    this.verifyHeadingVisible(`${this.productLabel} EMI`);
    const copy = this.componentsCopy.emi;
    this.getEmiCalculator().scrollIntoView({
      offset: { top: -STICKY_HEADER_OFFSET, left: 0 },
    });
    this.getEmiCalculator().contains('p', exactText(copy.downPayment)).should('be.visible');
    this.getEmiCalculator().contains('p', exactText(copy.interestRate)).should('be.visible');
    this.getEmiCalculator().contains('p', exactText(copy.loanPeriod)).should('be.visible');
    this.getEmiCalculator().contains('p', exactText(copy.monthlyEmi)).should('be.visible');
    copy.tenures.forEach((months) => {
      this.getEmiCalculator()
        .contains('button', exactText(months))
        .should('be.visible');
    });
    this.getEmiCalculator()
      .contains('p', exactText(copy.monthlyEmi))
      .parent()
      .should(($el) => {
        expect(
          $el.text(),
          `Monthly EMI amount should be shown for ${this.productLabel}`
        ).to.match(/₹\s*[\d,]+/);
      });
  }

  /**
   * SecondaryNavbar "Calculate EMI" is an in-page jump (a div, not a link).
   * Price / Specification / Images / Brochure are real hrefs off this PDP
   * — do not click those here or the rest of the shared session is lost.
   */
  clickSecondaryNavbarCalculateEmi() {
    const label = this.componentsCopy.navbarEmiItem;
    // #secondary-header is the stable id. `div.secondaryNav.sticky` can be
    // missing after the shared PDP session has scrolled through later
    // blocks (confirmed live: the bar is still on screen, but that class
    // pair no longer matches).
    cy.get('#secondary-header', { timeout: 20000 })
      .should('be.visible')
      .find(`[title*="${label}"]`)
      .first()
      .should('be.visible')
      .click();
    this.getEmiCalculator().should('be.visible');
    this.getEmiCalculator()
      .contains('h2', exactText(`${this.productLabel} EMI`))
      .should('be.visible');
  }

  selectEmiLoanPeriod(months) {
    const copy = this.componentsCopy.emi;
    this.getEmiCalculator().scrollIntoView({
      offset: { top: -STICKY_HEADER_OFFSET, left: 0 },
    });
    const amountText = () =>
      this.getEmiCalculator()
        .contains('p', exactText(copy.monthlyEmi))
        .parent()
        .invoke('text');

    amountText().then((before) => {
      this.getEmiCalculator().contains('button', exactText(String(months))).click();
      this.getEmiCalculator()
        .contains('p', exactText(copy.monthlyEmi))
        .parent()
        .should(($el) => {
          const after = ($el.text() || '').replace(/\s+/g, ' ').trim();
          expect(after, 'Monthly EMI should still show a rupee amount after changing tenure').to.match(
            /₹\s*[\d,]+/
          );
          expect(
            after,
            `Changing loan period to ${months} months should update the Monthly EMI figure`
          ).to.not.eq((before || '').replace(/\s+/g, ' ').trim());
        });
    });
  }

  verifyAbout() {
    this.verifyHeadingVisible(`About ${this.productLabel}`);
  }

  verifyExpertReview() {
    this.verifyHeadingVisible(`${this.productLabel} Expert Review`);
  }

  verifyProsCons() {
    this.verifyHeadingVisible(`${this.productLabel} Pros & Cons`);
  }

  // The live heading dropped its trailing category suffix (e.g. "Pickup
  // Truck") at some point — confirmed live, now reads just "Compare
  // {truck} with Alternative".
  verifyCompareAlternatives() {
    const heading = `Compare ${this.productLabel} with Alternative`;
    this.verifyHeadingVisible(heading);
    cy.contains('h2', exactText(heading))
      .parent()
      .parent()
      .find('a[href*="/en/compare/"]')
      .filter(':visible')
      .should('have.length.at.least', 1);
  }

  verifyImages() {
    this.verifyHeadingVisible(`${this.productLabel} Image`);
  }

  verifyFeatures() {
    // Popular PDP uses h2; leaner PDPs may use h3
    cy.contains('h2,h3', exactText(`${this.productLabel} Features`), {
      timeout: 20000,
    })
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('be.visible');
  }

  verifyExploreBrandSeries() {
    // e.g. "Explore Tata Series"
    cy.contains('h2', /^Explore .+ Series$/, { timeout: 20000 })
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('be.visible');
  }

  getDealersSection() {
    // Live heading can carry an extra space after the product name.
    return cy
      .contains('h2', /Dealers, Service Centers & Spare Parts/, { timeout: 20000 })
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('be.visible')
      .parent()
      .parent();
  }

  verifyDealersServiceSpare() {
    this.getDealersSection().within(() => {
      this.componentsCopy.dealersTabs.forEach((tab) => {
        cy.get(`button.tab-btn[title="${tab}"]`).should('be.visible');
      });
      cy.get(`button.tab-btn[title="${this.componentsCopy.dealersTabs[0]}"]`).should(
        'have.class',
        'tabsBorder'
      );
      cy.contains('button', exactText(this.componentsCopy.talkToDealerCta))
        .filter(':visible')
        .should('have.length.at.least', 1);
    });
  }

  openDealersTab(tabTitle) {
    this.getDealersSection()
      .find(`button.tab-btn[title="${tabTitle}"]`)
      .should('be.visible')
      .click();
    this.getDealersSection()
      .find(`button.tab-btn[title="${tabTitle}"]`)
      .should('have.class', 'tabsBorder');
  }

  verifyPriceInIndia() {
    // Price in India lives in the sticky right sidebar — it does not scroll into the
    // main viewport like body sections. Confirm the heading exists and is not hidden.
    cy.window({ log: false }).then((win) => {
      const pattern = exactText(`${this.productLabel} Price in India`);
      const heading = [...win.document.querySelectorAll('h2')].find((el) =>
        pattern.test((el.textContent || '').trim())
      );
      expect(
        heading,
        `${this.productLabel} Price in India heading should be present on the PDP`
      ).to.exist;
      const style = win.getComputedStyle(heading);
      expect(style.display, 'Price in India heading should not be hidden').to.not.eq('none');
      expect(parseFloat(style.opacity || '1'), 'Price in India heading should be shown').to.be.greaterThan(
        0
      );
    });
  }

  verifyFindPerfectTruck() {
    this.verifyHeadingVisible('Find Perfect Truck');
  }

  verifyUserReviews() {
    cy.contains(
      'h2,h3',
      new RegExp(`^(${this.productLabel} User Reviews|${this.productLabel} Reviews)$`),
      { timeout: 20000 }
    )
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('be.visible');
  }

  verifyNews() {
    this.verifyHeadingVisible(`${this.productLabel} News`);
  }

  verifyVideos() {
    this.verifyHeadingVisible(`${this.productLabel} Videos`);
  }

  verifyElectricVehicleVideos() {
    this.verifyHeadingVisible('Electric Vehicle Videos');
  }

  verifyUsage() {
    this.verifyHeadingVisible(`${this.productLabel} Usage`);
  }

  getFaqSection() {
    return cy.get('#faqSection', { timeout: 20000 });
  }

  verifyFaq() {
    this.verifyHeadingVisible(`Frequently Asked Questions on ${this.productLabel}`);
    this.getFaqSection()
      .find('.accordion h3')
      .should('have.length.at.least', 1);
  }

  expandFaqAccordion(index = 0) {
    this.getFaqSection().scrollIntoView({
      offset: { top: -STICKY_HEADER_OFFSET, left: 0 },
    });
    this.getFaqSection()
      .find('.accordion')
      .eq(index)
      .should('be.visible')
      .within(() => {
        cy.get('h3').should('be.visible').click();
        cy.get('div')
          .filter(':visible')
          .should(($els) => {
            const answer = [...$els].find(
              (el) =>
                el.tagName === 'DIV' &&
                !el.querySelector('h3') &&
                (el.textContent || '').trim().length > 20
            );
            expect(
              answer,
              `FAQ answer for question ${index + 1} should be shown after it is opened`
            ).to.exist;
          });
      });
  }
}

module.exports = NewTruckPdp;
