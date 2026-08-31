const LoginRegister = require('../../../../pages/Login/LoginRegister');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');
const { randomNumberGenerator } = require('../../../../helpers/randomNumberGenerator');

const LANGUAGES = LoginRegister.supportedLanguages;

/**
 * Login / Register on staging (CYPRESS_STAGING_URL).
 *
 * Flow: open staging homepage → Sign In → LOGIN form, or switch to REGISTER.
 * Login with a 10-digit mobile is OTP-gated; tests do not complete OTP
 * (TJ_USER_OTP is unused / empty). Do not click GET OTP more than a test needs.
 *
 * Run:
 * - npm run test:login
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.LOGIN,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

LANGUAGES.forEach((lang) => {
  const page = new LoginRegister(lang);

  describe(`Login - LoginRegister [${lang}]`, { tags: langTags(lang) }, () => {
    beforeEach(() => {
      page.visitLogin();
    });

    registerRedirectionCheck({
      prefix: 'LR',
      lang,
      tags: langTags(lang, TEST_TAGS.REDIRECTION),
      label: 'Login - Login / Register',
    });

    it(
      'TC-LR-01: Sign In from the homepage opens the login form',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-LR-01',
          title: 'Sign In from the homepage opens the login form',
          language: lang,
          description:
            'Open the staging homepage, click Sign In, and confirm the Login / Register page shows the LOGIN form.',
          expectedResult:
            'The user lands on /login and sees “Login / Register to Truck Junction” with Email / Mobile no and Login.',
          steps: [
            'Open the staging homepage',
            'Click Sign In',
            'Verify the login heading, LOGIN tab, email/mobile field and Login button',
          ],
        });

        allureStep('Open homepage and click Sign In', () => {
          page.visitHome();
          page.clickSignIn();
        });
        allureStep('Verify the LOGIN form is shown', () => {
          page.verifyLoginFormVisible();
        });
      }
    );

    it(
      'TC-LR-02: REGISTER tab shows the register form',
      { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-LR-02',
          title: 'REGISTER tab shows the register form',
          language: lang,
          description:
            'On the login page, click REGISTER and confirm Full Name, Occupation, Application for CV, Mobile No. and Continue are shown.',
          expectedResult:
            'The REGISTER tab is active and the register fields plus Continue are visible.',
          steps: ['Open /login', 'Click REGISTER', 'Verify register fields and Continue'],
        });

        allureStep('Open REGISTER and verify the form', () => {
          page.openRegisterTab();
          page.verifyRegisterFormVisible();
        });
      }
    );

    it(
      'TC-LR-03: Login shows required validation when submitted empty',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE) },
      () => {
        documentTestCase({
          id: 'TC-LR-03',
          title: 'Login shows required validation when submitted empty',
          language: lang,
          description:
            'On the LOGIN form, click Login with Email / Mobile no left empty.',
          expectedResult: '“Please enter email/mobile no.” is shown and the user stays on login.',
          steps: ['Open /login', 'Leave Email / Mobile no empty', 'Click Login', 'Verify the validation message'],
        });

        allureStep('Submit login empty and verify validation', () => {
          page.verifyLoginFormVisible();
          page.submitLoginEmpty();
          page.verifyLoginEmptyValidation();
          cy.location('pathname').should('eq', '/login');
        });
      }
    );

    it(
      'TC-LR-04: Email / Mobile no accepts a 10-digit mobile',
      { tags: langTags(lang, TEST_TAGS.POSITIVE) },
      () => {
        documentTestCase({
          id: 'TC-LR-04',
          title: 'Email / Mobile no accepts a 10-digit mobile',
          language: lang,
          description:
            'On LOGIN, type a 10-digit mobile into Email / Mobile no. Completing login is OTP-gated and is not driven here (no test OTP is configured; a live Login click with an unregistered mobile did not show GET OTP or fire a login API).',
          expectedResult: 'The field keeps the 10-digit mobile the user typed.',
          steps: [
            'Open /login',
            'Enter a 10-digit mobile number',
            'Verify Email / Mobile no still shows that number',
          ],
        });

        allureStep('Type a 10-digit mobile and verify the field keeps it', () => {
          page.verifyLoginFormVisible();
          const mobile = randomNumberGenerator();
          page.fillLoginUserId(mobile);
          page.verifyLoginUserIdValue(mobile);
        });
      }
    );

    it(
      'TC-LR-05: Continue stays disabled on an empty register form',
      { tags: langTags(lang, TEST_TAGS.NEGATIVE) },
      () => {
        documentTestCase({
          id: 'TC-LR-05',
          title: 'Continue stays disabled on an empty register form',
          language: lang,
          description:
            'Open REGISTER with all fields empty and confirm Continue is not available to submit.',
          expectedResult: 'Continue is disabled (or visually disabled) while the form is empty.',
          steps: ['Open /login', 'Click REGISTER', 'Verify Continue is disabled'],
        });

        allureStep('Open REGISTER empty and verify Continue is disabled', () => {
          page.openRegisterTab();
          page.verifyContinueDisabledWhenEmpty();
        });
      }
    );

    it(
      'TC-LR-06: LOGIN tab returns to the email/mobile field',
      { tags: langTags(lang, TEST_TAGS.EDGE) },
      () => {
        documentTestCase({
          id: 'TC-LR-06',
          title: 'LOGIN tab returns to the email/mobile field',
          language: lang,
          description:
            'Switch to REGISTER, then back to LOGIN, and confirm the email/mobile login field is shown again.',
          expectedResult: 'After LOGIN is selected, Email / Mobile no and Login are visible again.',
          steps: ['Open /login', 'Click REGISTER', 'Click LOGIN', 'Verify the login field is shown'],
        });

        allureStep('Switch REGISTER then LOGIN and verify the login field', () => {
          page.openRegisterTab();
          page.verifyRegisterFormVisible();
          page.openLoginTab();
          page.verifyLoginFormVisible();
        });
      }
    );
  });
});
