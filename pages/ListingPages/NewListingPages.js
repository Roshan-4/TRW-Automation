const newListingPagesData = require('../../testData/ListingPages/NewListingPagesData.json');
const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { LeadFormFiller, exactText, makeThrottledCtaClicker } = require('../../helpers/leadFormFiller');
const { randomNumberGenerator } = require('../../helpers/randomNumberGenerator');

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
  { key: 'contactSeller', cta: 'Contact Seller', formType: 'getSellerDetails' },
  { key: 'notifyMe', cta: 'Notify Me', formType: 'checkOffers' },
  { key: 'getOffers', cta: 'Call Now', formType: 'getOffers' },
];

/**
 * New Listing Pages: Best Trucks, Popular Truck, Find New Trucks,
 * Upcoming Trucks, Latest Trucks, BS6 Trucks.
 *
 * Scope: lead forms plus the listing chrome that is unique to these
 * pages (page heading, SecondaryNavbar jump links, Filter By row,
 * truck cards, FAQ accordion, Load More). Reused homepage blocks
 * (Popular Brands, Latest Updates, Second Hand, Find Perfect Truck)
 * stay covered by those sections' own specs.
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
 *    your mobile number", plus an "Enter model name" field the site's own
 *    copy calls optional but which is NOT — live reproduction proved the
 *    backend silently rejects the submission when it's left blank, see
 *    `pickAnyDefaultSuggestion`'s doc comment), its city autocomplete
 *    dropdown is `div.absolute.z-10` rows (not `ul li` like CheckOffersLead),
 *    and its submit button reads "Get Offers" under heading "SHARE YOUR
 *    DETAILS TO GET ASSISTANCE". A naive check for `input#name[name="name"]`
 *    alone misses this form entirely — that is why a broader,
 *    click-and-inspect audit (not just one selector) was required to find
 *    it, and why the same audit was re-run against every CTA on every page
 *    rather than assumed from one page's result.
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
    // Contact Seller on these pages is GetSellerDetailsLead (live click-
    // and-inspect: submit "Get Seller Details", confirmation "Thank You
    // For Contact", extra optional price). Matching name/phone ids with
    // CheckOffersLead is not enough — TC-NLP-03 failed while asserting
    // "Thank You!!!" because fillAndSubmit was clicking a page "Check
    // Offers" instead of this modal's submit.
    this.getSellerDetailsLead = new LeadFormFiller({
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: 'Get Seller Details',
      formRootFinder: (filler) => filler.getNameInput().closest('[class*="max-w-"]'),
    });

    const getOffersData = newListingPagesData.GetOffersAssistanceForm;
    this.getOffersLeadCopy = getOffersData[lang] || getOffersData.en;
    // No `:visible` on these selectors — native querySelector in
    // LeadFormFiller.getFormRoot() throws DOMException on jQuery-only
    // pseudo-classes (golden rule 20). Confirmed live on TC-NLP-05.
    this.getOffersLead = new LeadFormFiller({
      nameSelector: `input[placeholder="${this.getOffersLeadCopy.namePlaceholder}"]`,
      mobileSelector: `input[placeholder="${this.getOffersLeadCopy.mobilePlaceholder}"]`,
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
   *
   * Uses a raw DOM click (not `cy.contains(...).filter(':visible').click()`)
   * — confirmed live that the Cypress-command version of this click is
   * unreliable on these listing pages, which carry several
   * visually-identical CTAs (one "Check Offers"/"Contact Seller" per truck
   * card): `cy.contains()` can resolve to a button that `filter(':visible')`
   * then narrows to zero elements, leaving the click silently skipped. Same
   * raw-DOM-click pattern used by pages/UtilityPages/Tyres.js and
   * TabbedModelOffers.js, which don't hit this failure mode. The re-click is
   * throttled via `makeThrottledCtaClicker` — see its doc comment for why an
   * un-throttled retry can double-open this non-portal-isolated modal.
   */
  openCheckOffersLeadViaCta(ctaLabel) {
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

  verifyCheckOffersLeadSubmitted() {
    cy.contains('h3', exactText(this.checkOffersLeadCopy.thankYouHeading)).should('be.visible');
  }

  verifyGetSellerDetailsLeadSubmitted() {
    cy.contains(/thank you for contact/i, { log: false }).should('be.visible');
  }

  submitGetSellerDetailsLeadViaCta(ctaLabel, overrides = {}) {
    this.openCheckOffersLeadViaCta(ctaLabel);
    this.getSellerDetailsLead.fillAndSubmit({
      name: 'testqa',
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    this.verifyGetSellerDetailsLeadSubmitted();
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
   *
   * Raw DOM click, not `cy.contains(...).filter(':visible').click()` — see
   * `openCheckOffersLeadViaCta` above for why that idiom is unreliable on
   * these listing pages.
   */
  openGetOffersLead() {
    const ctaLabel = this.getOffersLeadCopy.triggerCta;
    cy.document().then((doc) => {
      const clickCta = makeThrottledCtaClicker(doc, ctaLabel);

      clickCta();
      cy.contains(this.getOffersLeadCopy.heading, { log: false }).should(($heading) => {
        if (!$heading.is(':visible')) {
          clickCta();
        }
        expect($heading.is(':visible'), `${ctaLabel} assistance lead form is visible`).to.eq(true);
      });
    });
  }

  /**
   * "The heading disappears" (`.should('not.exist')`) was the original
   * signal here and was wrong twice over. First: live reproduction (real
   * fills, real clicks, watched 20+ real seconds, several mobile numbers)
   * proved the modal never dismissed and fields silently reset to blank
   * when "Enter model name" was left empty — no visible error anywhere,
   * the same silent-rejection pattern found elsewhere on this site. Filling
   * that field (`pickAnyDefaultSuggestion`, called from
   * `submitGetOffersLead` before this runs) makes a real "✕ THANK YOU!!!"
   * confirmation appear inside the modal. Second, even with that fix, a
   * live headed run still hit `Cannot set property message of [object
   * DOMException]` on 3 of 5 listing pages with a fully valid, correctly
   * filled submission — `.should('not.exist')` needs zero matches on every
   * retry tick, which is fragile against this ad-heavy page's own scripts
   * mutating the DOM mid-check. Asserting the real "✕ THANK YOU!!!" text
   * *appearing* instead only needs one successful match — the same
   * positive-existence idiom `verifyCheckOffersLeadSubmitted` already uses
   * — and is far less exposed to that race.
   */
  verifyGetOffersLeadSubmitted() {
    // Live confirmation is "✕ THANK YOU!!!" (close icon + heading in one
    // node). exactText("THANK YOU!!!") never matches that, even when the
    // thank-you screen is on screen — confirmed on TC-NLP-05.
    cy.contains(/thank you!!!/i, { timeout: 20000 }).should('be.visible');
  }

  /**
   * The "Enter model name" field is documented elsewhere in this file (and
   * in this component's own copy) as "optional" — that's wrong. Live
   * reproduction proved the backend silently rejects the submission when
   * it's left blank (form resets to empty, no visible error, modal stays
   * open indefinitely). No search term is typed — a fixed brand/model name
   * isn't safe to rely on across every page sharing this component (see
   * `pages/CategoryPages/ElectricVehicle.js`'s identical method) — instead
   * the field is clicked to reveal its default suggestion list, and
   * whichever suggestion it defaults to is picked.
   */
  pickAnyDefaultSuggestion() {
    const modelInput = () =>
      cy.get(`input[placeholder="${this.getOffersLeadCopy.modelPlaceholder}"]:visible`, {
        log: false,
        timeout: 30000,
      });
    modelInput().should('be.visible').click({ force: true });

    const isLeafMatch = (el) =>
      el.children.length === 0 && el.offsetParent !== null && el.textContent.trim().length > 0;

    cy.document().then((doc) => {
      const clickSuggestion = () => {
        const suggestion = [...doc.querySelectorAll('div.absolute.z-10 *')].find(isLeafMatch);
        if (suggestion) {
          ['mousedown', 'mouseup', 'click'].forEach((type) => {
            suggestion.dispatchEvent(
              new MouseEvent(type, { bubbles: true, cancelable: true, view: doc.defaultView })
            );
          });
        }
      };

      clickSuggestion();
      modelInput().should(($input) => {
        const selected = ($input.val() || '').length > 0;
        if (!selected) {
          clickSuggestion();
        }
        expect(selected, 'a default suggestion is selected').to.eq(true);
      });
    });
  }

  /**
   * One Get Offers (Call Now) assistance lead fill + submit for this
   * listing page. Filled top-to-bottom in the real on-screen field order
   * (Model → Name → Mobile → City), matching
   * `ElectricVehicle.submitCallNowLead` — see `pickAnyDefaultSuggestion`'s
   * doc comment for why the model field can no longer be skipped.
   */
  submitGetOffersLead(overrides = {}) {
    this.openGetOffersLead();

    const name = overrides.name || 'testqa';
    const mobile = overrides.mobile !== undefined ? overrides.mobile : randomNumberGenerator();
    const city = overrides.city || this.checkOffersLeadCopy.city;

    this.pickAnyDefaultSuggestion();
    this.getOffersLead.clearAndTypeName(name);
    this.getOffersLead.clearAndTypeMobile(mobile);
    this.getOffersLead.typeCityAndPickSuggestion(city);
    this.getOffersLead.submit();

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
    if (slot.formType === 'getSellerDetails') {
      return this.submitGetSellerDetailsLeadViaCta(slot.cta, overrides);
    }
    return this.submitCheckOffersLeadViaCta(slot.cta, overrides);
  }

  // --- Page components (not lead forms) ---

  get heading() {
    return this.page.heading;
  }

  get listingHeadingPattern() {
    return new RegExp(this.page.listingHeadingPattern);
  }

  verifyPageHeading() {
    cy.contains('h1', exactText(this.page.heading), { timeout: 20000 }).should('be.visible');
  }

  hasSecondaryNav() {
    return Array.isArray(this.page.secondaryNav) && this.page.secondaryNav.length > 0;
  }

  verifyListingSecondaryNavbar() {
    const items = this.page.secondaryNav || [];
    cy.get('div.secondaryNav.sticky', { timeout: 20000 }).should(($nav) => {
      expect($nav.is(':visible'), `${this.pageLabel} SecondaryNavbar should be visible`).to.eq(true);
      items.forEach((item) => {
        const match = $nav.find('[title]').filter((_, el) => el.getAttribute('title') === item);
        expect(
          match.length,
          `SecondaryNavbar should show the "${item}" jump link on ${this.pageLabel}`
        ).to.be.greaterThan(0);
      });
    });
  }

  clickListingSecondaryNav(itemTitle) {
    cy.get('div.secondaryNav.sticky', { timeout: 20000 })
      .find(`[title="${itemTitle}"]`)
      .first()
      .should('be.visible')
      .then(($el) => {
        $el[0].click();
      });
  }

  verifyTruckListingAndFilters() {
    cy.contains('h2', this.listingHeadingPattern, { timeout: 20000 })
      .scrollIntoView({ offset: { top: -140, left: 0 } })
      .should('be.visible');

    // Filter By is in the DOM on both devices; on mobile it is not painted
    // until the user opens the filter drawer — presence is enough there.
    cy.get('.filterWrapper', { timeout: 15000 }).should(($wrap) => {
      expect($wrap.is(':visible') || $wrap.length > 0, `Filter By row should be present on ${this.pageLabel}`).to.eq(
        true
      );
      const text = $wrap.text().replace(/\s+/g, ' ');
      (this.page.filterLabels || []).forEach((label) => {
        expect(text, `Filter row on ${this.pageLabel} should show "${label}"`).to.include(label);
      });
    });

    cy.contains('button', exactText(this.page.cardCta), { timeout: 20000 })
      .filter(':visible')
      .should('have.length.at.least', 1);
  }

  hasFaq() {
    return Boolean(this.page.faqHeading);
  }

  getFaqSection() {
    return cy
      .contains('h2', exactText(this.page.faqHeading), { timeout: 20000 })
      .scrollIntoView({ offset: { top: -140, left: 0 } })
      .should('be.visible')
      .parent()
      .parent();
  }

  verifyFaqHeading() {
    this.getFaqSection().find('.accordion h3').should('have.length.at.least', 1);
  }

  expandFaqQuestion() {
    // Scope to #truckFaq (same as Compare Trucks). Re-query the live
    // accordion on every click/assert — a captured node goes stale after
    // scrollIntoView and clicks then do nothing. The real toggle is the
    // plus/minus icon (or its cursor-pointer row), not the h3 alone.
    cy.get('#truckFaq', { timeout: 20000 }).scrollIntoView({ offset: { top: -160, left: 0 } });
    cy.get('#truckFaq .accordion', { timeout: 20000 }).eq(1).should('be.visible');

    cy.document().then((doc) => {
      const getAcc = () => doc.querySelectorAll('#truckFaq .accordion')[1];
      const isOpen = () => {
        const acc = getAcc();
        if (!acc) {
          return false;
        }
        const answer = acc.lastElementChild;
        const img = acc.querySelector('img[alt="Plus minus Icon"]');
        const src = (img && img.getAttribute('src')) || '';
        return Boolean(answer && !answer.classList.contains('hidden')) || /minus\.svg/i.test(src);
      };
      let lastClickAt = 0;
      const clickTrigger = () => {
        const now = Date.now();
        if (now - lastClickAt < 1000) {
          return;
        }
        const acc = getAcc();
        if (!acc) {
          return;
        }
        const trigger =
          acc.querySelector('img[alt="Plus minus Icon"]') ||
          acc.querySelector('.cursor-pointer') ||
          acc.querySelector('h3');
        if (!trigger) {
          return;
        }
        ['mousedown', 'mouseup', 'click'].forEach((type) => {
          trigger.dispatchEvent(
            new MouseEvent(type, { bubbles: true, cancelable: true, view: doc.defaultView })
          );
        });
        lastClickAt = now;
      };

      expect(getAcc(), `FAQ question on ${this.pageLabel} is present`).to.exist;
      clickTrigger();
      cy.wrap(null, { timeout: 15000 }).should(() => {
        if (!isOpen()) {
          clickTrigger();
        }
        expect(
          isOpen(),
          `An FAQ answer should be shown on ${this.pageLabel} after opening a question`
        ).to.eq(true);
      });
    });
  }

  hasLoadMore() {
    return Boolean(this.page.hasLoadMore);
  }

  clickLoadMoreAndExpectMoreCards() {
    const cta = this.page.cardCta;
    // Wait on body rather than cy.contains(Load More): a Cypress get/contains
    // can still park the button under the sticky SecondaryNavbar. Dispatch
    // real mouse events (same pattern as pickAnyDefaultSuggestion) — a bare
    // HTMLElement.click() under Cypress did not grow the list.
    cy.get('body', { timeout: 20000 }).should(() => {
      const found = [...Cypress.$('button')].some((el) => el.textContent.trim() === 'Load More');
      expect(found, `Load More is present on ${this.pageLabel}`).to.eq(true);
    });

    cy.document().then((doc) => {
      const countCtas = () =>
        [...doc.querySelectorAll('button')].filter(
          (el) => el.textContent.trim() === cta && el.offsetParent !== null
        ).length;
      const before = countCtas();
      let lastClickAt = 0;
      const clickLoadMore = () => {
        const now = Date.now();
        if (now - lastClickAt < 1000) {
          return;
        }
        const btn = [...doc.querySelectorAll('button')].find(
          (el) => el.textContent.trim() === 'Load More'
        );
        if (!btn) {
          return;
        }
        ['mousedown', 'mouseup', 'click'].forEach((type) => {
          btn.dispatchEvent(
            new MouseEvent(type, { bubbles: true, cancelable: true, view: doc.defaultView })
          );
        });
        lastClickAt = now;
      };
      clickLoadMore();
      cy.wrap(null, { timeout: 20000 }).should(() => {
        if (countCtas() <= before) {
          clickLoadMore();
        }
        expect(
          countCtas(),
          `Load More should show more "${cta}" cards on ${this.pageLabel}`
        ).to.be.greaterThan(before);
      });
    });
  }
}

module.exports = NewListingPages;
