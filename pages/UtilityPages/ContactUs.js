const contactUsData = require('../../testData/UtilityPages/ContactUsData.json');

const exactText = (text) => new RegExp(`^${String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

/**
 * Contact Us enquiry form — name, mobile, email and message with a
 * "Submit Request" button. Live-audited: distinct from CheckOffersLead;
 * success shows inline thank-you copy on the same page.
 */
class ContactUs {
  constructor(lang = 'en') {
    this.lang = lang;
    this.copy = contactUsData.ContactUs[lang];
    if (!this.copy) {
      throw new Error(`ContactUs data missing for lang=${lang}`);
    }
    this.pageUrl = this.copy.path;
  }

  static get supportedLanguages() {
    return Object.keys(contactUsData.ContactUs);
  }

  get pageLabel() {
    return this.copy.name;
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

  verifyPageHeadingVisible() {
    cy.contains('h1', this.copy.heading, { timeout: 20000 }).should('be.visible');
  }

  getNameInput() {
    return cy.get('input#name[name="name"]', { timeout: 20000 });
  }

  getMobileInput() {
    return cy.get('input#mobile[name="mobile"]', { timeout: 20000 });
  }

  getEmailInput() {
    return cy.get('input#email[name="email"]', { timeout: 20000 });
  }

  getMessageInput() {
    return cy.get('#message[name="message"]', { timeout: 20000 });
  }

  getSubmitRequestButton() {
    return cy.contains('button', exactText(this.copy.submitRequestCta), { timeout: 20000 });
  }

  ensureContactFormVisible() {
    cy.contains('h2', /fill out the simple form/i, { timeout: 20000 })
      .scrollIntoView({ offset: { top: -120, left: 0 } });
    this.getNameInput().should('be.visible');
  }

  fillContactForm({ name = '', mobile = '', email = '', message = '' } = {}) {
    this.ensureContactFormVisible();
    this.getNameInput().clear({ force: true });
    if (name) {
      this.getNameInput().type(name, { force: true });
    }
    this.getMobileInput().clear({ force: true });
    if (mobile !== '' && mobile !== null && mobile !== undefined) {
      this.getMobileInput().type(String(mobile), { force: true });
    }
    this.getEmailInput().clear({ force: true });
    if (email) {
      this.getEmailInput().type(email, { force: true });
    }
    this.getMessageInput().clear({ force: true });
    if (message) {
      this.getMessageInput().type(message, { force: true });
    }
  }

  submitContactForm() {
    this.ensureContactFormVisible();
    this.getSubmitRequestButton().click();
  }

  verifyThankYouMessage() {
    cy.contains(this.copy.thankYouText, { timeout: 20000 }).should('be.visible');
  }

  verifyValidationMessages(expectedMessages) {
    this.ensureContactFormVisible();
    expectedMessages.forEach((message) => {
      cy.get('form').contains(message, { timeout: 10000 }).should('be.visible');
    });
  }

  submitContactUsLead(mobile) {
    const form = this.copy.form;
    this.fillContactForm({
      name: form.name,
      mobile,
      email: form.email,
      message: form.message,
    });
    this.submitContactForm();
    this.verifyThankYouMessage();
  }
}

module.exports = ContactUs;
