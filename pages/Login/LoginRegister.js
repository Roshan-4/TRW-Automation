const loginData = require('../../testData/Login/LoginRegisterData.json');
const { exactText } = require('../../helpers/leadFormFiller');

/**
 * Login / Register on staging (`CYPRESS_STAGING_URL`).
 *
 * Live-audited on https://qa-truck.tractorfirst.com:
 * homepage "Sign In" → `/login` → LOGIN tab (email/mobile) or REGISTER tab
 * (Full Name, Occupation, Application for CV, Mobile No.).
 *
 * Completing Login is OTP-gated on this site. A live click on Login with an
 * unregistered 10-digit mobile did not fire a login/OTP API and did not show
 * GET OTP, so tests do not complete login or invent OTP copy. There is no
 * configured test OTP (`TJ_USER_OTP` is unused / empty).
 *
 * Many controls have no `id` / `data-testid` (see the locator notes in the
 * spec). Prefer `name`, `title`, `placeholder`, `button.tab-btn`, and visible
 * label text. Do not use CSS-module hashes (`index-module__…`).
 */
class LoginRegister {
  constructor(lang = 'en') {
    this.lang = lang;
    this.copy = loginData.LoginRegister[lang] || loginData.LoginRegister.en;
  }

  static get supportedLanguages() {
    return Object.keys(loginData.LoginRegister);
  }

  static stagingOrigin() {
    const raw = Cypress.env('stagingUrl');
    if (!raw) {
      throw new Error(
        'CYPRESS_STAGING_URL is missing. Add it to cypress/.env (see cypress/.env.example).'
      );
    }
    return String(raw).replace(/\/$/, '');
  }

  get homeUrl() {
    return `${LoginRegister.stagingOrigin()}/`;
  }

  get loginUrl() {
    return `${LoginRegister.stagingOrigin()}/login`;
  }

  visitHome() {
    cy.visit(this.homeUrl, {
      timeout: 90000,
      retryOnStatusCodeFailure: true,
      retryOnNetworkFailure: true,
    });
    cy.document().its('readyState').should('eq', 'complete');
  }

  visitLogin() {
    cy.visit(this.loginUrl, {
      timeout: 90000,
      retryOnStatusCodeFailure: true,
      retryOnNetworkFailure: true,
    });
    cy.document().its('readyState').should('eq', 'complete');
  }

  getSignInLink() {
    // Homepage uses title="Sign In"; once on /login the header title is "signIn".
    return cy.get('a[title="Sign In"], a[title="signIn"]', { timeout: 20000 }).first();
  }

  clickSignIn() {
    this.getSignInLink().should('be.visible').click();
    cy.location('pathname', { timeout: 20000 }).should('eq', '/login');
  }

  getAuthPanel() {
    return cy
      .contains('h1', exactText(this.copy.heading), { timeout: 20000 })
      .parent();
  }

  verifyLoginFormVisible() {
    this.getAuthPanel().should('be.visible');
    cy.contains('h1', exactText(this.copy.heading)).should('be.visible');
    this.getAuthPanel()
      .contains('button.tab-btn', exactText(this.copy.loginTab))
      .should('be.visible');
    this.getUserIdInput().should('be.visible');
    this.getLoginSubmit().should('be.visible');
  }

  getUserIdInput() {
    return cy.get(`input[name="userId"][placeholder="${this.copy.loginEmailMobilePlaceholder}"]`, {
      timeout: 20000,
    });
  }

  getLoginSubmit() {
    return cy.get(`button[title="${this.copy.loginSubmit}"]`, { timeout: 20000 });
  }

  openRegisterTab() {
    this.getAuthPanel()
      .contains('button.tab-btn', exactText(this.copy.registerTab))
      .should('be.visible')
      .click();
    this.getFullNameInput().should('be.visible');
  }

  openLoginTab() {
    this.getAuthPanel()
      .contains('button.tab-btn', exactText(this.copy.loginTab))
      .should('be.visible')
      .click();
    this.getUserIdInput().should('be.visible');
  }

  getFullNameInput() {
    return cy.get('input[name="fullName"]', { timeout: 20000 });
  }

  getPhoneInput() {
    return cy.get('input[name="phone"]', { timeout: 20000 });
  }

  getContinueButton() {
    return cy.get(`button[title="${this.copy.continue}"]`, { timeout: 20000 });
  }

  verifyRegisterFormVisible() {
    this.getAuthPanel()
      .contains('button.tab-btn', exactText(this.copy.registerTab))
      .should('be.visible');
    this.getAuthPanel().contains('label', /Full Name/i).should('be.visible');
    this.getAuthPanel().contains('label', /Occupation/i).should('be.visible');
    this.getAuthPanel().contains('label', /Application for CV/i).should('be.visible');
    this.getAuthPanel().contains('label', /Mobile No/i).should('be.visible');
    this.getFullNameInput().should('exist');
    this.getPhoneInput().should('exist');
    this.getContinueButton().should('be.visible');
  }

  submitLoginEmpty() {
    this.getLoginSubmit().click();
  }

  verifyLoginEmptyValidation() {
    cy.contains(exactText(this.copy.loginEmptyValidation), { timeout: 10000 }).should('be.visible');
  }

  fillLoginUserId(value) {
    this.getUserIdInput().clear().type(value);
  }

  verifyLoginUserIdValue(value) {
    this.getUserIdInput().should(($input) => {
      expect(
        $input.val(),
        `Email / Mobile no should keep the number the user typed (${value})`
      ).to.eq(value);
    });
  }

  submitLogin() {
    this.getLoginSubmit().click();
  }

  verifyContinueDisabledWhenEmpty() {
    this.getContinueButton().should(($btn) => {
      const disabled = $btn.is(':disabled') || /disable/i.test($btn.attr('class') || '');
      expect(
        disabled,
        'Continue should stay disabled until the register form is filled'
      ).to.eq(true);
    });
  }
}

module.exports = LoginRegister;
