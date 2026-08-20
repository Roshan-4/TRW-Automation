const busListingData = require('../../testData/Buses/BusListingData.json');
const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { LeadFormFiller, exactText } = require('../../helpers/leadFormFiller');

/**
 * Bus pages reached from the main nav's "Buses" submenu — New Buses,
 * Popular Buses, Upcoming Buses, Latest Buses, and the individual bus
 * brand pages (Ashok Leyland, Tata, Eicher, SML ISUZU, Mahindra). One class
 * handles all of them via `pageKey`, same multi-page pattern as
 * `NewListingPages`/`CategoryListing`. Kept in their own `Buses` area
 * (not folded into `CategoryPages`) since buses are a distinct product
 * line from trucks, even though the underlying lead-form component is
 * identical — both the category-style pages (New/Popular/Latest) and the
 * brand/product pages live together here.
 *
 * Scope for now, per request: only the lead form on each page.
 *
 * Live click-and-inspect audit (every `<button>` text dumped and counted
 * across all 9 pages, not assumed from one sample) found every page reuses
 * the exact same shared `CheckOffersLead` modal already confirmed elsewhere
 * on the site (`input#name[name="name"]`, submit "Check Offers", heading
 * "Thank You!!!") — only the *trigger* CTA label differs per page:
 * - "Check Bus Price" on every page except Upcoming Buses.
 * - "Notify Me" on Upcoming Buses — same pattern as `NewListingPages`'
 *   `upcomingTrucks` slot (unreleased vehicles get a waitlist CTA instead
 *   of a price-check CTA). `leadTriggerCta` per page in
 *   `testData/Buses/BusListingData.json` records this rather than assuming
 *   one fixed label works everywhere.
 * No "Call Now" widget was found on any of the 9 pages (0 matches).
 * "All Bus Brands" (`/en/buses/brands`) is deliberately out of scope — a
 * pure link directory (108 "Check Offers" buttons, no page-level bus
 * listing of its own), a structurally different page type from the
 * individual pages here, matching the same "All Brands"/"View All"
 * exclusion already applied to CategoryPages.
 *
 * This is a real production lead (no sandbox) — the submitted name is
 * `testqa`, matching this repo's convention for all lead forms.
 *
 * `en` only for now (only English URLs were audited).
 */
class BusListing {
  constructor(lang = 'en', pageKey) {
    this.lang = lang;
    const pages = busListingData.BusListing[lang]?.pages || [];
    this.page = pages.find((p) => p.key === pageKey);
    if (!this.page) {
      throw new Error(`Unknown Bus Listing page key: ${pageKey} for lang=${lang}`);
    }
    this.pageUrl = this.page.path;

    // The bus enquiry popup is a distinct component from the shared
    // CheckOffersLead modal used elsewhere on the site: its name/mobile
    // inputs only register typed keystrokes after a genuine (non-forced)
    // click, its confirmation heading reads "Thank You for your interest."
    // (rendered visually upper-case via CSS) rather than "Thank You!!!",
    // and its phone field validates in real time — a non-10-digit value
    // always reverts to empty in the DOM, confirmed live. See
    // `focusFieldsBeforeType`/`assertMobileValueAfterType` in
    // helpers/leadFormFiller.js.
    this.checkOffersLeadCopy = {
      ...(truckInIndiaData.CheckOffersForm[lang] || truckInIndiaData.CheckOffersForm.en),
      thankYouHeading: 'Thank You for your interest.',
    };
    this.checkOffersLead = new LeadFormFiller({
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: this.checkOffersLeadCopy.submitCta,
      focusFieldsBeforeType: true,
      assertMobileValueAfterType: false,
    });
  }

  static get supportedLanguages() {
    return Object.keys(busListingData.BusListing);
  }

  static get pageKeys() {
    return busListingData.BusListing.en.pages.map((p) => p.key);
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
   * Open the shared CheckOffersLead modal via this page's trigger CTA
   * ("Check Bus Price" or "Notify Me"); re-click until it hydrates. The
   * retry click is a raw DOM `.click()` via `cy.document()` (never the bare
   * `document` global — see AGENTS.md golden rule 20) rather than a fresh
   * `cy.` command, since invoking a `cy.` command from inside a `.should()`
   * retry callback throws.
   */
  openLeadForm() {
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

  verifyLeadSubmitted() {
    cy.contains('h3', exactText(this.checkOffersLeadCopy.thankYouHeading)).should('be.visible');
  }

  /** One CheckOffersLead fill + submit via this page's trigger CTA. */
  submitLead(overrides = {}) {
    this.openLeadForm();
    this.checkOffersLead.fillAndSubmit({
      name: 'testqa',
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    this.verifyLeadSubmitted();
  }
}

module.exports = BusListing;
