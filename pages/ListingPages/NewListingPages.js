const newListingPagesData = require('../../testData/ListingPages/NewListingPagesData.json');
const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { LeadFormFiller, exactText } = require('../../helpers/leadFormFiller');

/**
 * Every distinct CTA on a listing page that asks the user for name/mobile/
 * other details counts as its own lead form (per explicit user direction) —
 * even when two CTAs happen to open the same underlying component. Order
 * here fixes the TC-NLP-01..05 numbering used by the spec: each slot keeps
 * the same meaning on every page, and a page missing a slot skips that TC
 * rather than shifting the numbers of the slots it does have.
 */
const LEAD_FORM_SLOTS = [
  { key: 'checkOffers', cta: 'Check Offers', formType: 'checkOffers' },
  { key: 'checkTruckPrice', cta: 'Check Truck Price', formType: 'checkOffers' },
  { key: 'contactSeller', cta: 'Contact Seller', formType: 'checkOffers' },
  { key: 'notifyMe', cta: 'Notify Me', formType: 'checkOffers' },
  { key: 'getOffers', cta: 'Call Now', formType: 'getOffers' },
];

/**
 * New Listing Pages: Best Trucks, Popular Truck, Find New Trucks,
 * Upcoming Trucks, Latest Trucks, BS6 Trucks.
 *
 * Scope for now, per request: only the lead forms on each listing page — not
 * page content/filters/cards, which are out of scope until asked for.
 *
 * Live automation (clicking every CTA on a fresh page load and inspecting the
 * resulting inputs' id/name/placeholder, not just visually) found that each
 * page carries several lead-form entry points, falling into two underlying
 * components:
 *
 * 1. CheckOffersLead — the shared modal also used on Homepage/PDP
 *    (`testData/HomePage/TruckInIndiaData.json` → `CheckOffersForm`):
 *    `input#name[name="name"]` / `input#phone[name="phone"]`, city by
 *    placeholder, "Check Offers" submit, "Thank You!!!" confirmation. Reached
 *    via up to four differently-labeled buttons per page — Check Offers,
 *    Check Truck Price, Contact Seller, Notify Me — which reuse this exact
 *    component (confirmed identical by id/name) but are still counted and
 *    tested as separate lead forms: they are different user-facing CTAs
 *    (Contact Seller even renders different placeholder copy, "Enter Your
 *    Name" vs "Name"), so each is its own entry point worth its own coverage
 *    and its own traceable lead name.
 * 2. GetOffersLead — a genuinely **different** component opened only by
 *    "Call Now", present on every page except Best Trucks (which has no Call
 *    Now CTA). Its inputs have no id/name (placeholder-only: "Name", "Enter
 *    your mobile number", plus an extra optional "Enter model name" field),
 *    its city autocomplete dropdown is `div.absolute.z-10` rows (not `ul li`
 *    like CheckOffersLead), and its submit button reads "Get Offers" under
 *    heading "SHARE YOUR DETAILS TO GET ASSISTANCE". A naive check for
 *    `input#name[name="name"]` alone misses this form entirely — that is why
 *    a broader, click-and-inspect audit (not just one selector) was required
 *    to find it, and why the same audit was re-run against every CTA on
 *    every page rather than assumed from one page's result.
 *
 * Every submission here is a **real production lead** (no sandbox detected)
 * — the submitted name is `testqa`, matching this repo's convention for all
 * lead forms.
 */
class NewListingPages {
  constructor(lang = 'en', pageKey) {
    this.lang = lang;
    const pages = newListingPagesData.NewListingPages[lang]?.pages || [];
    this.page = pages.find((p) => p.key === pageKey);
    if (!this.page) {
      throw new Error(`Unknown New Listing Page key: ${pageKey} for lang=${lang}`);
    }
    this.pageUrl = this.page.path;
    this.identifierKey = this.page.identifierKey;

    this.checkOffersLeadCopy =
      truckInIndiaData.CheckOffersForm[lang] || truckInIndiaData.CheckOffersForm.en;
    this.checkOffersLead = new LeadFormFiller({
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: this.checkOffersLeadCopy.submitCta,
    });

    const getOffersData = newListingPagesData.GetOffersAssistanceForm;
    this.getOffersLeadCopy = getOffersData[lang] || getOffersData.en;
    this.getOffersLead = new LeadFormFiller({
      nameSelector: `input[placeholder="${this.getOffersLeadCopy.namePlaceholder}"]:visible`,
      mobileSelector: `input[placeholder="${this.getOffersLeadCopy.mobilePlaceholder}"]:visible`,
      cityPlaceholder: this.getOffersLeadCopy.cityPlaceholder,
      citySuggestionSelector: 'div.absolute.z-10',
      submitText: this.getOffersLeadCopy.submitCta,
    });
  }

  static get supportedLanguages() {
    return Object.keys(newListingPagesData.NewListingPages);
  }

  static get pageKeys() {
    return newListingPagesData.NewListingPages.en.pages.map((p) => p.key);
  }

  static getPageMeta(pageKey) {
    return newListingPagesData.NewListingPages.en.pages.find((p) => p.key === pageKey);
  }

  /** Ordered lead-form slot definitions — single source of truth for TC-NLP-01..05 numbering. */
  static get leadFormSlots() {
    return LEAD_FORM_SLOTS;
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

  /** Whether this page has the given lead-form slot (see `leadFormSlots`). */
  hasLeadForm(slotKey) {
    return Boolean(this.page.leadForms && this.page.leadForms[slotKey]);
  }

  getLeadFormSlot(slotKey) {
    const slot = LEAD_FORM_SLOTS.find((s) => s.key === slotKey);
    if (!slot) {
      throw new Error(`Unknown lead form slot: ${slotKey}`);
    }
    return slot;
  }

  /**
   * Open the shared CheckOffersLead modal from a specific trigger CTA label
   * (Check Offers / Check Truck Price / Contact Seller / Notify Me all use
   * this same component); re-click until it hydrates.
   */
  openCheckOffersLeadViaCta(ctaLabel) {
    const clickCta = () => {
      cy.contains('button', exactText(ctaLabel), { log: false })
        .filter(':visible')
        .first()
        .then(($btn) => $btn[0].click());
    };

    clickCta();
    cy.get('input#name[name="name"]').should(($input) => {
      if (!$input.is(':visible')) {
        clickCta();
      }
      expect($input.is(':visible'), `${ctaLabel} lead form is visible`).to.eq(true);
    });
  }

  verifyCheckOffersLeadSubmitted() {
    cy.contains('h3', exactText(this.checkOffersLeadCopy.thankYouHeading)).should('be.visible');
  }

  /** One CheckOffersLead fill + submit via a specific trigger CTA. */
  submitCheckOffersLeadViaCta(ctaLabel, overrides = {}) {
    this.openCheckOffersLeadViaCta(ctaLabel);
    this.checkOffersLead.fillAndSubmit({
      name: 'testqa',
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    this.verifyCheckOffersLeadSubmitted();
  }

  /**
   * Open the "SHARE YOUR DETAILS TO GET ASSISTANCE" lead form via Call Now;
   * re-click until it hydrates. Only present when the `getOffers` slot is
   * true for this page (all pages except Best Trucks).
   */
  openGetOffersLead() {
    const ctaLabel = this.getOffersLeadCopy.triggerCta;
    const clickCta = () => {
      cy.contains('button', exactText(ctaLabel), { log: false })
        .filter(':visible')
        .first()
        .then(($btn) => $btn[0].click());
    };

    clickCta();
    cy.contains(this.getOffersLeadCopy.heading, { log: false }).should(($heading) => {
      if (!$heading.is(':visible')) {
        clickCta();
      }
      expect($heading.is(':visible'), `${ctaLabel} assistance lead form is visible`).to.eq(true);
    });
  }

  /**
   * This form has no "Thank You" text on success (unlike CheckOffersLead), so
   * the strongest available signal is the real submit network call: verified
   * live via `cy.intercept`/`cy.wait` that a POST to `**\/api/**` matching
   * lead/enquiry/offer/assist fires and returns 2xx, after which the
   * "SHARE YOUR DETAILS..." heading disappears. Requires the alias set up by
   * `submitGetOffersLead` before the submit click.
   */
  verifyGetOffersLeadSubmitted() {
    cy.wait('@getOffersLeadSubmit', { timeout: 20000 }).then((interception) => {
      expect(
        interception.request.url,
        'Get Offers assistance lead submit request hit a lead-related endpoint'
      ).to.match(/lead|enquiry|offer|assist/i);
      expect(
        interception.response && interception.response.statusCode,
        'Get Offers assistance lead submit request succeeded'
      ).to.be.within(200, 299);
    });
    cy.contains(exactText(this.getOffersLeadCopy.heading), { log: false }).should('not.exist');
  }

  /** One Get Offers (Call Now) assistance lead fill + submit for this listing page. */
  submitGetOffersLead(overrides = {}) {
    cy.intercept('POST', '**/api/**').as('getOffersLeadSubmit');
    this.openGetOffersLead();
    this.getOffersLead.fillAndSubmit({
      name: 'testqa',
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    this.verifyGetOffersLeadSubmitted();
  }

  /**
   * Submit whichever lead form lives at `slotKey` (see `leadFormSlots`).
   * Throws with a clear message if this page doesn't have that slot — call
   * `hasLeadForm(slotKey)` first (the spec uses it to skip the test).
   */
  submitLeadForm(slotKey, overrides = {}) {
    const slot = this.getLeadFormSlot(slotKey);
    if (!this.hasLeadForm(slotKey)) {
      throw new Error(`${this.pageLabel} has no "${slot.cta}" lead form to submit`);
    }
    if (slot.formType === 'getOffers') {
      return this.submitGetOffersLead(overrides);
    }
    return this.submitCheckOffersLeadViaCta(slot.cta, overrides);
  }
}

module.exports = NewListingPages;
