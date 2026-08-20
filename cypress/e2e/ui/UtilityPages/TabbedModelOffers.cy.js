const TabbedModelOffers = require('../../../../pages/UtilityPages/TabbedModelOffers');
const { TEST_TAGS } = require('../../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../../../helpers/deviceTags');

const LANGUAGES = TabbedModelOffers.supportedLanguages;
const PAGE_KEYS = TabbedModelOffers.pageKeys;

/**
 * Select Your Truck and Offers: both built around a "Popular Models by
 * <Application/Category>" tab strip — clicking a tab swaps the model cards
 * shown below it, each card's "Check Offers" opening the shared
 * CheckOffersLead modal (see pages/UtilityPages/TabbedModelOffers.js for
 * the full live-audited findings). Per request, TC-*-01 submits one real
 * lead per tab to prove every tab's CTA genuinely works, not just the
 * default one; TC-*-02/03 (validation-only, same modal regardless of which
 * tab opened it) run once against the default tab.
 *
 * Run:
 * - npm run test:tabbedModelOffers
 */
const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.UTILITY_PAGES,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

const pageTags = (pageKey) => [`@${pageKey}`];

LANGUAGES.forEach((lang) => {
  PAGE_KEYS.forEach((pageKey) => {
    const page = new TabbedModelOffers(lang, pageKey);
    const pageLabel = page.pageLabel;

    describe(
      `UtilityPages - TabbedModelOffers [${pageKey}] [${lang}] — ${pageLabel}`,
      { tags: [...langTags(lang), ...pageTags(pageKey)] },
      () => {
        beforeEach(() => {
          page.navigate();
        });

        registerRedirectionCheck({
          prefix: 'TMO',
          lang,
          tags: langTags(lang, TEST_TAGS.REDIRECTION, ...pageTags(pageKey)),
          label: `UtilityPages - ${pageLabel}`,
        });

        it(
          `TC-TMO-01: Check Offers lead submits successfully on every tab of ${pageLabel}`,
          { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-TMO-01',
              title: `Check Offers lead submits successfully on every tab of ${pageLabel}`,
              language: lang,
              description: `Open the ${pageLabel} page, and for each tab in "${page.page.sectionHeading}", click a model card's "Check Offers" button, fill name, mobile and city, and submit.`,
              expectedResult: 'A Thank You confirmation is shown after each tab\'s lead submission.',
              steps: [
                `Open the ${pageLabel} page`,
                `For each tab in "${page.page.sectionHeading}": select the tab, click a model card's "Check Offers" button`,
                'Fill name, mobile and city',
                'Submit and verify Thank You confirmation, then close and move to the next tab',
              ],
            });

            allureStep(`Submit Check Offers lead on every tab of ${pageLabel}`, () => {
              page.submitLeadForEveryTab();
            });
          }
        );

        it(
          `TC-TMO-02: Check Offers lead form shows required validation when submitted empty on ${pageLabel}`,
          { tags: langTags(lang, TEST_TAGS.NEGATIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-TMO-02',
              title: `Check Offers lead form shows required validation when submitted empty on ${pageLabel}`,
              language: lang,
              description: `Open the ${pageLabel} page, open Check Offers on the default tab, and submit with name, mobile and city all left empty.`,
              expectedResult:
                'The real, page-shown validation messages for name, mobile and location are displayed, and no lead is submitted.',
              steps: [
                `Open the ${pageLabel} page`,
                'Click a model card\'s "Check Offers" button',
                'Leave name, mobile and city empty and submit',
                'Verify all three required-field validation messages are shown',
              ],
            });

            allureStep(`Submit Check Offers empty on ${pageLabel} and verify validation`, () => {
              const validation = page.checkOffersLeadCopy.validation;
              page.openLeadFormViaCta();
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
          `TC-TMO-03: Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`,
          { tags: langTags(lang, TEST_TAGS.EDGE, ...pageTags(pageKey)) },
          () => {
            documentTestCase({
              id: 'TC-TMO-03',
              title: `Check Offers lead form rejects mobile that is not 10 digits on ${pageLabel}`,
              language: lang,
              description: `Open the ${pageLabel} page, open Check Offers on the default tab, fill a valid name, an invalid (5-digit) mobile number, and leave city empty, then submit.`,
              expectedResult:
                'The real, page-shown mobile-format and location-required validation messages are displayed, and no lead is submitted.',
              steps: [
                `Open the ${pageLabel} page`,
                'Click a model card\'s "Check Offers" button',
                'Fill a valid name and an invalid mobile number',
                'Submit with city left empty',
                'Verify the mobile-format and location validation messages are shown',
              ],
            });

            allureStep(`Submit Check Offers with invalid mobile on ${pageLabel} and verify validation`, () => {
              const lead = page.checkOffersLeadCopy;
              const validation = lead.validation;
              page.openLeadFormViaCta();
              page.checkOffersLead.fillFields({ name: lead.name, mobile: lead.invalidMobile, city: '', selectCity: false });
              page.checkOffersLead.submit();
              page.checkOffersLead.verifyValidationMessages([validation.mobileInvalid, validation.locationRequired]);
            });
          }
        );
      }
    );
  });
});
