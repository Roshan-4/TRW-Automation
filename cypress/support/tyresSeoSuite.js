const TyresSeoContent = require('../../pages/Seo/UtilityPages/TyresSeoContent');
const { TEST_TAGS } = require('../../constants/constants');
const { documentTestCase, allureStep } = require('../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../helpers/deviceTags');
const { currentDevice } = require('../../helpers/deviceLayout');

const LANGUAGES = TyresSeoContent.supportedLanguages;

const langTags = (lang, ...extra) => [
  TEST_TAGS.SEO,
  TEST_TAGS.UTILITY_PAGES,
  TEST_TAGS.TYRES_SEO,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

const pageTags = (pageKey) => [`@${pageKey}`];

/**
 * Shared SEO body for the Tyres page family (hub, Latest, brand listings,
 * one product page). Split across spec files so a long browser session
 * does not degrade (golden rule 22).
 */
function runTyresSeoSuite(pageKeys) {
  LANGUAGES.forEach((lang) => {
    pageKeys.forEach((pageKey) => {
      const page = new TyresSeoContent(lang, pageKey);
      const pageLabel = page.pageLabel;

      describe(
        `SEO - TyresSeoContent [${pageKey}] [${lang}] [${currentDevice()}] — ${pageLabel}`,
        { tags: [...langTags(lang), ...pageTags(pageKey)] },
        () => {
          beforeEach(() => {
            page.navigate();
          });

          registerRedirectionCheck({
            prefix: 'TYRSEO',
            lang,
            tags: langTags(lang, TEST_TAGS.REDIRECTION, ...pageTags(pageKey)),
            label: `SEO - Tyres - ${pageLabel}`,
          });

          it(
            `TC-TYRSEO-01: About content is visible with Read More on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
            () => {
              documentTestCase({
                id: 'TC-TYRSEO-01',
                title: `About content is visible with Read More on ${pageLabel}`,
                language: lang,
                description: `Open ${pageLabel} and confirm the About / description SEO block shows its heading, collapsed copy, and Read More.`,
                expectedResult: `“${page.page.aboutHeading}” is visible with Read More and the collapsed About text.`,
                steps: [
                  `Open ${pageLabel}`,
                  'Scroll to the About / description block',
                  'Verify heading, collapsed copy and Read More',
                ],
              });

              allureStep(`Verify About block on ${pageLabel}`, () => {
                page.verifyAboutSectionVisible();
              });
            }
          );

          it(
            `TC-TYRSEO-02: Read More expands About content on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, ...pageTags(pageKey)) },
            () => {
              documentTestCase({
                id: 'TC-TYRSEO-02',
                title: `Read More expands About content on ${pageLabel}`,
                language: lang,
                description: `Click Read More on the ${pageLabel} About block and confirm Read Less is shown.`,
                expectedResult: 'The About block expands and Read Less is visible.',
                steps: [`Open ${pageLabel} About block`, 'Click Read More', 'Verify Read Less'],
              });

              allureStep(`Expand Read More on ${pageLabel}`, () => {
                page.expandReadMore();
              });
            }
          );

          it(
            `TC-TYRSEO-03: FAQ heading and questions are listed on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, ...pageTags(pageKey)) },
            () => {
              documentTestCase({
                id: 'TC-TYRSEO-03',
                title: `FAQ heading and questions are listed on ${pageLabel}`,
                language: lang,
                description: `Confirm ${pageLabel} shows the FAQ heading and each expected question.`,
                expectedResult: `“${page.page.faqHeading}” and the listed questions are present.`,
                steps: [`Open ${pageLabel}`, 'Scroll to FAQ', 'Verify heading and questions'],
              });

              allureStep(`Verify FAQ copy on ${pageLabel}`, () => {
                page.verifyFaqHeadingAndQuestions();
              });
            }
          );

          it(
            `TC-TYRSEO-04: FAQ question expands on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.EDGE, ...pageTags(pageKey)) },
            () => {
              documentTestCase({
                id: 'TC-TYRSEO-04',
                title: `FAQ question expands on ${pageLabel}`,
                language: lang,
                description: `Open a Frequently Asked Question on ${pageLabel} and confirm the answer is shown.`,
                expectedResult: 'The selected question’s answer is visible.',
                steps: [`Open ${pageLabel}`, 'Scroll to FAQ', 'Open a question', 'Verify the answer'],
              });

              allureStep(`Expand an FAQ on ${pageLabel}`, () => {
                page.expandFaqQuestion();
              });
            }
          );

          it(
            `TC-TYRSEO-05: Read Less is not shown before About is expanded on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.NEGATIVE, ...pageTags(pageKey)) },
            () => {
              documentTestCase({
                id: 'TC-TYRSEO-05',
                title: `Read Less is not shown before About is expanded on ${pageLabel}`,
                language: lang,
                description: `Confirm Read Less is absent on ${pageLabel} while the About block is still collapsed.`,
                expectedResult: 'Read Less does not exist until Read More is clicked.',
                steps: [`Open ${pageLabel} About block`, 'Verify Read Less is not shown'],
              });

              allureStep(`Verify Read Less is hidden before expand on ${pageLabel}`, () => {
                page.verifyReadLessNotShownBeforeExpanding();
              });
            }
          );

          it(
            `TC-TYRSEO-06: Read Less collapses About content on ${pageLabel}`,
            { tags: langTags(lang, TEST_TAGS.EDGE, ...pageTags(pageKey)) },
            () => {
              documentTestCase({
                id: 'TC-TYRSEO-06',
                title: `Read Less collapses About content on ${pageLabel}`,
                language: lang,
                description: `Expand via Read More on ${pageLabel}, then click Read Less and confirm Read More returns.`,
                expectedResult: 'After Read Less, the block is collapsed and Read More is visible again.',
                steps: [
                  `Open ${pageLabel} About block`,
                  'Click Read More, then Read Less',
                  'Verify Read More is shown again',
                ],
              });

              allureStep(`Collapse Read Less on ${pageLabel}`, () => {
                page.expandReadMore();
                page.collapseReadLess();
              });
            }
          );
        }
      );
    });
  });
}

module.exports = { runTyresSeoSuite };
