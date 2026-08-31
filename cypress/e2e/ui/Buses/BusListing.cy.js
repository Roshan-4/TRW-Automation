const BusListing = require('../../../../pages/Buses/BusListing');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');
const { registerListingChromeTests } = require('../../../support/listingChromeTests');

const LANGUAGES = BusListing.supportedLanguages;
const PAGE_KEYS = BusListing.pageKeys;

/**
 * Bus pages — New/Popular/Upcoming/Latest Buses plus the individual bus
 * brand pages (see pages/Buses/BusListing.js for the full live-audited CTA
 * findings). Scope for now: only the lead form on each page.
 *
 * Run:
 * - npm run test:busListing
 * - grepTags=@en+@buses
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.BUSES,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

const pageTags = (pageKey) => [`@${pageKey}`];

LANGUAGES.forEach((lang) => {
  PAGE_KEYS.forEach((pageKey) => {
    const page = new BusListing(lang, pageKey);
    const pageLabel = page.pageLabel;

    describe(
      `Buses - BusListing [${pageKey}] [${lang}] — ${pageLabel}`,
      { tags: [...langTags(lang), ...pageTags(pageKey)] },
      () => {
        beforeEach(() => {
          page.navigate();
        });

        registerRedirectionCheck({
          prefix: 'BUS',
          lang,
          tags: langTags(lang, TEST_TAGS.REDIRECTION, ...pageTags(pageKey)),
          label: `Buses - ${pageLabel}`,
        });

        it(
          `TC-BUS-01: lead submits successfully on ${pageLabel}`,
          { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-BUS-01',
              title: `Lead submits successfully on ${pageLabel}`,
              language: lang,
              description: `Open the ${pageLabel} page, click "${page.page.leadTriggerCta}" to open its lead form, fill name, mobile and city, and submit.`,
              expectedResult: 'A Thank You confirmation is shown after a successful lead submission.',
              steps: [
                `Open the ${pageLabel} page`,
                `Click "${page.page.leadTriggerCta}" to open its lead form`,
                'Fill name, mobile and city',
                'Submit and verify Thank You confirmation',
              ],
            });

            allureStep(`Submit lead on ${pageLabel}`, () => {
              page.submitLead();
            });
          }
        );

        it(
          `TC-BUS-02: lead form shows required validation when submitted empty on ${pageLabel}`,
          { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-BUS-02',
              title: `Lead form shows required validation when submitted empty on ${pageLabel}`,
              language: lang,
              description: `Open the ${pageLabel} page, open the lead form via "${page.page.leadTriggerCta}", and submit with name, mobile and city all left empty.`,
              expectedResult:
                'The real, page-shown validation messages for name, mobile and location are displayed, and no lead is submitted.',
              steps: [
                `Open the ${pageLabel} page`,
                `Click "${page.page.leadTriggerCta}" to open its lead form`,
                'Leave name, mobile and city empty and submit',
                'Verify all three required-field validation messages are shown',
              ],
            });

            allureStep(`Submit lead empty on ${pageLabel} and verify validation`, () => {
              const validation = page.checkOffersLeadCopy.validation;
              page.openLeadForm();
              page.checkOffersLead.fillFields({ name: '', mobile: '', city: '', selectCity: false });
              page.checkOffersLead.submit();
              page.checkOffersLead.verifyValidationMessages([
                validation.nameRequired,
                validation.mobileRequired,
                validation.locationRequired,
              ]);
            });
          }
        );

        it(
          `TC-BUS-03: lead form rejects mobile that is not 10 digits on ${pageLabel}`,
          { tags: langTags(lang, TEST_TAGS.EDGE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-BUS-03',
              title: `Lead form rejects mobile that is not 10 digits on ${pageLabel}`,
              language: lang,
              description: `Open the ${pageLabel} page, open the lead form via "${page.page.leadTriggerCta}", fill a valid name, an invalid (5-digit) mobile number, and leave city empty, then submit.`,
              expectedResult:
                'The bus enquiry popup rejects the invalid mobile number in real time (the field reverts to empty), and submitting shows the mobile-required and location-required validation messages, with no lead submitted.',
              steps: [
                `Open the ${pageLabel} page`,
                `Click "${page.page.leadTriggerCta}" to open its lead form`,
                'Fill a valid name and an invalid mobile number',
                'Submit with city left empty',
                'Verify the mobile-required and location validation messages are shown',
              ],
            });

            allureStep(`Submit lead with invalid mobile on ${pageLabel} and verify validation`, () => {
              const lead = page.checkOffersLeadCopy;
              const validation = lead.validation;
              page.openLeadForm();
              page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
              page.checkOffersLead.submit();
              page.checkOffersLead.verifyValidationMessages([validation.mobileRequired, validation.locationRequired]);
            });
          }
        );

        registerListingChromeTests({
          page,
          pageLabel,
          id: 'TC-BUS-04',
          langTags: langTags(lang, TEST_TAGS.POSITIVE, ...pageTags(pageKey)),
        });
      }
    );
  });
});
