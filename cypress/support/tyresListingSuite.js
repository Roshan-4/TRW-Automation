const TyresListing = require('../../pages/UtilityPages/TyresListing');
const { TEST_TAGS } = require('../../constants/constants');
const { documentTestCase, allureStep } = require('../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../helpers/deviceTags');
const { currentDevice } = require('../../helpers/deviceLayout');

const LANGUAGES = TyresListing.supportedLanguages;

const langTags = (lang, ...extra) => [
  TEST_TAGS.UI,
  TEST_TAGS.UTILITY_PAGES,
  TEST_TAGS.TYRES_LISTING,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

const pageTags = (pageKey) => [`@${pageKey}`];

/**
 * Load More coverage for Tyres listing pages. Split across spec files so a
 * long browser session does not degrade (golden rule 22).
 */
function runTyresListingSuite(pageKeys) {
  LANGUAGES.forEach((lang) => {
    pageKeys.forEach((pageKey) => {
      const page = new TyresListing(lang, pageKey);
      const pageLabel = page.pageLabel;

      describe(
        `UtilityPages - TyresListing [${pageKey}] [${lang}] [${currentDevice()}] — ${pageLabel}`,
        { tags: [...langTags(lang), ...pageTags(pageKey)] },
        () => {
          beforeEach(() => {
            page.navigate();
          });

          registerRedirectionCheck({
            prefix: 'TYRL',
            lang,
            tags: langTags(lang, TEST_TAGS.REDIRECTION, ...pageTags(pageKey)),
            label: `UtilityPages - Tyres listing - ${pageLabel}`,
          });

          it(
            `TC-TYRL-01: Load More shows more tyre cards on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
            function () {
              if (!page.hasLoadMore()) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-TYRL-01',
                title: `Load More shows more tyre cards on ${pageLabel}`,
                language: lang,
                description: `Click Load More on ${pageLabel} and confirm more tyre cards appear.`,
                expectedResult: 'The number of visible “View August Offer” cards increases after Load More.',
                steps: [
                  `Open ${pageLabel}`,
                  'Note how many tyre cards are shown',
                  'Click Load More',
                  'Verify more cards are shown',
                ],
              });

              allureStep(`Click Load More on ${pageLabel}`, () => {
                page.clickLoadMoreAndExpectMoreCards();
              });
            }
          );

          it(
            `TC-TYRL-02: Load More is not shown on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.NEGATIVE, ...pageTags(pageKey)) },
            function () {
              if (page.hasLoadMore()) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-TYRL-02',
                title: `Load More is not shown on ${pageLabel}`,
                language: lang,
                description: `Confirm ${pageLabel} does not show a Load More button (this listing is fully shown on first load).`,
                expectedResult: 'No Load More button is present.',
                steps: [`Open ${pageLabel}`, 'Verify Load More is not shown'],
              });

              allureStep(`Verify Load More is absent on ${pageLabel}`, () => {
                page.verifyLoadMoreNotShown();
              });
            }
          );

          it(
            `TC-TYRL-03: a second Load More still adds tyre cards on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.EDGE, ...pageTags(pageKey)) },
            function () {
              if (!page.hasLoadMore()) {
                this.skip();
              }

              documentTestCase({
                id: 'TC-TYRL-03',
                title: `A second Load More still adds tyre cards on ${pageLabel}`,
                language: lang,
                description: `Click Load More once on ${pageLabel}, then again if it is still shown, and confirm the card list keeps growing.`,
                expectedResult:
                  'The first Load More adds cards. If Load More remains, a second click adds still more cards.',
                steps: [
                  `Open ${pageLabel}`,
                  'Click Load More and verify more cards',
                  'Click Load More again if it is still shown',
                ],
              });

              allureStep(`Click Load More twice on ${pageLabel}`, () => {
                page.clickLoadMoreAndExpectMoreCards();
                page.clickLoadMoreAgainIfStillShown();
              });
            }
          );
        }
      );
    });
  });
}

module.exports = { runTyresListingSuite };
