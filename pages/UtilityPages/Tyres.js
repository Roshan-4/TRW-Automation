const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { LeadFormFiller } = require('../../helpers/leadFormFiller');
const { getTyresOfferCta } = require('../../helpers/tyresOfferCta');

/**
 * Tyres (/en/tyres).
 *
 * Live-audited: no page-level lead-form CTA exists — every "View <current
 * month> Offer" button is a per-tyre-model card CTA (7 on the page), each
 * opening the same shared CheckOffersLead modal used across the rest of the
 * site.
 * Same directory-style pattern as the Bus brand pages: tested via a
 * deterministic click on the first matching card's CTA, which reliably
 * exercises a real, working submission.
 *
 * This is a real production lead (no sandbox) — the submitted name is
 * `testqa`, matching this repo's convention for all lead forms.
 */
class Tyres {
  static get pageUrl() {
    return '/en/tyres';
  }

  static get pageLabel() {
    return 'Tyres';
  }

  static get supportedLanguages() {
    return ['en'];
  }

  get pageLabel() {
    return Tyres.pageLabel;
  }

  constructor(lang = 'en') {
    this.lang = lang;
    this.ctaLabel = getTyresOfferCta();
    this.checkOffersLeadCopy =
      truckInIndiaData.CheckOffersForm[lang] || truckInIndiaData.CheckOffersForm.en;
    this.checkOffersLead = new LeadFormFiller({
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: this.checkOffersLeadCopy.submitCta,
      // Same non-portal per-card modal structure as the Offers page's tab
      // section (see pages/UtilityPages/TabbedModelOffers.js) — the default
      // ancestor walk can resolve to a container spanning every tyre
      // card's own CTA rather than just this modal. Scope tightly via the
      // modal's own `max-w-[...]` wrapper class.
      formRootFinder: () =>
        cy
          .get('body')
          .find('input#name[name="name"]')
          .filter(':visible')
          .first()
          .closest('[class*="max-w-"]'),
    });
  }

  navigate() {
    cy.visit(Tyres.pageUrl, { timeout: 90000 });
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

  openLeadFormViaCta() {
    const ctaLabel = this.ctaLabel;
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

  verifyLeadSubmitted() {
    // Requirement changed (confirmed live): Tyres no longer shows an inline
    // "Thank You" confirmation like the rest of the site's CheckOffersLead
    // modal — a successful submission now redirects the user to the
    // submitted tyre model's own detail page instead. Which model that is
    // depends on which card's CTA was clicked, so assert the redirect
    // happened (away from the Tyres hub, onto a tyre-model path) rather than
    // a fixed destination URL.
    cy.location('pathname', { timeout: 15000 }).should((pathname) => {
      expect(pathname, 'navigates away from the Tyres hub after a successful lead').to.not.eq(
        Tyres.pageUrl
      );
      expect(pathname, 'lands on a tyre model detail page').to.match(/tyre/i);
    });
  }

  submitLead(overrides = {}) {
    this.openLeadFormViaCta();
    this.checkOffersLead.fillAndSubmit({
      name: 'testqa',
      // "noida" (the shared CheckOffersForm test-city default) does not
      // resolve on the Tyres lead form's city field (confirmed live) —
      // use a city known to work here instead.
      city: 'alwar',
      ...overrides,
    });
    this.verifyLeadSubmitted();
  }
}

module.exports = Tyres;
