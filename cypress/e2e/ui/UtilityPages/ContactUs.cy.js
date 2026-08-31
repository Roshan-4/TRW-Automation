const ContactUs = require('../../../../pages/UtilityPages/ContactUs');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = ContactUs.supportedLanguages;

/**
 * Contact Us enquiry form — see pages/UtilityPages/ContactUs.js.
 *
 * Run:
 * - npm run test:contactUs
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.UTILITY_PAGES,
  TEST_TAGS.CONTACT_US,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

LANGUAGES.forEach((lang) => {
  const page = new ContactUs(lang);
  const pageLabel = page.pageLabel;

  describe(
    `UtilityPages - ContactUs [${lang}] — ${pageLabel}`,
    { tags: langTags(lang) },
    () => {
      beforeEach(() => {
        page.navigate();
      });

      registerRedirectionCheck({
        prefix: 'CUS',
        lang,
        tags: langTags(lang, TEST_TAGS.REDIRECTION),
        label: `UtilityPages - ${pageLabel}`,
      });

      it(
        `TC-CUS-01: Submit Request enquiry submits successfully on ${pageLabel}`,
        { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE) },
        () => {
          documentTestCase({
            id: 'TC-CUS-01',
            title: `Submit Request enquiry submits successfully on ${pageLabel}`,
            language: lang,
            description: `Open the ${pageLabel} page, fill name, mobile, email and message, and click Submit Request.`,
            expectedResult: `The user sees the thank-you message: "${page.copy.thankYouText}".`,
            steps: [
              `Open the ${pageLabel} page`,
              'Fill name, mobile, email and message',
              'Click Submit Request',
              'Verify the thank-you confirmation message is shown',
            ],
          });

          allureStep(`Submit Contact Us enquiry on ${pageLabel}`, () => {
            cy.randomNumberGenerator().then((mobile) => {
              page.submitContactUsLead(mobile);
            });
          });
        }
      );

      it(
        `TC-CUS-02: Submit Request form shows required validation when submitted empty on ${pageLabel}`,
        { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE) },
        () => {
          documentTestCase({
            id: 'TC-CUS-02',
            title: `Submit Request form shows required validation when submitted empty on ${pageLabel}`,
            language: lang,
            description: `Open the ${pageLabel} page and click Submit Request with all fields left empty.`,
            expectedResult:
              'The real validation messages for name, mobile, email and message are displayed, and no enquiry is submitted.',
            steps: [
              `Open the ${pageLabel} page`,
              'Leave all form fields empty',
              'Click Submit Request',
              'Verify all required-field validation messages are shown',
            ],
          });

          allureStep(`Submit Contact Us empty on ${pageLabel} and verify validation`, () => {
            const validation = page.copy.validation;
            page.ensureContactFormVisible();
            page.submitContactForm();
            page.verifyValidationMessages([
              validation.nameRequired,
              validation.mobileRequired,
              validation.emailRequired,
              validation.messageRequired,
            ]);
          });
        }
      );

      it(
        `TC-CUS-03: Submit Request form rejects mobile that is not 10 digits on ${pageLabel}`,
        { tags: langTags(lang, TEST_TAGS.EDGE) },
        () => {
          documentTestCase({
            id: 'TC-CUS-03',
            title: `Submit Request form rejects mobile that is not 10 digits on ${pageLabel}`,
            language: lang,
            description: `Open the ${pageLabel} page, fill a valid name and an invalid (5-digit) mobile number, leave email and message empty, then submit.`,
            expectedResult:
              'The real mobile-format, email-required and message-required validation messages are displayed, and no enquiry is submitted.',
            steps: [
              `Open the ${pageLabel} page`,
              'Fill a valid name and an invalid mobile number',
              'Leave email and message empty',
              'Click Submit Request',
              'Verify the mobile-format and other validation messages are shown',
            ],
          });

          allureStep(`Submit Contact Us with invalid mobile on ${pageLabel} and verify validation`, () => {
            const form = page.copy.form;
            const validation = page.copy.validation;
            page.fillContactForm({
              name: form.name,
              mobile: form.invalidMobile,
              email: '',
              message: '',
            });
            page.submitContactForm();
            page.verifyValidationMessages([
              validation.mobileInvalid,
              validation.emailRequired,
              validation.messageRequired,
            ]);
          });
        }
      );
    }
  );
});
