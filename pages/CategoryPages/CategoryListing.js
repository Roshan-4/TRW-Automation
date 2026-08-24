const categoryListingData = require('../../testData/CategoryPages/CategoryListingData.json');
const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const newListingPagesData = require('../../testData/ListingPages/NewListingPagesData.json');
const { LeadFormFiller, exactText, makeThrottledCtaClicker } = require('../../helpers/leadFormFiller');
const { randomNumberGenerator } = require('../../helpers/randomNumberGenerator');

/**
 * Generic category listing pages reached from the main nav's Wheelers /
 * Fuel Type / GVW / Category submenus (Tippers, Trailers, Mini Trucks,
 * Pickups, Transit Mixer, Auto Rickshaw, Tempo Traveller, 3/4/6/8/10/12/14/
 * 16/18/22 Wheeler, Diesel, Petrol, CNG, LPG, LNG, Hydrogen, Bi Fuel, LCV,
 * HCV, SCV, ICV) — one class handles all of them via `pageKey`, same pattern
 * as `NewListingPages`.
 *
 * Scope for now, per request: only the lead form(s) on each page — not the
 * truck list/filters/comparisons/FAQ content.
 *
 * Live click-and-inspect audit (every `<button>` text dumped and counted
 * across all 28 pages, not assumed from one sample) found every page reuses
 * the exact same underlying listing-page component already confirmed on
 * `ElectricVehicle` (`/en/electric`):
 * 1. "Check Truck Price" — one per truck card — always present on every
 *    page — opens the shared `CheckOffersLead` modal.
 * 2. "Call Now" (the "Still confused?" widget) — opens `GetOffersLead` —
 *    present ONLY on the Fuel Type and GVW pages (Diesel/Petrol/CNG/LPG/
 *    LNG/Hydrogen/Bi Fuel/LCV/HCV/SCV/ICV), confirmed absent (0 matches) on
 *    every Category/Wheelers page. `hasCallNow` in
 *    `testData/CategoryPages/CategoryListingData.json` records this per
 *    page so specs can skip the slot cleanly rather than guessing.
 * Some pages also show scattered "Check Offers" buttons from unrelated,
 * reused sitewide sections (a generic truck carousel) — these are already
 * covered by that section's own tests elsewhere and are out of scope here.
 *
 * This is a real production lead (no sandbox) — the submitted name is
 * `testqa`, matching this repo's convention for all lead forms.
 *
 * `en` only for now (only English URLs were audited).
 */
class CategoryListing {
  constructor(lang = 'en', pageKey) {
    this.lang = lang;
    const pages = categoryListingData.CategoryListing[lang]?.pages || [];
    this.page = pages.find((p) => p.key === pageKey);
    if (!this.page) {
      throw new Error(`Unknown Category Listing page key: ${pageKey} for lang=${lang}`);
    }
    this.pageUrl = this.page.path;
    this.checkTruckPriceCta = categoryListingData.CategoryListing[lang].checkTruckPriceCta;

    this.checkOffersLeadCopy =
      truckInIndiaData.CheckOffersForm[lang] || truckInIndiaData.CheckOffersForm.en;
    this.checkOffersLead = new LeadFormFiller({
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: this.checkOffersLeadCopy.submitCta,
    });

    const getOffersData = newListingPagesData.GetOffersAssistanceForm;
    this.getOffersLeadCopy = getOffersData[lang] || getOffersData.en;
    this.getOffersLead = new LeadFormFiller({
      nameSelector: `input[placeholder="${this.getOffersLeadCopy.namePlaceholder}"]`,
      mobileSelector: `input[placeholder="${this.getOffersLeadCopy.mobilePlaceholder}"]`,
      cityPlaceholder: this.getOffersLeadCopy.cityPlaceholder,
      citySuggestionSelector: 'div.absolute.z-10',
      submitText: this.getOffersLeadCopy.submitCta,
    });
  }

  static get supportedLanguages() {
    return Object.keys(categoryListingData.CategoryListing);
  }

  static get pageKeys() {
    return categoryListingData.CategoryListing.en.pages.map((p) => p.key);
  }

  static getPageMeta(pageKey) {
    return categoryListingData.CategoryListing.en.pages.find((p) => p.key === pageKey);
  }

  get pageLabel() {
    return this.page.name;
  }

  get hasCallNow() {
    return Boolean(this.page.hasCallNow);
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
   * `cy.document()` (never the bare `document` global — see AGENTS.md
   * golden rule 20) rather than a fresh `cy.` command, since invoking a
   * `cy.` command from inside a `.should()` retry callback throws.
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
    this.openCheckOffersLeadViaCta(this.checkTruckPriceCta);
    this.checkOffersLead.fillAndSubmit({
      name: 'testqa',
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    this.verifyCheckOffersLeadSubmitted();
  }

  /**
   * Open the "SHARE YOUR DETAILS TO GET ASSISTANCE" lead form via Call Now.
   * The "Call Now" widget lives far down these long pages — a fixed window
   * scroll (not `scrollIntoView()`) is what actually reveals it. Category
   * listing pages vary in length (some have far fewer truck cards than
   * others), so a single 312px scroll — confirmed working directly by the
   * user — is used rather than the larger two-step scroll tuned for
   * `ElectricVehicle`'s specifically longer page.
   */
  openGetOffersLead() {
    cy.window().then((win) => win.scrollBy(0, 312));

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

  verifyGetOffersLeadSubmitted() {
    cy.contains(exactText(this.getOffersLeadCopy.heading), { log: false }).should('not.exist');
  }

  /**
   * One Get Offers (Call Now) assistance lead fill + submit. City and the
   * optional model field are both autocomplete dropdowns whose real click
   * target is a leaf child of `div.absolute.z-10`, not the wrapper itself —
   * a plain `.click({ force: true })` on the wrong element doesn't land the
   * selection, confirmed live via `document.elementFromPoint`. Re-clicks
   * until the field's value proves the selection actually landed.
   */
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
    // "Tata" — different category pages carry different brand inventories
    // (confirmed live: LPG's model list includes "Atul Gem Paxx LPG" but a
    // "Tata" search there never reliably settled), so hardcoding one brand
    // name doesn't generalise across all 28 pages. Simply clicking the
    // field to focus it reveals its default suggestion list without typing
    // anything — any suggestion from that list is picked, matching a real,
    // working recorded interaction the user provided.
    this.pickAnyDefaultSuggestion(() =>
      cy.get('input[placeholder="Enter model name"]:visible', { log: false, timeout: 45000 })
    );
    this.getOffersLead.clearAndTypeName(name);
    this.getOffersLead.clearAndTypeMobile(mobile);
    // `expectedSubstring` must be something only the FULL SELECTED address
    // contains (a comma, e.g. "201301, Noida, Noida, Uttar Pradesh") — not
    // the raw typed city name itself. Checking for the typed text would
    // pass trivially the instant typing finishes (it's a substring of
    // itself), before any suggestion is ever actually clicked, leaving the
    // dropdown open and never verified.
    // A plain `getCityInput()` uses the default 15s command timeout, which
    // a live failure screenshot proved isn't always enough — the location
    // search API (confirmed live to return the correct result in ~3s in
    // isolation) can take longer than that under a full 28-page batch run's
    // extra load. A direct `cy.get(..., { timeout })` on the same selector,
    // like the model field above, gives the retry loop more room.
    this.pickDropdownSuggestionWithRetry(
      () =>
        cy.get(`input[placeholder="${this.getOffersLeadCopy.cityPlaceholder}"]:visible`, {
          log: false,
          timeout: 45000,
        }),
      city,
      ','
    );
    this.getOffersLead.submit();

    this.verifyGetOffersLeadSubmitted();
  }

  /**
   * Type into a `div.absolute.z-10`-dropdown-backed input and click its
   * leaf suggestion row, re-clicking until the field's value proves the
   * selection landed. `expectedSubstring` is what the final value must
   * contain (a comma for the city's full address string); pass `null` to
   * accept any non-empty, changed value (the model field, where any
   * suggestion is fine).
   *
   * `getInput` must be a **function** returning a fresh `cy.get(...)` each
   * time it's called, not an already-evaluated chainable passed in once.
   * A failure screenshot once showed the field visually holding the
   * correct, fully-selected value while the assertion still reported
   * `false` with no "Timed out retrying" wrapper in the error at all — a
   * sign the retry wasn't actually happening. Reusing one chainable across
   * several separate `.should()`/`.clear()`/`.type()` calls doesn't
   * re-query the DOM fresh on each Cypress retry tick the way a brand-new
   * `cy.get()` call does; calling a passed-in getter function each time
   * does.
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
    // changing before attempting any click) was tried here and made things
    // worse on one page (LPG) whose result list apparently never settles
    // within 30s, timing out the pre-check itself before a click was ever
    // attempted. It's unnecessary now that the real bug is fixed below
    // (`getInput` is a function re-invoked fresh each call, not a stale
    // reused chainable) — the retry-click loop's own `.should()` already
    // retries correctly against the live DOM on every tick, so it recovers
    // from a still-shifting list on its own without needing a separate gate
    // first.

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

  /**
   * Click a `div.absolute.z-10`-dropdown-backed input to focus it (no
   * typing) and pick whichever leaf suggestion it defaults to. Used for the
   * model field instead of typing a fixed brand name: different category
   * pages carry different inventories, so a hardcoded search term isn't
   * reliable everywhere, but focusing the empty field reveals a default
   * suggestion list on every page regardless of its inventory.
   */
  pickAnyDefaultSuggestion(getInput) {
    getInput().should('be.visible').click({ force: true });

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
      getInput().should(($input) => {
        const selected = ($input.val() || '').length > 0;
        if (!selected) {
          clickSuggestion();
        }
        expect(selected, 'a default suggestion is selected').to.eq(true);
      });
    });
  }
}

module.exports = CategoryListing;
