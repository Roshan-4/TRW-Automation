const sellUsedTrucksData = require('../../testData/UsedTruck/SellUsedTrucksData.json');
const { randomNumberGenerator } = require('../../helpers/randomNumberGenerator');

/**
 * Sell Used Trucks (/en/sell-used-truck).
 *
 * NOT a simple lead form — a full multi-step truck-listing wizard, confirmed
 * live by walking the entire flow (not assumed):
 *   Step 1 Brand
 *   → Step 2 Model / Year / Kilometers Driven / Expected Selling Price
 *     (+ optional Permit / Fitness / Insurance / Tax Validity)
 *   → Step 3 Upload Photos (minimum 2 images enforced: "Please upload
 *     atleast 2 images for your listing")
 *   → Step 4 contact info (Full Name / Mobile No. / State / District)
 *   → OTP verification ("Verify and sell your Truck").
 *
 * OTP-gated at the very last step, same pattern as GetInformationLead
 * elsewhere in this project (see pages/UsedTruck/CvPermit.js etc.) — there
 * is no configured test OTP in this repo (`TJ_USER_OTP` in
 * `cypress/.env.example` is an empty, unused placeholder), so full
 * end-to-end listing creation is out of scope. Per explicit user direction
 * ("automate up to wherever it stops" rather than skip the page), this
 * drives the entire wizard for real — real brand/model/year/km/price
 * selection, a real 2-image upload, real name/mobile/state/district
 * submission — and verifies up to the OTP screen appearing.
 *
 * Autocomplete fields (Brand, Model, Year, State, District) share identical
 * markup with no unique id/name attribute — scoped by their floating
 * <label> text instead (`getFieldInputByLabel`), same technique as
 * `helpers/getInformationLeadFiller.js`'s brand field. Kilometers Driven is
 * a **fixed range picker**, not freeform text — typing a number produces
 * "No results found" and silently fails validation ("Please enter
 * Kilometers Driven") even though the raw input value looks filled; the
 * field must be clicked and one of the four preset options selected
 * instead (`selectPresetOption`).
 *
 * No fixed waits and no unnecessary `{ force: true }` (see AGENTS.md golden
 * rule 18) — every step waits on a real, observable condition, and clicks
 * rely on Cypress's own actionability checks unless there's a specific,
 * commented reason a control is legitimately not "visible" to Cypress.
 */
class SellUsedTrucks {
  constructor(lang = 'en') {
    this.lang = lang;
    this.page = sellUsedTrucksData.SellUsedTrucks[lang] || sellUsedTrucksData.SellUsedTrucks.en;
    this.pageUrl = this.page.path;
    this.identifierKey = this.page.identifierKey;
  }

  static get supportedLanguages() {
    return Object.keys(sellUsedTrucksData.SellUsedTrucks);
  }

  get pageLabel() {
    return this.page.name;
  }

  navigate() {
    cy.visit(this.pageUrl, { timeout: 90000 });
    cy.document().its('readyState').should('eq', 'complete');
    this.dismissBlockingOverlays();
  }

  /**
   * Best-effort dismiss of a cookie/consent banner that may or may not be
   * present. `force: true` is kept here (matching every other page object
   * in this project) because the banner can be mid-transition when this
   * runs; it is a low-risk, optional UI dismissal, not a step whose
   * correctness the test depends on.
   */
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

  /** Autocomplete/wizard inputs here have no id/name — scope by floating label text instead. */
  getFieldInputByLabel(labelText) {
    return cy.contains('label', labelText, { log: false }).parent().find('input');
  }

  /**
   * Type into an autocomplete field and click its exact-text suggestion.
   * Some of these fields (e.g. District, right after State changes) can get
   * an async default value shortly after being focused, racing against a
   * plain `.clear()`/`.type()` and leaving a stray prefix (confirmed live:
   * District showed "BhagalpurAgra" instead of "Agra", producing "No
   * results found"). Rather than a fixed wait to dodge the race, this
   * re-types until Cypress's own retry confirms the field actually holds
   * exactly what was typed — same "retry the action until the condition
   * holds" idiom already used by e.g. `openCheckOffersLeadViaCta` elsewhere
   * in this project, instead of a `cy.wait(ms)`.
   *
   * The page can have more than one element with the exact suggestion text
   * at once — e.g. a static "Tata" brand-logo caption further down the page
   * alongside the real live dropdown item — so the match closest to the
   * input (by vertical distance) is used, not just any matching element.
   * Confirmed live: the real `<li>` suggestion sits immediately below the
   * input (distance ~0), the unrelated card caption sits ~200px further
   * down — an easy, reliable disambiguator once the search actually looks
   * in the right document (see below).
   *
   * This is checked inside a retrying `.should()` rather than a one-shot
   * `.then()`, since the real dropdown can still be rendering (async,
   * debounced) at the instant right after typing; a plain `.then()` snapshot
   * taken too early can only see the unrelated static match and pick that
   * instead of waiting for the genuine one to appear.
   *
   * A bare `document` reference here resolves to the Cypress test runner's
   * own document, not the application under test's — `Cypress.$(document)`
   * was silently searching an empty page and always returning zero
   * candidates. `$input[0].ownerDocument` is the input's real, actual
   * document, so it can never be ambiguous.
   */
  pickAutocompleteOption(labelText, typeText, exactMatchText) {
    const match = exactMatchText || typeText;
    const typeIntoField = () => {
      this.getFieldInputByLabel(labelText).clear().type('{selectall}{backspace}').type(typeText);
    };

    // Retries via a recursive `.then()`, not `.should()` — `.should()`'s
    // retry callback cannot enqueue new `cy.` commands (Cypress throws
    // "cy.should() failed because you invoked a command inside the
    // callback"), and `typeIntoField()` above is exactly that: a real
    // `cy.type()` re-attempt, kept as genuine simulated typing rather than
    // a raw DOM value-set, per this project's standing preference for real
    // user-behavior interactions over programmatic shortcuts. Bounded to a
    // handful of attempts rather than Cypress's own timeout-driven retry.
    const ensureTyped = (attemptsLeft = 5) => {
      this.getFieldInputByLabel(labelText).then(($input) => {
        if ($input.val().trim() === typeText) {
          return;
        }
        if (attemptsLeft <= 0) {
          expect($input.val().trim(), `${labelText} field holds exactly the typed text`).to.eq(typeText);
          return;
        }
        typeIntoField();
        ensureTyped(attemptsLeft - 1);
      });
    };

    typeIntoField();
    ensureTyped();

    const exactMatch = new RegExp(`^${match}\\s*$`, 'i');
    const closestSuggestionToInput = ($input) => {
      const inputEl = $input[0];
      const inputTop = inputEl.getBoundingClientRect().top;
      const candidates = [...inputEl.ownerDocument.querySelectorAll('*')].filter(
        (el) => el.children.length === 0 && exactMatch.test(el.textContent.trim()) && el.offsetParent !== null
      );
      return candidates.reduce((closest, el) => {
        const distance = Math.abs(el.getBoundingClientRect().top - inputTop);
        return distance < closest.distance ? { el, distance } : closest;
      }, { el: null, distance: Infinity }).el;
    };

    this.getFieldInputByLabel(labelText).should(($input) => {
      expect(
        closestSuggestionToInput($input),
        `a "${match}" suggestion is visible near the ${labelText} field`
      ).to.not.be.null;
    });
    this.getFieldInputByLabel(labelText).then(($input) => {
      const suggestion = closestSuggestionToInput($input);
      cy.wrap(suggestion).click();
    });
  }

  /**
   * Click a field to reveal its fixed preset options (e.g. Kilometers
   * Driven) and pick one by visible text.
   */
  selectPresetOption(labelText, optionText) {
    this.getFieldInputByLabel(labelText).should('be.visible').click();
    cy.contains('li, div', optionText, { log: false }).then(($option) => {
      cy.wrap($option).should('be.visible').click();
    });
  }

  clickNext() {
    cy.contains('button', /^Next$/, { log: false }).should('be.visible').click();
  }

  /**
   * Step 1: pick the truck brand. Once a brand is picked, the Next button
   * sits just below the fold by a few pixels — a small 10px nudge is enough
   * to bring it into view (all later fields are dropdown/preset selections
   * that don't need this).
   */
  fillStep1Brand() {
    this.pickAutocompleteOption('Brands*', this.page.sampleTruck.brand);
    cy.window().then((win) => win.scrollBy(0, 10));
    this.clickNext();
    this.getFieldInputByLabel('Model*').should('be.visible');
  }

  /** Step 2: model, year, kilometers driven (preset range), expected price. */
  fillStep2TruckDetails() {
    const { model, modelMatch, year, kmOptionText, expectedPrice } = this.page.sampleTruck;
    this.pickAutocompleteOption('Model*', model, modelMatch);
    this.pickAutocompleteOption('Year*', year);
    cy.get('body').type('{esc}');
    this.selectPresetOption('Kilometers Driven*', kmOptionText);
    this.getFieldInputByLabel('Expected Selling Price*').should('be.visible').click().type(expectedPrice);
    cy.get('body').type('{esc}');
    // Step 2's optional fields (Permit/Fitness/Insurance/Tax Validity) push
    // the Next button below the fold — a 150px nudge brings it back into view.
    cy.window().then((win) => win.scrollBy(0, 150));
    this.clickNext();
    cy.contains('button', 'Upload Photos', { log: false }).should('be.visible');
  }

  /**
   * Step 3: upload two placeholder images (`cypress/fixtures/sample-truck-*.png`
   * — plain generated PNGs, not personal data). The file input only accepts
   * one file at a time; a fresh "Upload Photos" click is needed before the
   * second `selectFile`. The site enforces a minimum of 2 images. Rather
   * than a fixed wait for the upload to "settle", this waits on the actual
   * observable signal — the blob-URL preview thumbnail Cypress can see in
   * the DOM as soon as each upload is processed. `force: true` on
   * `selectFile` is the one legitimate case here: the native file input is
   * deliberately hidden behind the styled "Upload Photos" button (real
   * users never see or click it directly), so it fails Cypress's visibility
   * check by design, not because of a bug.
   */
  fillStep3Photos() {
    cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-truck-1.png', { force: true });
    cy.get('img[src^="blob:"]', { log: false }).should('have.length.at.least', 1);
    cy.contains('button', 'Upload Photos', { log: false }).click();
    cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-truck-2.png', { force: true });
    cy.get('img[src^="blob:"]', { log: false }).should('have.length.at.least', 2);
    this.clickNext();
    this.getFieldInputByLabel('Full Name*').should('be.visible');
  }

  /**
   * Step 4: seller contact info. Per explicit user direction, name defaults
   * to "testqa" (matching this repo's existing test-data convention — see
   * `testData/HomePage/TruckInIndiaData.json` → `CheckOffersForm.name`)
   * rather than a page-identifier string; mobile is a generated throwaway
   * number (never real personal data).
   */
  fillStep4ContactInfo(overrides = {}) {
    const name = overrides.name || 'testqa';
    const mobile = overrides.mobile !== undefined ? overrides.mobile : randomNumberGenerator();
    const { state, district } = this.page.sampleLocation;

    this.getFieldInputByLabel('Full Name*').should('be.visible').click().type(name);
    this.getFieldInputByLabel('Mobile No.*').should('be.visible').click().type(String(mobile));
    this.pickAutocompleteOption('State*', state);
    this.pickAutocompleteOption('District*', district);
    this.clickNext();
  }

  /**
   * The whole listing wizard is OTP-gated at the final step — submitting
   * contact info sends an OTP and shows "Verify and sell your Truck" with
   * an "Enter OTP" field (a floating label, not a placeholder — same
   * pattern as GetInformationLead's OTP screen), rather than completing the
   * listing. There is no configured test OTP in this repo, so this is the
   * honest, achievable checkpoint. Do not claim full listing completion
   * beyond this without a real test OTP.
   */
  verifyOtpVerificationRequested() {
    cy.contains(/verify and sell your truck/i, { log: false }).should('be.visible');
    this.getFieldInputByLabel('Enter OTP').should('be.visible');
  }

  /**
   * Negative: clicking Next on Step 1 without picking a brand must not
   * advance the wizard. Checks the "Model*" *label* directly rather than
   * via `getFieldInputByLabel('Model*').should('not.exist')` — that helper
   * chains `.parent().find('input')` onto `cy.contains('label', ...)`, and
   * when the label genuinely isn't in the DOM (the correct outcome here),
   * `cy.contains()` itself fails with "expected to find content" before the
   * chain ever reaches the trailing `.should('not.exist')`, which only
   * suppresses a not-found failure on the command it's directly attached
   * to. Confirmed live: this was throwing that exact error even though the
   * wizard was correctly staying on Step 1.
   */
  attemptNextWithoutBrand() {
    this.clickNext();
    cy.contains('label', 'Model*', { log: false }).should('not.exist');
    this.getFieldInputByLabel('Brands*').should('be.visible');
  }

  /**
   * Edge: the site enforces a minimum of 2 uploaded images — uploading only
   * one and clicking Next must show the real validation message and keep
   * the wizard on Step 3 (confirmed live: "Please upload atleast 2 images
   * for your listing").
   */
  attemptNextWithOnlyOnePhoto() {
    cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-truck-1.png', { force: true });
    cy.get('img[src^="blob:"]', { log: false }).should('have.length.at.least', 1);
    this.clickNext();
    cy.contains('Please upload atleast 2 images for your listing', { log: false }).should('be.visible');
    // See attemptNextWithoutBrand() above for why this checks the label
    // directly instead of going through getFieldInputByLabel().
    cy.contains('label', 'Full Name*', { log: false }).should('not.exist');
  }

  /** Runs the entire wizard end to end, stopping at the OTP gate. */
  fillEntireWizardUpToOtp(overrides = {}) {
    this.fillStep1Brand();
    this.fillStep2TruckDetails();
    this.fillStep3Photos();
    this.fillStep4ContactInfo(overrides);
    this.verifyOtpVerificationRequested();
  }
}

module.exports = SellUsedTrucks;
