const BusPdp = require('../../../../pages/Buses/BusPdp');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = BusPdp.supportedLanguages;
const PAGE_KEYS = BusPdp.pageKeys;

const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.BUSES,
  TEST_TAGS.BUS_PDP,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

const pageTags = (pageKey) => [`@${pageKey}`];

LANGUAGES.forEach((lang) => {
  PAGE_KEYS.forEach((pageKey) => {
    const page = new BusPdp(lang, pageKey);
    const pageLabel = page.pageLabel;

    describe(
      `Buses - BusPdp [${pageKey}] [${lang}] — ${pageLabel}`,
      { tags: [...langTags(lang), ...pageTags(pageKey)] },
      () => {
        beforeEach(() => {
          page.navigate();
        });

        registerRedirectionCheck({
          prefix: 'BUSPDP',
          lang,
          tags: langTags(lang, TEST_TAGS.REDIRECTION, ...pageTags(pageKey)),
          label: `Buses - ${pageLabel}`,
        });

        it(
          `TC-BUSPDP-01: Check Offers lead submits successfully on ${pageLabel}`,
          { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-BUSPDP-01',
              title: `Check Offers lead submits successfully on ${pageLabel}`,
              language: lang,
              description: `Open the ${pageLabel} bus detail page, click Check Offers, fill name, mobile and city, and submit.`,
              expectedResult:
                'A Thank You confirmation is shown after a successful lead submission. The submitted name is testqa.',
              steps: [
                `Open ${pageLabel}`,
                'Click Check Offers',
                'Fill name, mobile and city',
                'Submit and verify Thank You',
              ],
            });

            allureStep(`Submit Check Offers lead on ${pageLabel}`, () => {
              page.submitCheckOffersLead();
            });
          }
        );

        if (lang === 'en') {
        it(
          `TC-BUSPDP-02: Check Offers lead form shows required validation when submitted empty on ${pageLabel}`,
          { tags: langTags(lang, TEST_TAGS.NEGATIVE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-BUSPDP-02',
              title: `Check Offers lead form shows required validation when submitted empty on ${pageLabel}`,
              language: lang,
              description: `Open ${pageLabel}, click Check Offers, and submit with name, mobile and city all left empty.`,
              expectedResult:
                'The real required-field validation messages for name, mobile and location are shown, and no lead is submitted.',
              steps: [
                `Open ${pageLabel}`,
                'Click Check Offers',
                'Leave name, mobile and city empty and submit',
                'Verify the three required-field messages',
              ],
            });

            allureStep(`Submit Check Offers empty on ${pageLabel}`, () => {
              const validation = page.checkOffersLeadCopy.validation;
              page.openCheckOffersLead();
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
          `TC-BUSPDP-03: Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`,
          { tags: langTags(lang, TEST_TAGS.EDGE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-BUSPDP-03',
              title: `Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`,
              language: lang,
              description: `Open ${pageLabel}, click Check Offers, fill a valid name, an invalid 5-digit mobile number, leave city empty, then submit.`,
              expectedResult:
                'The bus enquiry popup rejects the invalid mobile number in real time (the field reverts to empty), and submitting shows the mobile-required and location-required validation messages, with no lead submitted.',
              steps: [
                `Open ${pageLabel}`,
                'Click Check Offers',
                'Fill a valid name and an invalid mobile number',
                'Submit with city empty',
                'Verify mobile-format and location messages',
              ],
            });

            allureStep(`Submit Check Offers with invalid mobile on ${pageLabel}`, () => {
              const lead = page.checkOffersLeadCopy;
              const validation = lead.validation;
              page.openCheckOffersLead();
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

        it(
          `TC-BUSPDP-04: heading is visible on ${pageLabel}`,
          { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-BUSPDP-04',
              title: `Heading is visible on ${pageLabel}`,
              language: lang,
              description: `Open ${pageLabel} and confirm the bus name heading.`,
              expectedResult: `The heading “${page.page.heading}” is visible.`,
              steps: [`Open ${pageLabel}`, 'Verify the heading'],
            });

            allureStep(`Verify heading on ${pageLabel}`, () => {
              page.verifyPageHeading();
            });
          }
        );

        it(
          `TC-BUSPDP-05: FAQ question expands on ${pageLabel}`,
          { tags: langTags(lang, TEST_TAGS.EDGE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-BUSPDP-05',
              title: `FAQ question expands on ${pageLabel}`,
              language: lang,
              description: `Open a Frequently Asked Question on ${pageLabel} and confirm it expands.`,
              expectedResult: 'An FAQ question is present and can be opened.',
              steps: [`Open ${pageLabel}`, 'Open an FAQ question'],
            });

            allureStep(`Expand an FAQ on ${pageLabel}`, () => {
              page.verifyFaqAndExpand();
            });
          }
        );
      }
    );
  });
});
