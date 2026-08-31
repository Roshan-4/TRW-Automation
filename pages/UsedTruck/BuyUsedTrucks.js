const buyUsedTrucksData = require('../../testData/UsedTruck/BuyUsedTrucksData.json');
const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { LeadFormFiller, exactText, makeThrottledCtaClicker } = require('../../helpers/leadFormFiller');
const { currentDevice } = require('../../helpers/deviceLayout');

/**
 * Buy Used Trucks (/en/buy-used-trucks).
 *
 * Scope for now, per request: only the lead form on this page — not the
 * listing/filters, which is out of scope until asked for. No launch popup.
 *
 * Live click-and-inspect audit initially mistook "Contact Seller" here for
 * the standard CheckOffersLead modal — both share `input#name[name="name"]`/
 * `input#phone[name="phone"]` ids, which is a false-positive trap (same
 * lesson as GetOffersLead: id/name attributes alone don't prove it's the
 * same component). A failure screenshot revealed the real, listing-specific
 * form: heading is the truck's own title, an extra optional "Enter Price"
 * field appears (handled automatically by `LeadFormFiller.
 * fillPriceOrBudgetIfPresent`), and the submit button reads "Get Seller
 * Details" — not "Check Offers". Confirm the submit button text for any new
 * "Contact Seller"/"Check Offers"-labeled CTA rather than assuming it matches
 * a previously-seen component just because the input ids match. Its
 * confirmation also differs — "Thank You For Contact" (with seller name/
 * contact number/request ID), not CheckOffersLead's "Thank You!!!".
 *
 * Real production lead (no sandbox) — submitted name is `testqa`, matching
 * this repo's convention for all lead forms.
 */
class BuyUsedTrucks {
  constructor(lang = 'en') {
    this.lang = lang;
    this.page = buyUsedTrucksData.BuyUsedTrucks[lang] || buyUsedTrucksData.BuyUsedTrucks.en;
    this.pageUrl = this.page.path;
    this.identifierKey = this.page.identifierKey;

    this.checkOffersLeadCopy =
      truckInIndiaData.CheckOffersForm[lang] || truckInIndiaData.CheckOffersForm.en;
    this.getSellerDetailsLead = new LeadFormFiller({
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: 'Get Seller Details',
    });
  }

  static get supportedLanguages() {
    return Object.keys(buyUsedTrucksData.BuyUsedTrucks);
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

  // Raw DOM click, not `cy.contains(...).filter(':visible').click()` —
  // confirmed live elsewhere in this project
  // (pages/ListingPages/NewListingPages.js, pages/Compare/CompareTrucks.js)
  // that the Cypress-command version of this click is unreliable and can
  // silently skip the click.
  openGetSellerDetailsLead() {
    const ctaLabel = this.page.leadTriggerCta;
    cy.document().then((doc) => {
      const clickCta = makeThrottledCtaClicker(doc, ctaLabel);

      clickCta();
      cy.get('input#name[name="name"]').should(($input) => {
        if (!$input.is(':visible')) {
          clickCta();
        }
        expect($input.is(':visible'), `${ctaLabel} lead form is visible`).to.eq(true);
      });
    });
  }

  /** Confirmation heading differs from CheckOffersLead's "Thank You!!!" — this flow shows "Thank You For Contact". */
  verifyGetSellerDetailsLeadSubmitted() {
    cy.contains(/thank you for contact/i, { log: false }).should('be.visible');
  }

  submitGetSellerDetailsLead(overrides = {}) {
    this.openGetSellerDetailsLead();
    this.getSellerDetailsLead.fillAndSubmit({
      name: 'testqa',
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    this.verifyGetSellerDetailsLeadSubmitted();
  }

  verifyPageHeading() {
    cy.contains('h1', exactText(this.page.heading), { timeout: 20000 }).should('be.visible');
  }

  verifyListingCountAndCards() {
    cy.contains('h2', new RegExp(this.page.listingHeadingPattern), { timeout: 20000 })
      .scrollIntoView({ offset: { top: -140, left: 0 } })
      .should('be.visible');
    cy.contains('button', exactText(this.page.cardCta), { timeout: 20000 })
      .filter(':visible')
      .should('have.length.at.least', 1);
  }

  verifyFilters() {
    // On mobile the Filter By row stays in the DOM but is not painted
    // (same pattern as listing pages). Require it visible only on desktop.
    const painted = currentDevice() === 'desktop';
    (this.page.filterLabels || []).forEach((label) => {
      cy.contains('button', exactText(label), { timeout: 15000 }).should(
        painted ? 'be.visible' : 'exist'
      );
    });
  }

  verifyFaqAndExpand() {
    cy.contains('h2', exactText(this.page.faqHeading), { timeout: 20000 })
      .scrollIntoView({ offset: { top: -140, left: 0 } })
      .should('be.visible')
      .parent()
      .parent()
      .within(() => {
        cy.get('.accordion').eq(1).should('be.visible').within(() => {
          cy.get('h3').click();
          cy.get('div')
            .filter(':visible')
            .should(($els) => {
              const answer = [...$els].find(
                (el) =>
                  el.tagName === 'DIV' &&
                  !el.querySelector('h3') &&
                  (el.textContent || '').trim().length > 20
              );
              expect(answer, 'Used Trucks FAQ answer should be shown after opening a question').to.exist;
            });
        });
      });
  }

  clickLoadMoreAndExpectMoreCards() {
    const cta = this.page.cardCta;
    cy.contains('button', exactText(this.page.loadMoreCta), { timeout: 20000 })
      .scrollIntoView({ offset: { top: -140, left: 0 } })
      .should('be.visible');
    cy.document().then((doc) => {
      const countCtas = () =>
        [...doc.querySelectorAll('button')].filter(
          (el) => el.textContent.trim() === cta && el.offsetParent !== null
        ).length;
      const before = countCtas();
      const loadMore = [...doc.querySelectorAll('button')].find(
        (el) => el.textContent.trim() === this.page.loadMoreCta && el.offsetParent !== null
      );
      if (loadMore) {
        loadMore.click();
      }
      cy.wrap(null, { timeout: 20000 }).should(() => {
        expect(countCtas(), 'Load More should show more used-truck cards').to.be.greaterThan(before);
      });
    });
  }
}

module.exports = BuyUsedTrucks;
