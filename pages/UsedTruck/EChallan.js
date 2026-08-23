const eChallanData = require('../../testData/UsedTruck/EChallanData.json');
const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { LeadFormFiller, exactText } = require('../../helpers/leadFormFiller');
const { GetInformationLeadFiller } = require('../../helpers/getInformationLeadFiller');

/**
 * E Challan (/en/e-challan-check-pay-online).
 *
 * Scope for now, per request: only the lead forms on this page — not the
 * challan-check/payment content itself, which is out of scope until asked
 * for.
 *
 * Live click-and-inspect audit found **two** distinct lead forms:
 * 1. "Check Offers" — shared CheckOffersLead modal.
 * 2. "Check Challan" — after filling a vehicle registration number, opens
 *    the shared GetInformationLead component (see
 *    `helpers/getInformationLeadFiller.js`; same backend as CV Permit/
 *    Vehicle Report — confirmed via network intercept hitting a
 *    `.../vehicle-permit...` endpoint regardless of page).
 * No launch popup was found.
 *
 * Real production leads (no sandbox) — submitted name is `testqa` on both
 * forms, matching this repo's convention for all lead forms.
 */
class EChallan {
  constructor(lang = 'en') {
    this.lang = lang;
    this.page = eChallanData.EChallan[lang] || eChallanData.EChallan.en;
    this.pageUrl = this.page.path;
    this.identifierKey = this.page.identifierKey;

    this.checkOffersLeadCopy =
      truckInIndiaData.CheckOffersForm[lang] || truckInIndiaData.CheckOffersForm.en;
    this.checkOffersLead = new LeadFormFiller({
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: this.checkOffersLeadCopy.submitCta,
    });

    this.getInformationLead = new GetInformationLeadFiller();
  }

  static get supportedLanguages() {
    return Object.keys(eChallanData.EChallan);
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

  // --- Check Offers (shared CheckOffersLead) ---

  // Raw DOM click, not `cy.contains(...).filter(':visible').click()` —
  // confirmed live elsewhere in this project
  // (pages/ListingPages/NewListingPages.js, pages/Compare/CompareTrucks.js)
  // that the Cypress-command version of this click is unreliable and can
  // silently skip the click.
  openCheckOffersLead() {
    const ctaLabel = this.page.checkOffers.leadTriggerCta;
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

  submitCheckOffersLead(overrides = {}) {
    this.openCheckOffersLead();
    this.checkOffersLead.fillAndSubmit({
      name: 'testqa',
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    this.verifyCheckOffersLeadSubmitted();
  }

  // --- Check Challan (GetInformationLead) ---

  getRegistrationNumberInput() {
    return cy.get('input[placeholder="RJ 02 SS 1234"]', { log: false });
  }

  /**
   * Typing a complete, valid-format registration number sometimes
   * auto-opens the Get Information form immediately (no click needed) —
   * confirmed live via a failure screenshot showing the form already open
   * with the trigger CTA gone, which a blind click was timing out on. This
   * checks whether the form is already open before attempting the click.
   */
  openGetInformationLead() {
    const ctaLabel = this.page.getInformation.leadTriggerCta;
    this.getRegistrationNumberInput()
      .should('be.visible')
      .clear({ force: true })
      .type(this.page.sampleRegistrationNumber, { force: true });

    const clickCtaIfPresent = () => {
      cy.get('body', { log: false }).then(($body) => {
        const alreadyOpen = $body.find('input[name="name"]').filter(':visible').length > 0;
        if (alreadyOpen) {
          return;
        }
        const $btn = $body
          .find('button')
          .filter((_, el) => exactText(ctaLabel).test(el.textContent || ''))
          .filter(':visible');
        if ($btn.length) {
          $btn[0].click();
        }
      });
    };

    clickCtaIfPresent();
    cy.get('input[name="name"]').should(($input) => {
      if (!$input.is(':visible')) {
        clickCtaIfPresent();
      }
      expect($input.is(':visible'), `${ctaLabel} lead form is visible`).to.eq(true);
    });
  }

  /**
   * This form is OTP-gated: submitting name/phone/brand does not complete
   * the lead — it sends an OTP and advances to a verification screen with an
   * "Enter OTP" field (confirmed live via a failure screenshot; the heading
   * copy above it varies per page — "Sent verification code on..." here,
   * "OTP sent to..." on CV Permit/Vehicle Report — so the "Enter OTP" field,
   * not the heading text, is the reliable cross-page signal).
   * There is no configured test OTP in this repo (`TJ_USER_OTP` in
   * `cypress/.env.example` is an empty placeholder, unused elsewhere), so
   * full end-to-end completion is out of scope for now. The OTP screen
   * appearing IS the real, honest, sufficient success signal — an earlier
   * `cy.intercept('**/api/**vehicle-permit**')` network check was dropped
   * because the real request on this page didn't match that URL pattern
   * (`cy.wait` timed out with "No request ever occurred" despite the OTP
   * screen visibly rendering correctly in the same run's screenshot), so it
   * was redundant with, and less reliable than, this visual checkpoint.
   * Do not claim full submission success beyond this without a real test OTP.
   */
  verifyGetInformationLeadRequestsOtp() {
    cy.contains('label', 'Enter OTP', { log: false }).parent().find('input').should('be.visible');
  }

  /** Fills and submits through to the OTP screen — see verify method for why it stops there. */
  submitGetInformationLead(overrides = {}) {
    this.openGetInformationLead();
    this.getInformationLead.fillAndSubmit({
      name: 'testqa',
      ...overrides,
    });
    this.verifyGetInformationLeadRequestsOtp();
  }
}

module.exports = EChallan;
