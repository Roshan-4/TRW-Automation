const SeoStructure = require('../../pages/Seo/SeoStructure');
const { getGroup, SEO_STRUCTURE_LANGUAGES, resolveSnapshot } = require('../../pages/Seo/seoStructureCatalog');
const { TEST_TAGS } = require('../../constants/constants');
const { documentTestCase, allureStep } = require('../../helpers/documentTestCase');
const { registerRedirectionCheck } = require('../../helpers/verifyPageRedirections');
const { deviceTag } = require('../../helpers/deviceTags');

const loadSnapshots = (dataFile) => {
  const files = {
    'testData/Seo/Homepage/SeoStructureData.json': () =>
      require('../../testData/Seo/Homepage/SeoStructureData.json'),
    'testData/Seo/ListingPages/SeoStructureData.json': () =>
      require('../../testData/Seo/ListingPages/SeoStructureData.json'),
    'testData/Seo/CategoryPages/SeoStructureData.json': () =>
      require('../../testData/Seo/CategoryPages/SeoStructureData.json'),
    'testData/Seo/Buses/SeoStructureData.json': () =>
      require('../../testData/Seo/Buses/SeoStructureData.json'),
    'testData/Seo/UsedTruck/SeoStructureData.json': () =>
      require('../../testData/Seo/UsedTruck/SeoStructureData.json'),
    'testData/Seo/UtilityPages/ContentSeoStructureData.json': () =>
      require('../../testData/Seo/UtilityPages/ContentSeoStructureData.json'),
    'testData/Seo/UtilityPages/DirectorySeoStructureData.json': () =>
      require('../../testData/Seo/UtilityPages/DirectorySeoStructureData.json'),
    'testData/Seo/UtilityPages/ContentDetailSeoStructureData.json': () =>
      require('../../testData/Seo/UtilityPages/ContentDetailSeoStructureData.json'),
    'testData/Seo/UtilityPages/OffersSeoStructureData.json': () =>
      require('../../testData/Seo/UtilityPages/OffersSeoStructureData.json'),
    'testData/Seo/UtilityPages/TyresSeoStructureData.json': () =>
      require('../../testData/Seo/UtilityPages/TyresSeoStructureData.json'),
    'testData/Seo/PDP/SeoStructureData.json': () =>
      require('../../testData/Seo/PDP/SeoStructureData.json'),
    'testData/Seo/PDP/InternalSeoStructureData.json': () =>
      require('../../testData/Seo/PDP/InternalSeoStructureData.json'),
    'testData/Seo/Buses/BusPdpSeoStructureData.json': () =>
      require('../../testData/Seo/Buses/BusPdpSeoStructureData.json'),
    'testData/Seo/UsedTruck/UsedTruckPdpSeoStructureData.json': () =>
      require('../../testData/Seo/UsedTruck/UsedTruckPdpSeoStructureData.json'),
    'testData/Seo/Compare/SeoStructureData.json': () =>
      require('../../testData/Seo/Compare/SeoStructureData.json'),
    'testData/Seo/Brochure/SeoStructureData.json': () =>
      require('../../testData/Seo/Brochure/SeoStructureData.json'),
  };
  const loader = files[dataFile];
  if (!loader) {
    throw new Error(`No snapshot loader for ${dataFile}. Run npm run scrape:seo-structure first.`);
  }
  return loader();
};

const langTags = (lang, ...extra) => [
  TEST_TAGS.SEO,
  TEST_TAGS.SEO_STRUCTURE,
  TEST_TAGS.LANGUAGE,
  `@${lang}`,
  deviceTag(),
  ...extra,
];

/**
 * Daily heading + FAQ snapshot suite for one catalog group.
 * IDs TC-SEOS-00..04 are reused per page (same case, different page/language).
 */
function runSeoStructureSuite(groupId) {
  const group = getGroup(groupId);
  if (!group) {
    throw new Error(`Unknown SEO structure group: ${groupId}`);
  }

  const snapshots = loadSnapshots(group.dataFile);

  group.pages.forEach((meta) => {
    const raw = snapshots.pages && snapshots.pages[meta.key];
    if (!raw) {
      throw new Error(
        `No snapshot for ${meta.key} in ${group.dataFile}. Run npm run scrape:seo-structure.`
      );
    }

    SEO_STRUCTURE_LANGUAGES.forEach((lang) => {
      const stored = resolveSnapshot(raw, lang);
      if (!stored) {
        if (raw.byLanguage) {
          throw new Error(
            `Missing ${lang} snapshot for ${meta.key} in ${group.dataFile}. Run: node scripts/scrape-seo-structure.js --group=${groupId} --lang=${lang}`
          );
        }
        return;
      }
      const page = new SeoStructure(stored, lang, {
        pageKey: meta.key,
        dataFile: group.dataFile,
      });
      const pageLabel = page.pageLabel;

      describe(
        `SEO structure - ${group.area} [${meta.key}] [${lang}] — ${pageLabel}`,
        { tags: langTags(lang, `@${meta.key}`) },
        () => {
          beforeEach(() => {
            page.navigate();
          });

          registerRedirectionCheck({
            prefix: 'SEOS',
            lang,
            tags: langTags(lang, TEST_TAGS.REDIRECTION, `@${meta.key}`),
            label: `SEO structure - ${pageLabel} [${lang}]`,
          });

          it(
            `TC-SEOS-01: heading structure on ${pageLabel} [${lang}] matches the stored snapshot`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE, `@${meta.key}`) },
            () => {
              documentTestCase({
                id: 'TC-SEOS-01',
                title: `Heading structure on ${pageLabel} [${lang}] matches the stored snapshot`,
                language: lang,
                description: `Open ${pageLabel} (${lang}) and compare live SEO headings with the snapshot. Allure and artifacts/seo-structure-report.xlsx show expected vs actual so a changed heading can be copied into test data after it is confirmed.`,
                expectedResult: `Every stored heading on ${pageLabel} (${lang}) is still present with the same tag. Extra or missing headings fail the check; order on the page may differ.`,
                steps: [
                  `Open ${pageLabel} (${lang})`,
                  'Expand Read More if the About block is collapsed',
                  'Compare live headings with the stored snapshot',
                ],
              });

              allureStep(`Compare headings on ${pageLabel} (${lang})`, () => {
                page.verifyHeadingsMatchSnapshot();
              });
            }
          );

          it(
            `TC-SEOS-02: FAQ questions on ${pageLabel} [${lang}] match the stored snapshot`,
            { tags: langTags(lang, TEST_TAGS.POSITIVE, `@${meta.key}`) },
            () => {
              documentTestCase({
                id: 'TC-SEOS-02',
                title: `FAQ questions on ${pageLabel} [${lang}] match the stored snapshot`,
                language: lang,
                description: `Compare the FAQ heading and questions on ${pageLabel} (${lang}) with the stored snapshot. Pages with no FAQ must still have none.`,
                expectedResult:
                  stored.faq && stored.faq.questions && stored.faq.questions.length
                    ? `FAQ heading and questions on ${pageLabel} (${lang}) are unchanged.`
                    : `${pageLabel} (${lang}) still has no FAQ section.`,
                steps: [
                  `Open ${pageLabel} (${lang})`,
                  'Read the FAQ block',
                  'Compare with the stored snapshot',
                ],
              });

              allureStep(`Compare FAQ on ${pageLabel} (${lang})`, () => {
                page.verifyFaqMatchesSnapshot();
              });
            }
          );

          it(
            `TC-SEOS-03: none of the stored headings are missing on ${pageLabel} [${lang}]`,
            { tags: langTags(lang, TEST_TAGS.NEGATIVE, `@${meta.key}`) },
            () => {
              documentTestCase({
                id: 'TC-SEOS-03',
                title: `None of the stored headings are missing on ${pageLabel} [${lang}]`,
                language: lang,
                description: `Confirm every heading stored for ${pageLabel} (${lang}) still exists on the live page.`,
                expectedResult: `No stored heading is missing on ${pageLabel} (${lang}).`,
                steps: [
                  `Open ${pageLabel} (${lang})`,
                  'Check each stored heading is still on the page',
                ],
              });

              allureStep(`Verify no stored headings are missing on ${pageLabel} (${lang})`, () => {
                page.verifyNoStoredHeadingsMissing();
              });
            }
          );

          it(
            `TC-SEOS-04: heading count on ${pageLabel} [${lang}] still matches the snapshot`,
            { tags: langTags(lang, TEST_TAGS.EDGE, `@${meta.key}`) },
            () => {
              documentTestCase({
                id: 'TC-SEOS-04',
                title: `Heading count on ${pageLabel} [${lang}] still matches the snapshot`,
                language: lang,
                description: `Confirm ${pageLabel} (${lang}) still has the same number of SEO headings as the snapshot.`,
                expectedResult: `${pageLabel} (${lang}) still has ${(stored.headings || []).length} SEO headings.`,
                steps: [
                  `Open ${pageLabel} (${lang})`,
                  'Count SEO headings',
                  'Compare with the snapshot count',
                ],
              });

              allureStep(`Verify heading count on ${pageLabel} (${lang})`, () => {
                page.verifyHeadingCountMatches();
              });
            }
          );
        }
      );
    });
  });
}

module.exports = { runSeoStructureSuite };
