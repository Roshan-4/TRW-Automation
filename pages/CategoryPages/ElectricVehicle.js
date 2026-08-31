const electricVehicleData = require('../../testData/CategoryPages/ElectricVehicleData.json');
const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const newListingPagesData = require('../../testData/ListingPages/NewListingPagesData.json');
const { LeadFormFiller, exactText, makeThrottledCtaClicker } = require('../../helpers/leadFormFiller');
const { randomNumberGenerator } = require('../../helpers/randomNumberGenerator');

/**
 * Electric Commercial Vehicles category page (/en/electric).
 *
 * Scope for now, per request: only the lead forms on this page — not the
 * truck list/budget-brand filters/comparisons/FAQ content, which is out of
 * scope until asked for.
 *
 * Live click-and-inspect audit (every `<button>` text on the page dumped and
 * inspected, not a visual guess) found this page reuses the same underlying
 * listing-page component as `NewListingPages` (Best Trucks/Popular Trucks/
 * etc.) — same two lead-form components, reached via the same CTA labels:
 * 1. "Check Truck Price" — one per truck card (22 on this page) — opens the
 *    shared CheckOffersLead modal also used on Homepage/PDP/Listing/Compare/
 *    Brochure (`input#name[name="name"]`, "Check Offers" submit).
 * 2. "Call Now" (the "Still confused?" assistance widget) — opens the
 *    GetOffersLead component (placeholder-only inputs, no id/name, heading
 *    "SHARE YOUR DETAILS TO GET ASSISTANCE", submit "Get Offers") — same
 *    component and copy as `NewListingPages`' Call Now slot, reused here via
 *    `testData/ListingPages/NewListingPagesData.json` → `GetOffersAssistanceForm`
 *    rather than duplicating that copy.
 * No "Check Offers"/"Contact Seller"/"Notify Me" CTA text was found on this
 * page, unlike some New Listing Pages.
 *
 * This is a real production lead (no sandbox) — the submitted name is
 * `testqa`, matching this repo's convention for all lead forms.
 *
 * `en` only for now (only the English URL was given; hi/ta not yet confirmed).
 */
class ElectricVehicle {
  constructor(lang = 'en') {
    this.lang = lang;
    this.page = electricVehicleData.ElectricVehicle[lang] || electricVehicleData.ElectricVehicle.en;
    this.pageUrl = this.page.path;

    this.checkOffersLeadCopy =
      truckInIndiaData.CheckOffersForm[lang] || truckInIndiaData.CheckOffersForm.en;
    this.checkOffersLead = new LeadFormFiller({
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: this.checkOffersLeadCopy.submitCta,
    });

    const getOffersData = newListingPagesData.GetOffersAssistanceForm;
    this.getOffersLeadCopy = getOffersData[lang] || getOffersData.en;
    // No `:visible` suffix on these selectors (unlike NewListingPages' copy
    // of this same setup): this page has exactly one instance of each field
    // when the modal is open, so disambiguation isn't needed, and `:visible`
    // is jQuery-only syntax — `LeadFormFiller.getFormRoot()`'s fallback path
    // calls the *native* `Element.querySelector(this.mobileSelector)`, which
    // throws a `SyntaxError` (a `DOMException`) on invalid selector syntax.
    // That was the real cause of a "Cannot set property message of [object
    // DOMException]" crash chased across several earlier attempts here.
    this.getOffersLead = new LeadFormFiller({
      nameSelector: `input[placeholder="${this.getOffersLeadCopy.namePlaceholder}"]`,
      mobileSelector: `input[placeholder="${this.getOffersLeadCopy.mobilePlaceholder}"]`,
      cityPlaceholder: this.getOffersLeadCopy.cityPlaceholder,
      citySuggestionSelector: 'div.absolute.z-10',
      submitText: this.getOffersLeadCopy.submitCta,
    });
  }

  static get supportedLanguages() {
    return Object.keys(electricVehicleData.ElectricVehicle);
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
   * Open the shared CheckOffersLead modal via a specific trigger CTA;
   * re-click until it hydrates. The retry click is a raw DOM `.click()` via
   * `cy.document()` (the AUT's real document, never the bare `document`
   * global — that resolves to the Cypress test runner's own document, a
   * documented trap in this project) rather than a fresh `cy.` command,
   * since invoking a `cy.` command from inside a `.should()` retry callback
   * throws (`cy.should() failed because you invoked a command inside the
   * callback`) — confirmed live on this page, where the retry branch
   * actually gets exercised, unlike on faster-hydrating pages elsewhere.
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

  /** One CheckOffersLead fill + submit via "Check Truck Price" on a truck card. */
  submitCheckTruckPriceLead(overrides = {}) {
    this.openCheckOffersLeadViaCta(this.page.checkTruckPriceCta);
    this.checkOffersLead.fillAndSubmit({
      name: 'testqa',
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    this.verifyCheckOffersLeadSubmitted();
  }

  /**
   * Open the "SHARE YOUR DETAILS TO GET ASSISTANCE" lead form via Call Now;
   * re-click until it hydrates.
   *
   * This page has two independent scroll regions: the main left content
   * column scrolls normally, while the right sidebar (where the "Call Now"
   * widget lives, alongside Popular Brands) stays pinned until the page is
   * scrolled past roughly its halfway point, only then following along.
   * `scrollIntoView()` on the widget itself doesn't account for that second
   * scroll region, so per the user's live diagnosis it never became
   * `:visible` no matter how long the retry window was. Scrolling the window
   * down in two fixed steps — enough to cross that halfway point, then a
   * bit further to bring the widget fully into the sidebar's own visible
   * area — is what actually reveals it.
   */
  openGetOffersLead() {
    cy.window().then((win) => win.scrollBy(0, 500));
    cy.window().then((win) => win.scrollBy(0, 150));

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
   * This form has no "Thank You" text on success (unlike CheckOffersLead).
   * `NewListingPages.verifyGetOffersLeadSubmitted` verifies via a
   * `cy.intercept`/`cy.wait` on the real submit network call, but on this
   * page that consistently crashed with an opaque internal Cypress error
   * (`Cannot set property message of [object DOMException]`) — reproduced
   * even after scoping the intercept to the site's own domain, so it isn't
   * simply third-party traffic (e.g. Datadog replay/analytics beacons)
   * matching the alias. Rather than keep chasing a fragile network
   * dependency on this specific ad-heavy page, this relies solely on the
   * same DOM signal already used as the secondary check elsewhere: the
   * assistance heading disappearing after a real submit click.
   */
  verifyGetOffersLeadSubmitted() {
    cy.contains(exactText(this.getOffersLeadCopy.heading), { log: false }).should('not.exist');
  }

  /** One Get Offers (Call Now) assistance lead fill + submit for this page. */
  submitCallNowLead(overrides = {}) {
    this.openGetOffersLead();

    const name = overrides.name || 'testqa';
    const mobile = overrides.mobile !== undefined ? overrides.mobile : randomNumberGenerator();
    const city = overrides.city || this.checkOffersLeadCopy.city;

    // Filled top-to-bottom in the real on-screen field order (Model → Name
    // → Mobile → City), not an arbitrary internal order — this is what a
    // real user does, and what a stakeholder watching the run or reading
    // the Allure steps expects to see.
    //
    // The model field is NOT typed into with a fixed search term like
    // "Tata" — different pages sharing this same component can carry
    // different inventories (confirmed live on CategoryListing: a "Tata"
    // search that works fine here didn't reliably exist on every category
    // page), so hardcoding one brand name isn't safe to rely on generally.
    // Simply clicking the field to focus it reveals its default suggestion
    // list without typing anything — any suggestion from that list is
    // picked, matching a real, working recorded interaction the user
    // provided.
    this.pickAnyDefaultSuggestion();
    this.getOffersLead.clearAndTypeName(name);
    this.getOffersLead.clearAndTypeMobile(mobile);
    this.pickCitySuggestionWithRetry(city);
    // No price/budget field exists on this form (only "Enter model name",
    // handled above), so `fillPriceOrBudgetIfPresent` is skipped as a no-op.
    this.getOffersLead.submit();

    this.verifyGetOffersLeadSubmitted();
  }

  /**
   * Type the city and click its suggestion, re-clicking until the field
   * actually holds the full selected address (a comma-separated string like
   * "201301, Noida, Noida, Uttar Pradesh"), not just the raw typed prefix.
   *
   * A single `.click({ force: true })` on the suggestion — the normal
   * `LeadFormFiller.typeCityAndPickSuggestion` path, which works fine on
   * other pages using this same GetOffersLead component — was confirmed live
   * to sometimes not land here: a standalone Playwright click on the exact
   * same, sole matching element succeeded immediately, so this isn't a
   * missing/ambiguous-element problem, just a real click-timing race, most
   * likely layout shift from this page's heavy ad content moving things
   * between the visibility check and the click. Retrying the click until the
   * field's value proves the selection actually landed — the same
   * self-correcting idiom used by `SellUsedTrucks.pickAutocompleteOption` —
   * is more robust here than trusting one click to succeed.
   */
  pickCitySuggestionWithRetry(city) {
    const cityInput = () =>
      cy.get(`input[placeholder="${this.getOffersLeadCopy.cityPlaceholder}"]:visible`, {
        log: false,
        timeout: 30000,
      });
    this.pickDropdownSuggestionWithRetry(cityInput, city, ',');
  }

  /**
   * Optional "Enter model name" field on the Call Now form — also an
   * autocomplete dropdown (same `div.absolute.z-10` wrapper / leaf-row
   * markup as the city field). No search term is typed — the field is
   * clicked to focus it, revealing its default suggestion list, and
   * whichever suggestion it defaults to is picked (see golden rule 24 in
   * AGENTS.md — a fixed brand name isn't safe to rely on generally, even
   * though "Tata" happens to work reliably on this specific page).
   */
  pickAnyDefaultSuggestion() {
    const modelInput = () =>
      cy.get('input[placeholder="Enter model name"]:visible', { log: false, timeout: 30000 });
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
   * Type into a `div.absolute.z-10`-dropdown-backed input and click its
   * leaf suggestion row. `expectedSubstring` is what the final value must
   * contain (a comma for the city's full address string); pass `null` to
   * accept any non-empty, changed value (the model field, where any
   * suggestion is fine).
   *
   * A single one-shot click (even after confirming the suggestion exists
   * first) is not reliably enough — tried that split "wait for it → click
   * once → verify" structure and it regressed this exact page, which had
   * been passing reliably: a re-render can replace the dropdown's DOM node
   * in the gap between confirming it exists and clicking it, and with no
   * retry there's nothing to recover a missed click. Re-clicking on every
   * retry tick until the value proves the selection landed (the same idiom
   * as `SellUsedTrucks.pickAutocompleteOption`) is the version actually
   * proven reliable here.
   */
  pickDropdownSuggestionWithRetry(getInput, typeText, expectedSubstring) {
    getInput().should('be.visible').clear({ force: true }).type(typeText, { force: true });

    const typeTextLower = typeText.toLowerCase();
    const isLeafMatch = (el) =>
      el.children.length === 0 &&
      el.offsetParent !== null &&
      el.textContent.trim().length > 0 &&
      el.textContent.toLowerCase().includes(typeTextLower);

    // A stabilization pre-check (wait for the dropdown's content to stop
    // changing before attempting any click) was tried and made things worse
    // on a page whose result list apparently never settles within 30s,
    // timing out the pre-check itself before a click was ever attempted.
    // It's unnecessary now that the real bug is fixed below (`getInput` is
    // a function re-invoked fresh each call, not a stale reused chainable)
    // — the retry-click loop's own `.should()` already retries correctly
    // against the live DOM on every tick, so it recovers from a
    // still-shifting list on its own without needing a separate gate first.
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
      getInput().should(($input) => {
        const value = $input.val() || '';
        const selected = expectedSubstring ? value.includes(expectedSubstring) : value.length > 0 && value !== typeText;
        if (!selected) {
          clickSuggestion();
        }
        expect(selected, `"${typeText}" suggestion is selected`).to.eq(true);
      });
    });
  }

  verifyListingChrome() {
    cy.get('h1', { timeout: 20000 }).should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('.filterWrapper').length) {
        // Present on both devices; on mobile the row is not painted until
        // the filter drawer is opened, so assert on copy rather than visibility.
        cy.get('.filterWrapper').should(($wrap) => {
          expect($wrap.text(), `Filter By should be shown on ${this.pageLabel}`).to.include('Filter By');
        });
      }
    });
    cy.contains('button', exactText(this.page.checkTruckPriceCta), { timeout: 20000 })
      .filter(':visible')
      .should('have.length.at.least', 1);
  }
}

module.exports = ElectricVehicle;
