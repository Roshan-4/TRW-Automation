const NewTruckInternalPages = require('../../pages/PDP/NewTruckInternalPages');
const { TEST_TAGS } = require('../../constants/constants');
const { documentTestCase, allureStep } = require('../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../helpers/deviceTags');

const LANGUAGES = NewTruckInternalPages.supportedLanguages;

const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.PDP,
  TEST_TAGS.NEW_TRUCK_INTERNAL,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

const pageTags = (pageKey) => [`@${pageKey}`];

function runNewTruckInternalPagesSuite(pageKeys) {
  LANGUAGES.forEach((lang) => {
    pageKeys.forEach((pageKey) => {
      const page = new NewTruckInternalPages(lang, pageKey);
      const pageLabel = page.pageLabel;
      const cta = page.page.leadTriggerCta;

      describe(
        `PDP - NewTruckInternalPages [${pageKey}] [${lang}] — ${pageLabel}`,
        { tags: [...langTags(lang), ...pageTags(pageKey)] },
        () => {
          beforeEach(() => {
            page.navigate();
          });

          registerRedirectionCheck({
            prefix: 'PDPI',
            lang,
            tags: langTags(lang, TEST_TAGS.REDIRECTION, ...pageTags(pageKey)),
            label: `PDP - ${pageLabel}`,
          });

          it(
            `TC-PDPI-01: ${cta} lead submits successfully on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
            () => {
              documentTestCase({
                id: 'TC-PDPI-01',
                title: `${cta} lead submits successfully on ${pageLabel}`,
                language: lang,
                description: `Open ${pageLabel}, click “${cta}”, fill name, mobile and city, and submit.`,
                expectedResult:
                  'A Thank You confirmation is shown after a successful lead submission. The submitted name is testqa.',
                steps: [
                  `Open ${pageLabel}`,
                  `Click ${cta}`,
                  'Fill name, mobile and city',
                  'Submit and verify Thank You',
                ],
              });

              allureStep(`Submit ${cta} lead on ${pageLabel}`, () => {
                page.submitPrimaryLead();
              });
            }
          );

          // CheckOffersForm validation copy is confirmed for English only.
          if (lang === 'en') {
          it(
            `TC-PDPI-02: ${cta} lead form shows required validation when submitted empty on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.NEGATIVE, ...pageTags(pageKey)) },
            () => {
              documentTestCase({
                id: 'TC-PDPI-02',
                title: `${cta} lead form shows required validation when submitted empty on ${pageLabel}`,
                language: lang,
                description: `Open ${pageLabel}, click “${cta}”, and submit with name, mobile and city all left empty.`,
                expectedResult:
                  'The real required-field validation messages for name, mobile and location are shown, and no lead is submitted.',
                steps: [
                  `Open ${pageLabel}`,
                  `Click ${cta}`,
                  'Leave name, mobile and city empty and submit',
                  'Verify the three required-field messages',
                ],
              });

              allureStep(`Submit ${cta} empty on ${pageLabel}`, () => {
                const validation = page.checkOffersLeadCopy.validation;
                page.openPrimaryLead();
                page.leadForm.fillFields({ name: '', mobile: '', city: '', selectCity: false });
                page.leadForm.submit();
                page.leadForm.verifyValidationMessages([
                  validation.nameRequired,
                  validation.mobileRequired,
                  validation.locationRequired,
                ]);
              });
            }
          );

          it(
            `TC-PDPI-03: ${cta} lead form rejects mobile that is not 10 digits on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.EDGE, ...pageTags(pageKey)) },
            () => {
              documentTestCase({
                id: 'TC-PDPI-03',
                title: `${cta} lead form rejects mobile that is not 10 digits on ${pageLabel}`,
                language: lang,
                description: `Open ${pageLabel}, click “${cta}”, fill a valid name, an invalid 5-digit mobile number, leave city empty, then submit.`,
                expectedResult:
                  'The mobile-format and location-required validation messages are shown, and no lead is submitted.',
                steps: [
                  `Open ${pageLabel}`,
                  `Click ${cta}`,
                  'Fill a valid name and an invalid mobile number',
                  'Submit with city empty',
                  'Verify mobile-format and location messages',
                ],
              });

              allureStep(`Submit ${cta} with invalid mobile on ${pageLabel}`, () => {
                const lead = page.checkOffersLeadCopy;
                const validation = lead.validation;
                page.openPrimaryLead();
                page.leadForm.fillFields({
                  name: lead.name,
                  mobile: lead.invalidMobile,
                  city: '',
                  selectCity: false,
                });
                page.leadForm.submit();
                page.leadForm.verifyValidationMessages([
                  validation.mobileInvalid,
                  validation.locationRequired,
                ]);
              });
            }
          );
          }

          it(
            `TC-PDPI-04: heading is visible on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
            () => {
              documentTestCase({
                id: 'TC-PDPI-04',
                title: `Heading is visible on ${pageLabel}`,
                language: lang,
                description: `Open ${pageLabel} and confirm the page heading.`,
                expectedResult: `The heading “${page.page.heading}” is visible.`,
                steps: [`Open ${pageLabel}`, 'Verify the heading'],
              });

              allureStep(`Verify heading on ${pageLabel}`, () => {
                page.verifyPageHeading();
              });
            }
          );

          if (page.hasSecondaryLead) {
            it(
              `TC-PDPI-05: ${page.page.secondaryLeadCta} lead submits successfully on ${pageLabel}`,
              { tags: langTags(lang, TEST_TAGS.POSITIVE, ...pageTags(pageKey)) },
              () => {
                documentTestCase({
                  id: 'TC-PDPI-05',
                  title: `${page.page.secondaryLeadCta} lead submits successfully on ${pageLabel}`,
                  language: lang,
                  description: `Open ${pageLabel}, click “${page.page.secondaryLeadCta}” (a second entry point), fill name, mobile and city, and submit.`,
                  expectedResult:
                    'A Thank You confirmation is shown after a successful lead submission from this second CTA.',
                  steps: [
                    `Open ${pageLabel}`,
                    `Click ${page.page.secondaryLeadCta}`,
                    'Fill name, mobile and city',
                    'Submit and verify Thank You',
                  ],
                });

                allureStep(`Submit ${page.page.secondaryLeadCta} lead on ${pageLabel}`, () => {
                  page.submitSecondaryLead();
                });
              }
            );
          }

          if (page.hasFaq) {
            it(
              `TC-PDPI-06: FAQ question expands on ${pageLabel}`,
              { tags: langTags(lang, TEST_TAGS.EDGE, ...pageTags(pageKey)) },
              () => {
                documentTestCase({
                  id: 'TC-PDPI-06',
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
        }
      );
    });
  });
}

module.exports = { runNewTruckInternalPagesSuite };
