/**
 * Professional test-case documentation for Allure / Jira-ready reports.
 * Primary readers are non-technical — keep Description and Expected Result clear.
 *
 * Usage (inside an `it` callback, before actions):
 *   documentTestCase({
 *     id: 'TC-PTB-01',
 *     title: 'Popular Truck Brands section is visible with heading',
 *     description: 'Verify the Popular Truck Brands section loads on the homepage.',
 *     expectedResult: 'Section is visible and heading matches the localized copy.',
 *     steps: ['Open homepage', 'Scroll to Popular Truck Brands', 'Verify heading'],
 *   });
 */
const allure = require('allure-js-commons');

const documentTestCase = ({
  id,
  title,
  description,
  expectedResult,
  steps = [],
  language,
} = {}) => {
  if (!id || !description || !expectedResult) {
    throw new Error('documentTestCase requires id, description, and expectedResult');
  }

  const lines = [
    `**Test Case ID:** ${id}`,
    title ? `**Title:** ${title}` : null,
    language ? `**Language:** ${language}` : null,
    '',
    '**Description:**',
    description.trim(),
    '',
    '**Expected Result:**',
    expectedResult.trim(),
  ].filter((line) => line !== null);

  if (steps.length) {
    lines.push('', '**Steps:**');
    steps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step}`);
    });
  }

  const markdown = lines.join('\n');
  allure.description(markdown);
  cy.log(`[${id}] Description: ${description.trim()}`);
  cy.log(`[${id}] Expected Result: ${expectedResult.trim()}`);
  cy.task('log', `[${id}] ${description.trim()} | Expected: ${expectedResult.trim()}`, {
    log: false,
  });
};

/**
 * Wrap a user-facing action as an Allure step with a plain-language name.
 */
const allureStep = (name, fn) => allure.step(name, fn);

module.exports = {
  documentTestCase,
  allureStep,
};
