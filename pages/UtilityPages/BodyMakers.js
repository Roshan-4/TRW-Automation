const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { exactText } = require('../../helpers/leadFormFiller');
const { randomNumberGenerator } = require('../../helpers/randomNumberGenerator');

/**
 * Body Makers (/en/body-makers).
 *
 * Live-audited: no page-level lead-form CTA — every "Talk To Dealer" button
 * is a per-dealer card CTA (12 on the page), each opening a bespoke modal
 * (title = the dealer's name) that is a genuine variant of the shared
 * CheckOffersLead component: same Name/Mobile/City fields and selectors
 * (`input#name[name="name"]`, `input#phone[name="phone"]`, the city
 * placeholder text), PLUS two extra required dropdowns (Brand, Model) not
 * present anywhere else in this project, and a "Talk To Dealer" submit
 * instead of "Check Offers". Confirmed live validation copy: "Please enter
 * your name", "Please enter mobile no.", "Please select your location",
 * "Please select a brand", "Please select a model" — the first three match
 * the standard CheckOffersForm copy exactly.
 *
 * Same non-portal per-card modal structure as Offers/Tyres (see
 * pages/UtilityPages/TabbedModelOffers.js and Tyres.js) — an unscoped
 * ancestor walk resolves to a container spanning every dealer card's own
 * CTA, so every lookup here is scoped via the modal's own `max-w-[...]`
 * wrapper class rather than reusing the generic LeadFormFiller.
 *
 * This is a real production lead (no sandbox) — the submitted name is
 * `testqa`, matching this repo's convention for all lead forms.
 */
class BodyMakers {
  static get pageUrl() {
    return '/en/body-makers';
  }

  static get pageLabel() {
    return 'Body Makers';
  }

  static get supportedLanguages() {
    return ['en'];
  }

  constructor(lang = 'en') {
    this.lang = lang;
    this.ctaLabel = 'Talk To Dealer';
    this.submitText = 'Talk To Dealer';
    const copy = truckInIndiaData.CheckOffersForm[lang] || truckInIndiaData.CheckOffersForm.en;
    this.cityPlaceholder = copy.cityPlaceholder;
    this.validation = {
      ...copy.validation,
      brandRequired: 'Please select a brand',
      modelRequired: 'Please select a model',
    };
  }

  get pageLabel() {
    return BodyMakers.pageLabel;
  }

  navigate() {
    cy.visit(BodyMakers.pageUrl, { timeout: 90000 });
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

  getModalRoot() {
    return cy.get('input#name[name="name"]').closest('[class*="max-w-"]');
  }

  getNameInput() {
    return cy.get('input#name[name="name"]');
  }

  getMobileInput() {
    return cy.get('input#phone[name="phone"]');
  }

  getCityInput() {
    return cy.get(`input[placeholder="${this.cityPlaceholder}"]`);
  }

  getBrandSelect() {
    return this.getModalRoot().find('select').eq(0);
  }

  getModelSelect() {
    return this.getModalRoot().find('select').eq(1);
  }

  getSubmitButton() {
    return this.getModalRoot().contains('button', exactText(this.submitText));
  }

  fillFields({ name, mobile, city, brand, model, selectCity = true } = {}) {
    if (name !== undefined) {
      this.getNameInput().should('be.visible').clear({ force: true });
      if (name !== '') {
        this.getNameInput().type(String(name), { force: true });
      }
    }
    if (mobile !== undefined) {
      this.getMobileInput().should('be.visible').clear({ force: true });
      if (mobile !== '') {
        this.getMobileInput().type(String(mobile), { force: true });
      }
    }
    if (city !== undefined) {
      this.getCityInput().should('be.visible').clear({ force: true });
      if (city !== '') {
        this.getCityInput().type(city, { force: true });
        if (selectCity) {
          cy.contains('ul li', new RegExp(city, 'i')).should('be.visible').click({ force: true });
        }
      }
    }
    if (brand !== undefined) {
      this.getBrandSelect().select(brand, { force: true });
    }
    if (model === 'auto') {
      // The Model dropdown only populates real options after a brand is
      // selected (confirmed live: it starts as just the "Select Model"
      // placeholder) — wait for that, then pick whichever option is first.
      this.getModelSelect()
        .find('option')
        .should('have.length.greaterThan', 1)
        .then(($opts) => {
          this.getModelSelect().select($opts.eq(1).val(), { force: true });
        });
    } else if (model !== undefined) {
      this.getModelSelect().select(model, { force: true });
    }
  }

  submit() {
    this.getSubmitButton().should('be.visible').then(($btn) => {
      $btn[0].click();
    });
  }

  verifyValidationMessages(messages) {
    messages.forEach((message) => {
      cy.contains('span', exactText(message)).should('be.visible');
    });
  }

  /**
   * Unlike every other lead form in this project, a successful submission
   * here closes the modal entirely and shows a top-right toast ("Success" /
   * "Your request has been submitted successfully") instead of an in-modal
   * "Thank You!!!" heading — confirmed live.
   */
  verifyLeadSubmitted() {
    cy.contains('Your request has been submitted successfully').should('be.visible');
  }

  submitLead(overrides = {}) {
    this.openLeadFormViaCta();
    this.fillFields({
      name: 'testqa',
      mobile: randomNumberGenerator(),
      city: 'noida',
      brand: 'Tata',
      model: 'auto',
      ...overrides,
    });
    this.submit();
    this.verifyLeadSubmitted();
  }
}

module.exports = BodyMakers;
