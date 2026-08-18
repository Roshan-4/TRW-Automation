const { randomNumberGenerator } = require('./randomNumberGenerator');

const exactText = (text) =>
  new RegExp(`^\\s*${String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);

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
    submitText = 'Check Offers',
    formRootFinder = null,
  } = {}) {
    this.nameSelector = nameSelector;
    this.mobileSelector = mobileSelector;
    this.cityPlaceholder = cityPlaceholder;
    this.submitText = submitText;
    this.formRootFinder = formRootFinder;
  }

  getNameInput() {
    return cy.get(this.nameSelector);
  }

  getMobileInput() {
    return cy.get(this.mobileSelector);
  }

  getCityInput() {
    return cy.get(`input[placeholder="${this.cityPlaceholder}"]`);
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
      this.getNameInput().type(String(name), { force: true });
      this.getNameInput().should('have.value', String(name));
    } else {
      this.getNameInput().should('have.value', '');
    }
  }

  clearAndTypeMobile(mobile) {
    this.getMobileInput().should('be.visible').clear({ force: true });
    if (mobile !== undefined && mobile !== '') {
      this.getMobileInput().type(String(mobile), { force: true });
      this.getMobileInput().should('have.value', String(mobile));
    } else {
      this.getMobileInput().should('have.value', '');
    }
  }

  clearCity() {
    this.getCityInput().should('be.visible').clear({ force: true });
    this.getCityInput().should('have.value', '');
  }

  typeCityAndPickSuggestion(city) {
    this.getCityInput().should('be.visible').clear({ force: true }).type(city, { force: true });
    cy.contains('ul li', new RegExp(city, 'i')).should('be.visible').click({ force: true });
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
    this.getFormRoot().then(($root) => {
      const $inputs = $root.find('input').filter((_, el) => {
        const hay = `${el.placeholder || ''} ${el.name || ''} ${el.id || ''} ${el.getAttribute('aria-label') || ''}`.toLowerCase();
        return /price|budget|amount/.test(hay);
      });
      if ($inputs.length) {
        cy.wrap($inputs.first(), { log: false })
          .clear({ force: true })
          .type(String(amount), { force: true });
      }
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
};
