const { randomNumberGenerator } = require('./randomNumberGenerator');

const exactText = (text) =>
  new RegExp(`^\\s*${String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);

/**
 * Returns a `clickCta()` closure that finds and raw-DOM-clicks the first
 * currently-visible button whose exact text is `ctaLabel`, for use inside a
 * `cy.get(...).should(...)` re-click-until-open retry loop.
 *
 * Throttled to at most one real click per `throttleMs` — calling this on
 * every `.should()` retry tick (which fires every few ms while waiting for
 * the modal to hydrate) was re-running the raw query *before* the first
 * click's React re-render had landed. On listing/card pages several
 * identical CTAs exist at once (one "Check Offers"/"Contact Seller" per
 * card); if the first click's modal hasn't mounted yet, the query still
 * matches a *different* card's identical, still-visible CTA and clicks that
 * one too. Since this modal isn't portal-isolated, that mounts a second,
 * independent modal instance on top of the first — confirmed live via a CI
 * failure screenshot showing an empty, freshly-opened second modal sitting
 * on top of the real (filled, submitted) one, so the screenshot never
 * showed the actual point of failure and downstream field-fill/suggestion
 * clicks landed on whichever instance a `:visible` query happened to
 * resolve to first.
 */
function makeThrottledCtaClicker(doc, ctaLabel, throttleMs = 800) {
  let lastClickAt = 0;
  return () => {
    const now = Date.now();
    if (now - lastClickAt < throttleMs) {
      return;
    }
    const button = [...doc.querySelectorAll('button')].find(
      (el) => el.textContent.trim() === ctaLabel && el.offsetParent !== null
    );
    if (button) {
      button.click();
      lastClickAt = now;
    }
  };
}

/**
 * Reusable filler for lead forms that share name / mobile / city fields.
 * Call sites pass selectors or placeholders when a page uses different markup.
 *
 * Example:
 *   const filler = new LeadFormFiller({
 *     cityPlaceholder: 'Enter your City or District or Pincode',
 *     submitText: 'Check Offers',
 *   });
 *   filler.fillAndSubmit({ name: 'testqa', city: 'noida' });
 */
class LeadFormFiller {
  constructor({
    nameSelector = 'input#name[name="name"]',
    mobileSelector = 'input#phone[name="phone"]',
    cityPlaceholder = 'Enter your City or District or Pincode',
    citySuggestionSelector = 'ul li',
    submitText = 'Check Offers',
    formRootFinder = null,
    // Some fields only register keystrokes after a genuine (non-forced)
    // click — e.g. the per-model bus enquiry popup's phone/name inputs
    // never receive typed text via `{ force: true }` alone. Off by default
    // since every other page's fields work fine with the forced clear/type.
    focusFieldsBeforeType = false,
    // The bus enquiry popup's phone field validates in real time and
    // silently reverts to empty whenever the typed value isn't a complete
    // 10-digit number — confirmed live: typing "12345" always ends up as
    // "" in the DOM, while a full 10-digit number sticks. Asserting the
    // literal typed value would therefore always fail there when a test
    // deliberately types an invalid short number. On by default since
    // every other page's phone field keeps whatever was typed verbatim.
    assertMobileValueAfterType = true,
  } = {}) {
    this.nameSelector = nameSelector;
    this.mobileSelector = mobileSelector;
    this.cityPlaceholder = cityPlaceholder;
    this.citySuggestionSelector = citySuggestionSelector;
    this.submitText = submitText;
    this.formRootFinder = formRootFinder;
    this.focusFieldsBeforeType = focusFieldsBeforeType;
    this.assertMobileValueAfterType = assertMobileValueAfterType;
  }

  // Some of this project's shared "click CTA, then click again if the modal
  // isn't visible yet" retry helpers (see the page objects under pages/)
  // can, on pages with several visually-identical CTAs, end up clicking a
  // second trigger before the first modal has hydrated — this component
  // isn't portal-isolated, so that mounts a second, independent modal
  // instance alongside the first. Confirmed live: this leaves two
  // `#name`/`#phone` elements in the DOM, which crashes `cy.type()`/
  // `cy.clear()` (they require a single-element subject). Scoping every
  // field getter to the first currently-visible match makes filling the
  // form resilient to that duplicate-mount race without masking a real
  // "field truly missing" failure — `.should('be.visible')` still fails
  // loudly when nothing visible matches at all.
  getNameInput() {
    return cy.get(this.nameSelector).filter(':visible').first();
  }

  getMobileInput() {
    return cy.get(this.mobileSelector).filter(':visible').first();
  }

  getCityInput() {
    return cy.get(`input[placeholder="${this.cityPlaceholder}"]`).filter(':visible').first();
  }

  getFormRoot() {
    if (typeof this.formRootFinder === 'function') {
      return this.formRootFinder(this);
    }

    return this.getNameInput()
      .parents()
      .filter((_, el) => {
        const hasPhone = Boolean(el.querySelector(this.mobileSelector));
        const hasSubmit = [...el.querySelectorAll('button')].some((button) =>
          exactText(this.submitText).test(button.textContent || '')
        );
        return hasPhone && hasSubmit;
      })
      .first();
  }

  getSubmitButton() {
    return this.getFormRoot().contains('button', exactText(this.submitText));
  }

  clearAndTypeName(name) {
    this.getNameInput().should('be.visible').clear({ force: true });
    if (name !== undefined && name !== '') {
      if (this.focusFieldsBeforeType) {
        this.getNameInput().click();
      }
      this.getNameInput().type(String(name), { force: true });
      this.getNameInput().should('have.value', String(name));
    } else {
      this.getNameInput().should('have.value', '');
    }
  }

  clearAndTypeMobile(mobile) {
    this.getMobileInput().should('be.visible').clear({ force: true });
    if (mobile !== undefined && mobile !== '') {
      if (this.focusFieldsBeforeType) {
        this.getMobileInput().click();
      }
      this.getMobileInput().type(String(mobile), { force: true });
      if (this.assertMobileValueAfterType) {
        this.getMobileInput().should('have.value', String(mobile));
      }
    } else {
      this.getMobileInput().should('have.value', '');
    }
  }

  clearCity() {
    this.getCityInput().should('be.visible').clear({ force: true });
    this.getCityInput().should('have.value', '');
  }

  typeCityAndPickSuggestion(city) {
    this.getCityInput().should('be.visible').clear({ force: true });
    if (this.focusFieldsBeforeType) {
      this.getCityInput().click();
    }
    this.getCityInput().type(city, { force: true });
    // Real (non-forced) click on purpose: a forced click fires at whatever
    // coordinates the suggestion had when Cypress last resolved it, with no
    // check that the row is still there — if the autocomplete re-renders
    // (debounced fetch swapping in a fresh result set) between resolving
    // this query and the click executing, a forced click still "succeeds"
    // while silently missing, leaving the dropdown open over the submit
    // button and the city never actually selected. Confirmed live via a CI
    // screenshot showing exactly that: the suggestion still open, covering
    // the form's submit button, several seconds after this line ran. A real
    // click gets Cypress's own actionability + re-query-on-detach retry
    // instead, so a mis-click now fails fast, right here, with an accurate
    // screenshot, instead of only surfacing as an unrelated-looking submit
    // timeout much later. The city input's own value is the success check —
    // no separate "dropdown has closed" `.should('not.exist')` afterward:
    // that's a second, broader DOM-wide text search on top of the click's
    // own retry, and live runs showed it collide with this ad-heavy page's
    // own script activity (`Cannot set property message of [object
    // DOMException]`, Cypress's retry() crashing on a native exception
    // thrown mid-check) — a real value match already proves the pick
    // landed without that extra exposure.
    cy.contains(this.citySuggestionSelector, new RegExp(city, 'i')).should('be.visible').click();
    this.getCityInput().invoke('val').should('match', new RegExp(city, 'i'));
  }

  /**
   * Fill any combination of fields. Omit a key to leave that field untouched.
   * Pass empty string to clear. Pass selectCity:false to type city without picking.
   */
  fillFields({ name, mobile, city, selectCity = true } = {}) {
    if (name !== undefined) {
      this.clearAndTypeName(name);
    }
    if (mobile !== undefined) {
      this.clearAndTypeMobile(mobile);
    }
    if (city !== undefined) {
      if (city === '') {
        this.clearCity();
      } else if (selectCity) {
        this.typeCityAndPickSuggestion(city);
      } else {
        this.getCityInput().should('be.visible').clear({ force: true }).type(city, { force: true });
      }
    }
  }

  submit() {
    this.getSubmitButton().should('be.visible').then(($btn) => {
      $btn[0].click();
    });
  }

  /**
   * If the open lead form asks for price / budget / amount, enter a 5-digit value.
   * No-op when those fields are absent.
   */
  fillPriceOrBudgetIfPresent(amount = '50000') {
    const isPriceOrBudget = (el) => {
      const hay = `${el.placeholder || ''} ${el.name || ''} ${el.id || ''} ${el.getAttribute('aria-label') || ''}`.toLowerCase();
      return /price|budget|amount/.test(hay);
    };

    this.getFormRoot().then(($root) => {
      const $inputs = $root.find('input').filter((_, el) => isPriceOrBudget(el));
      if (!$inputs.length) {
        return;
      }
      // `.should('be.visible')` here (not a raw jQuery grab) so a field that
      // renders a beat after this snapshot, or is mid-transition, gets a
      // real Cypress retry window instead of a one-shot force-type landing
      // on an element the app hasn't finished settling into place — which
      // this shared filler cannot tell apart from a genuinely-typed value
      // the app silently drops.
      cy.wrap($root, { log: false })
        .find('input')
        .filter((_, el) => isPriceOrBudget(el))
        .first()
        .should('be.visible')
        .clear({ force: true })
        .type(String(amount), { force: true })
        .should('have.value', String(amount));
    });
  }

  /**
   * Happy-path fill: name, generated mobile (unless provided), city from dropdown,
   * optional price/budget when shown, then submit.
   */
  fillAndSubmit({ name, mobile, city, priceBudget = '50000' } = {}) {
    const resolvedMobile = mobile === undefined ? randomNumberGenerator() : mobile;
    this.fillFields({ name, mobile: resolvedMobile, city, selectCity: true });
    this.fillPriceOrBudgetIfPresent(priceBudget);
    this.submit();
    return resolvedMobile;
  }

  verifyValidationMessage(message) {
    cy.contains('span', exactText(message)).should('be.visible');
  }

  verifyValidationMessages(messages) {
    messages.forEach((message) => this.verifyValidationMessage(message));
  }
}

module.exports = {
  LeadFormFiller,
  exactText,
  makeThrottledCtaClicker,
};
