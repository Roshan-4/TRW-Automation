const BusListing = require('../../../pages/Buses/BusListing');
const { TEST_TAGS } = require('../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../helpers/documentTestCase');
const { ALL_LEAD_LANG, suiteLangTags } = require('./shared');

const pageTags = (pageKey) => [`@${pageKey}`];

/** Bus listing lead forms only — no redirection or listing-chrome tests. */
function runBusListingLeadFormSuite(pageKeys = BusListing.pageKeys) {
  pageKeys.forEach((pageKey) => {
    const page = new BusListing(ALL_LEAD_LANG, pageKey);
    const pageLabel = page.pageLabel;

    describe(
      `AllLeadForm - BusListing [${pageKey}] [${ALL_LEAD_LANG}] — ${pageLabel}`,
      {
        tags: [
          ...suiteLangTags([TEST_TAGS.BUSES], TEST_TAGS.ALL_LEAD_FORM_CHUNK_BUS_LISTING),
          ...pageTags(pageKey),
        ],
      },
      () => {
        beforeEach(() => {
          page.navigate();
        });

        it(
          `TC-BUS-01: lead submits successfully on ${pageLabel}`,
          { tags: suiteLangTags([TEST_TAGS.BUSES], TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-BUS-01',
              title: `Lead submits successfully on ${pageLabel}`,
              language: ALL_LEAD_LANG,
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
          { tags: suiteLangTags([TEST_TAGS.BUSES], TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-BUS-02',
              title: `Lead form shows required validation when submitted empty on ${pageLabel}`,
              language: ALL_LEAD_LANG,
              description: `Open the ${pageLabel} page, open its lead form, and submit with name, mobile and city all left empty.`,
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
          { tags: suiteLangTags([TEST_TAGS.BUSES], TEST_TAGS.EDGE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-BUS-03',
              title: `Lead form rejects mobile that is not 10 digits on ${pageLabel}`,
              language: ALL_LEAD_LANG,
              description: `Open the ${pageLabel} page, open its lead form, fill a valid name, an invalid (5-digit) mobile number, and leave city empty, then submit.`,
              expectedResult:
                'The real, page-shown mobile-required and location-required validation messages are displayed, and no lead is submitted.',
              steps: [
                `Open the ${pageLabel} page`,
                `Click "${page.page.leadTriggerCta}" to open its lead form`,
                'Fill a valid name and an invalid mobile number',
                'Submit with city left empty',
                'Verify the mobile and location validation messages are shown',
              ],
            });

            allureStep(`Submit lead with invalid mobile on ${pageLabel} and verify validation`, () => {
              const lead = page.checkOffersLeadCopy;
              const validation = lead.validation;
              page.openLeadForm();
              page.checkOffersLead.fillFields({
                name: lead.name,
                mobile: lead.invalidMobile,
                city: '',
                selectCity: false,
              });
              page.checkOffersLead.submit();
              page.checkOffersLead.verifyValidationMessages([
                validation.mobileRequired,
                validation.locationRequired,
              ]);
            });
          }
        );
      }
    );
  });
}

module.exports = { runBusListingLeadFormSuite };
