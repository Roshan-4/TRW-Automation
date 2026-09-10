const { TEST_TAGS } = require('../../../constants/constants');
const { documentTestCase, allureStep } = require('../../../helpers/documentTestCase');
const { deviceTag } = require('../../../helpers/deviceTags');
const { logSitemapUrlCounts, logSitemapPageUrls } = require('../../../helpers/sitemapUrlHealth');
const sitemapData = require('../../../testData/Sitemap/SitemapUrlHealthData.json');

/**
 * HTTPS URL health for page addresses listed inside selected sitemap XMLs.
 * The XML file itself is only opened so its <loc> list can be read — we do
 * not treat the XML file's 200 as the check. cy.request records 200 / 301 /
 * 404 / 500 on each listed page address and never fails the test.
 *
 * Run: npm run test:sitemap
 */
const tags = (...extra) => [TEST_TAGS.SITEMAP, TEST_TAGS.REDIRECTION, deviceTag(), ...extra];

const SITEMAPS = sitemapData.sitemaps;

describe('Sitemap - HTTPS URL health', { tags: tags(), retries: 0 }, () => {
  it(
    'TC-SM-00: count page addresses listed in each sitemap XML',
    { tags: tags(TEST_TAGS.POSITIVE, TEST_TAGS.SMOKE), timeout: 180000 },
    () => {
      documentTestCase({
        id: 'TC-SM-00',
        title: 'Count page addresses listed in each sitemap XML',
        description:
          'Read each selected sitemap XML (pages, brands, trucks, dealers by brand, dealers by city, bus pages, buses, bus brands) and count how many page addresses it lists. This does not check the XML file status and does not visit those pages.',
        expectedResult:
          'Each sitemap XML is logged with how many page addresses it contains. The test always passes.',
        steps: [
          'Open each listed sitemap XML only to read its page address list',
          'Count the page addresses in that XML',
          'Log the counts — do not fail the test',
        ],
      });

      allureStep('Count page addresses inside each sitemap XML', () => {
        logSitemapUrlCounts(SITEMAPS);
      });
    }
  );

  SITEMAPS.forEach((sitemap) => {
    it(
      `TC-SM-${sitemap.tc}: ${sitemap.label} — log status of page addresses listed in the XML`,
      { tags: tags(TEST_TAGS.POSITIVE), timeout: 21600000 },
      () => {
        documentTestCase({
          id: `TC-SM-${sitemap.tc}`,
          title: `${sitemap.label} — log status of page addresses listed in the XML`,
          description: `Read ${sitemap.label} (${sitemap.path}), count the page addresses it lists, then cy.request each https address. The next address is requested only after the previous response arrives, until the list is empty. This is a log-only check.`,
          expectedResult:
            'The URL count and every page address status (200, 301, 404, 500, or other) are logged. The test always passes.',
          steps: [
            `Read page addresses from ${sitemap.path}`,
            'Log how many addresses that XML lists',
            'Request each listed https address until none remain',
            'Log 200, 301, 404, or 500 — do not fail the test',
          ],
        });

        allureStep(`Log listed page URL statuses in ${sitemap.label}`, () => {
          logSitemapPageUrls(sitemap.path, sitemap.label);
        });
      }
    );
  });
});
