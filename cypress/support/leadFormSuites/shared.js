const { TEST_TAGS } = require('../../../constants/constants');
const { deviceTag } = require('../../../helpers/deviceTags');

/** English-only consolidated lead-form suite (see AllLeadformsuite.cy.js). */
const ALL_LEAD_LANG = 'en';

function suiteLangTags(areaTags, ...extra) {
  return [
    TEST_TAGS.UI,
    TEST_TAGS.ALL_LEAD_FORM,
    TEST_TAGS.LANGUAGE,
    `@${ALL_LEAD_LANG}`,
    deviceTag(),
    ...areaTags,
    ...extra,
  ];
}

module.exports = {
  ALL_LEAD_LANG,
  suiteLangTags,
};
