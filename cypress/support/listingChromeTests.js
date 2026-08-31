const { TEST_TAGS } = require('../../constants/constants');
const { documentTestCase, allureStep } = require('../../helpers/documentTestCase');

/**
 * Shared listing-chrome tests (heading / filters / cards) for category,
 * electric, and bus listing pages — lead forms stay in each spec's own `it`s.
 */
function registerListingChromeTests({ page, pageLabel, id, langTags }) {
  it(
    `${id}: listing heading, filters and cards on ${pageLabel}`,
    { tags: langTags },
    () => {
      documentTestCase({
        id,
        title: `listing heading, filters and cards on ${pageLabel}`,
        language: page.lang,
        description: `Open ${pageLabel} and confirm the page heading and at least one listing card CTA. Filter By is checked when that row is present.`,
        expectedResult: 'Page heading is visible and at least one listing card button is shown.',
        steps: [
          `Open the ${pageLabel} page`,
          'Verify the page heading',
          'Verify listing cards (and Filter By when present)',
        ],
      });

      allureStep(`Verify listing chrome on ${pageLabel}`, () => {
        page.verifyListingChrome();
      });
    }
  );
}

module.exports = { registerListingChromeTests, TEST_TAGS };
