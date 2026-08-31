const compareTrucksData = require('../../testData/Compare/CompareTrucksData.json');
const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { LeadFormFiller, exactText } = require('../../helpers/leadFormFiller');

/**
 * Compare Trucks (/en/compare).
 *
 * Scope for now, per request: only the lead form on this page — not the
 * comparison tool itself (add/remove trucks, side-by-side view), which is
 * out of scope until asked for.
 *
 * Live click-and-inspect audit (not a visual guess) found exactly one lead
 * form: "Check Offers" opens the same shared CheckOffersLead modal used on
 * Homepage/PDP/Listing pages (`testData/HomePage/TruckInIndiaData.json` →
 * `CheckOffersForm`; `input#name[name="name"]` / `input#phone[name="phone"]`,
 * "Check Offers" submit, "Thank You!!!" confirmation). No launch popup, no
 * scroll-triggered popup, and no other distinct lead-form CTA were found on
 * this page — the many other buttons (nav mega-menu, body-type filter chips)
 * are site navigation/filtering, not lead capture.
 *
 * This is a real production lead (no sandbox) — the submitted name is
 * `testqa`, matching this repo's convention for all lead forms.
 */
class CompareTrucks {
  constructor(lang = 'en') {
    this.lang = lang;
    this.page = compareTrucksData.CompareTrucks[lang] || compareTrucksData.CompareTrucks.en;
    this.pageUrl = this.page.path;
    this.identifierKey = this.page.identifierKey;

    this.checkOffersLeadCopy =
      truckInIndiaData.CheckOffersForm[lang] || truckInIndiaData.CheckOffersForm.en;
    this.checkOffersLead = new LeadFormFiller({
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: this.checkOffersLeadCopy.submitCta,
    });
  }

  static get supportedLanguages() {
    return Object.keys(compareTrucksData.CompareTrucks);
  }

  get pageLabel() {
    return this.page.name;
  }

  navigate() {
    cy.visit(this.pageUrl, { timeout: 90000 });
    cy.document().its('readyState').should('eq', 'complete');
    this.dismissBlockingOverlays();
  }

  dismissBlockingOverlays() {
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

  /**
   * Open the shared Check Offers lead form; re-click until it hydrates.
   * Uses a raw DOM click (not `cy.contains(...).filter(':visible').click()`)
   * — confirmed live that the Cypress-command version of this click is
   * unreliable on pages with several visually-identical CTAs (e.g. one
   * "Check Offers" per truck card here): `cy.contains()` can resolve to a
   * button `filter(':visible')` then narrows to zero elements on, leaving
   * the click silently skipped. Same raw-DOM-click pattern used by
   * pages/UtilityPages/Tyres.js and TabbedModelOffers.js, which don't hit
   * this failure mode.
   */
  openCheckOffersLead() {
    const ctaLabel = this.page.leadTriggerCta;
    cy.document().then((doc) => {
      const clickCta = () => {
        const button = [...doc.querySelectorAll('button')].find(
          (el) => el.textContent.trim() === ctaLabel && el.offsetParent !== null
        );
        if (button) {
          button.click();
        }
      };

      clickCta();
      cy.get('input#name[name="name"]').should(($input) => {
        if (!$input.is(':visible')) {
          clickCta();
        }
        expect($input.is(':visible'), `${ctaLabel} lead form is visible`).to.eq(true);
      });
    });
  }

  verifyCheckOffersLeadSubmitted() {
    cy.contains('h3', exactText(this.checkOffersLeadCopy.thankYouHeading)).should('be.visible');
  }

  /** One Check Offers lead fill + submit for this page (approved scope). */
  submitCheckOffersLead(overrides = {}) {
    this.openCheckOffersLead();
    this.checkOffersLead.fillAndSubmit({
      name: 'testqa',
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    this.verifyCheckOffersLeadSubmitted();
  }

  verifyPageHeading() {
    cy.contains('h1', exactText(this.page.heading), { timeout: 20000 }).should('be.visible');
  }

  verifyCompareToolCta() {
    cy.contains('button', exactText(this.page.compareCta), { timeout: 20000 })
      .filter(':visible')
      .first()
      .should('be.visible');
  }

  verifyPopularTruckComparison() {
    cy.contains('h2', exactText(this.page.popularComparisonHeading), { timeout: 20000 })
      .scrollIntoView({ offset: { top: -140, left: 0 } })
      .should('be.visible');
  }

  selectModelsByCategoryTab(tabLabel) {
    cy.contains('h2', exactText(this.page.modelsByCategoryHeading), { timeout: 20000 })
      .scrollIntoView({ offset: { top: -140, left: 0 } })
      .should('be.visible')
      .parent()
      .parent()
      .within(() => {
        cy.get(`button.tab-btn[title="${tabLabel}"]`).should('be.visible').click();
        cy.get(`button.tab-btn[title="${tabLabel}"]`).should('have.class', 'tabsBorder');
      });
  }

  verifyFaqAndExpand() {
    cy.contains('h2', exactText(this.page.faqHeading), { timeout: 20000 }).should('exist');
    // Native click: Cypress treats this h3 as covered by the FAQ section
    // wrapper (#truckFaq heading overlay) even though a user can click it.
    // Same raw-DOM click used for Check Offers on this page.
    cy.get('#truckFaq .accordion', { timeout: 20000 })
      .eq(1)
      .should('be.visible')
      .then(($acc) => {
        const heading = $acc.find('h3').get(0);
        expect(heading, 'Compare Trucks FAQ question is present').to.exist;
        heading.click();
      });
    cy.get('#truckFaq .accordion')
      .eq(1)
      .should(($acc) => {
        const answer = [...$acc.find('div')].find(
          (el) => !el.querySelector('h3') && (el.textContent || '').trim().length > 20
        );
        expect(answer, 'Compare Trucks FAQ answer should be shown after opening a question').to.exist;
        expect(
          Cypress.$(answer).is(':visible'),
          'Compare Trucks FAQ answer should be visible'
        ).to.eq(true);
      });
  }
}

module.exports = CompareTrucks;
