const brochureData = require('../../testData/Brochure/BrochureData.json');
const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { LeadFormFiller, exactText } = require('../../helpers/leadFormFiller');

/**
 * Brochure (/en/brochure).
 *
 * Scope for now, per request: only the lead form on this page — not the
 * brochure list/search/filter content, which is out of scope until asked
 * for.
 *
 * Live click-and-inspect audit (not a visual guess) found exactly one lead
 * form: "Download Brochure" opens the same shared CheckOffersLead modal used
 * on Homepage/PDP/Listing/Compare pages (`testData/HomePage/
 * TruckInIndiaData.json` → `CheckOffersForm`; `input#name[name="name"]` /
 * `input#phone[name="phone"]`) — confirmed by precisely scoping to the open
 * modal's own root: its submit button reads "Check Offers", not "Download
 * Brochure", even though that's the trigger label. No launch popup, no
 * scroll-triggered popup, and no other distinct lead-form CTA were found —
 * the other buttons (nav mega-menu, tabs, budget filter chips, Share
 * Feedback) are navigation/filtering/feedback, not lead capture.
 *
 * This is a real production lead (no sandbox) — the submitted name is
 * `testqa`, matching this repo's convention for all lead forms.
 *
 * The page also has a "Best Selling Trucks" carousel further down (the same
 * reusable tabbed component as Homepage's Truck in India section — same
 * `div.differentTabs`/`div.visible`/slick-carousel markup) with Popular /
 * Upcoming / Latest tabs. Every truck card in that carousel has its own
 * "Download Brochure" button that opens the identical shared CheckOffersLead
 * modal. Per explicit user direction, each tab is its own lead-form entry
 * point and gets its own test — even though every tab opens the same
 * underlying form — so switching tabs is exercised, not just the first
 * card's button on page load. Only one card per tab is submitted (not every
 * card in the carousel), since every card in a tab opens the identical form.
 */
class Brochure {
  constructor(lang = 'en') {
    this.lang = lang;
    this.page = brochureData.Brochure[lang] || brochureData.Brochure.en;
    this.pageUrl = this.page.path;
    this.identifierKey = this.page.identifierKey;
    this.bestSellingTabs = this.page.bestSellingTabs;

    this.checkOffersLeadCopy =
      truckInIndiaData.CheckOffersForm[lang] || truckInIndiaData.CheckOffersForm.en;
    this.checkOffersLead = new LeadFormFiller({
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: this.checkOffersLeadCopy.submitCta,
    });
  }

  static get supportedLanguages() {
    return Object.keys(brochureData.Brochure);
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
   * Open the shared Check Offers lead form via Download Brochure; re-click
   * until it hydrates. Raw DOM click, not
   * `cy.contains(...).filter(':visible').click()` — confirmed live
   * elsewhere in this project (pages/ListingPages/NewListingPages.js,
   * pages/Compare/CompareTrucks.js) that the Cypress-command version of
   * this click is unreliable and can silently skip the click.
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

  getBestSellingHeading() {
    return cy.contains('h2', exactText(this.page.bestSellingHeading), { log: false });
  }

  /** Re-clicks the tab until it reports active — same idiom as TruckInIndia.openTab. */
  openTab(tabLabel) {
    this.getBestSellingHeading().then(($heading) => {
      const section = () => Cypress.$($heading).closest('div.differentTabs');
      const clickTab = () => {
        const button = section().find(`button.tab-btn[title="${tabLabel}"]`).get(0);
        if (button) {
          button.click();
        }
      };

      clickTab();

      cy.wrap($heading, { log: false })
        .closest('div.differentTabs', { log: false })
        .find(`button.tab-btn[title="${tabLabel}"]`, { log: false })
        .should(($btn) => {
          if (!$btn.hasClass('tabsBorder')) {
            clickTab();
          }
          expect($btn.hasClass('tabsBorder'), `${tabLabel} tab is active`).to.eq(true);
        });
    });
  }

  /**
   * Open the shared Check Offers lead form via the first real (non-cloned)
   * card's "Download Brochure" button in the currently active tab panel.
   */
  openCheckOffersLeadFromTab(tabLabel) {
    this.openTab(tabLabel);
    this.getBestSellingHeading().then(($heading) => {
      const clickCta = () => {
        const button = Cypress.$($heading)
          .closest('div.differentTabs')
          .find('div.visible')
          .find(`button[title="${this.page.leadTriggerCta}"]`)
          .filter(':visible')
          .not('.slick-cloned button')
          .get(0);
        if (button) {
          button.click();
        }
      };

      clickCta();
      cy.get('input#name[name="name"]').should(($input) => {
        if (!$input.is(':visible')) {
          clickCta();
        }
        expect($input.is(':visible'), `Download Brochure lead form is visible from the ${tabLabel} tab`).to.eq(
          true
        );
      });
    });
  }

  /** One Check Offers lead fill + submit, triggered from a specific Best Selling Trucks tab. */
  submitCheckOffersLeadFromTab(tabLabel, overrides = {}) {
    this.openCheckOffersLeadFromTab(tabLabel);
    this.checkOffersLead.fillAndSubmit({
      name: 'testqa',
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    this.verifyCheckOffersLeadSubmitted();
  }
}

module.exports = Brochure;
