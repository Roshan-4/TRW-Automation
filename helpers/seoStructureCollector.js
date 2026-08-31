/**
 * Collects the SEO heading outline and FAQ questions from a live document.
 *
 * Used by:
 * - `scripts/scrape-seo-structure.js` (writes the snapshot)
 * - Cypress SEO structure specs (compares live vs snapshot)
 *
 * `collectSeoStructure` must stay self-contained (no outer closures) so
 * Playwright can run it inside the page via `page.evaluate`.
 *
 * Product-card titles, prices, news teasers, and listing counts are ignored.
 * Listing counts like "149 Popular Trucks" are stored without the number.
 */

const cleanText = (text) =>
  String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeHeading = (text) =>
  cleanText(text)
    .replace(/^\d+\s+/, '')
    .replace(/\s+-\s+\d+$/, '');

/**
 * @param {Document} doc
 * @returns {{ headings: Array<{tag: string, text: string}>, faq: { heading: string, questions: string[] } }}
 */
const collectSeoStructure = (doc = document) => {
  const clean = (text) =>
    String(text || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const normalize = (text) =>
    clean(text)
      .replace(/^\d+\s+/, '')
      .replace(/\s+-\s+\d+$/, '');

  // Read More copy captured live: en / hi / ta (HomePageSeoContentData).
  const isReadMore = (value) => /^(read more|अधिक पढ़ें|மேலும் படிக்க)$/i.test(clean(value));
  [...doc.querySelectorAll('button')].forEach((button) => {
    const title = button.getAttribute('title') || '';
    const label = clean(button.textContent);
    if (isReadMore(title) || isReadMore(label)) {
      button.click();
    }
  });

  const aboutEl =
    [...doc.querySelectorAll('[id^="description-box"] h1, [id^="description-box"] h2, [id^="description-box"] h3, [id^="description-box"] h4')].find(
      (el) => /about|के बारे में|பற்றி/i.test(clean(el.textContent))
    ) ||
    [...doc.querySelectorAll('h1, h2, h3')].find((el) =>
      /^(about\b|.+के बारे में)/i.test(clean(el.textContent))
    );
  const faqRoot = doc.querySelector('[class*="faqSection"]');
  const faqEl =
    (faqRoot &&
      [...faqRoot.querySelectorAll('h1, h2, h3, h4')].find((el) => !el.closest('.accordion'))) ||
    [...doc.querySelectorAll('h1, h2, h3, h4')].find((el) =>
      /frequently ask/i.test(el.textContent || '')
    );

  const headings = [];
  const seen = new Set();

  [...doc.querySelectorAll('h1, h2, h3, h4')].forEach((el) => {
    if (el.closest && el.closest('header, footer, nav, .secondaryNav')) {
      return;
    }
    const className = String(el.className || '');
    if (/\btruncate\b/.test(className) && !/^H[12]$/i.test(el.tagName)) {
      return;
    }
    if (el.closest('[class*="Card-module"]')) {
      return;
    }
    const raw = clean(el.textContent);
    if (/^From ₹/.test(raw) || /^₹/.test(raw)) {
      return;
    }
    if (el.closest('.accordion')) {
      return;
    }

    const tag = el.tagName.toLowerCase();
    const text = normalize(el.textContent);
    if (!text) {
      return;
    }

    const isAfterFaq =
      faqEl &&
      el !== faqEl &&
      !!(faqEl.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
    if (isAfterFaq) {
      return;
    }

    const inDesc = !!el.closest('[id^="description-box"]');
    const keepH3orH4 = inDesc || el === aboutEl || el === faqEl;

    if ((tag === 'h3' || tag === 'h4') && !keepH3orH4) {
      return;
    }

    const key = `${tag}:${text}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    headings.push({ tag, text });
  });

  const faqHeading = faqEl ? normalize(faqEl.textContent) : '';
  const questions = [...doc.querySelectorAll('.accordion')]
    .map((item) => {
      const title = item.querySelector('h2, h3, h4, button');
      return normalize(title ? title.textContent : item.textContent);
    })
    .filter(Boolean);

  return {
    headings,
    faq: {
      heading: faqHeading,
      questions,
    },
  };
};

const headingLine = (item) => `${item.tag.toUpperCase()}: ${item.text}`;

const diffHeadingLists = (expected, actual) => {
  const expectedKeys = expected.map(headingLine);
  const actualKeys = actual.map(headingLine);
  const missing = expected.filter(
    (item) => !actual.some((live) => live.tag === item.tag && live.text === item.text)
  );
  const extra = actual.filter(
    (item) => !expected.some((stored) => stored.tag === item.tag && stored.text === item.text)
  );
  return { missing, extra, expectedKeys, actualKeys };
};

const diffStringLists = (expected, actual) => ({
  missing: expected.filter((item) => !actual.includes(item)),
  extra: actual.filter((item) => !expected.includes(item)),
});

const padRows = (expected, actual) => {
  const length = Math.max(expected.length, actual.length);
  const rows = [];
  for (let index = 0; index < length; index += 1) {
    const exp = expected[index] || null;
    const act = actual[index] || null;
    let result = 'Match';
    if (!exp) {
      result = 'Extra on live page';
    } else if (!act) {
      result = 'Missing on live page';
    } else if (exp.tag !== act.tag || exp.text !== act.text) {
      result = 'Changed';
    }
    rows.push({
      index: index + 1,
      expectedTag: exp ? String(exp.tag).toUpperCase() : '',
      expectedText: exp ? exp.text : '',
      actualTag: act ? String(act.tag).toUpperCase() : '',
      actualText: act ? act.text : '',
      result,
    });
  }
  return rows;
};

const formatHeadingReport = (expected, actual) => {
  const { missing, extra, expectedKeys, actualKeys } = diffHeadingLists(expected, actual);
  const rows = padRows(expected, actual);
  return {
    matched: missing.length === 0 && extra.length === 0,
    missing,
    extra,
    expectedKeys,
    actualKeys,
    rows,
  };
};

const formatFaqReport = (expectedFaq = {}, actualFaq = {}) => {
  const expectedQuestions = expectedFaq.questions || [];
  const actualQuestions = actualFaq.questions || [];
  const { missing, extra } = diffStringLists(expectedQuestions, actualQuestions);
  const headingMatch = (expectedFaq.heading || '') === (actualFaq.heading || '');
  return {
    matched: headingMatch && missing.length === 0 && extra.length === 0,
    headingMatch,
    expectedHeading: expectedFaq.heading || '',
    actualHeading: actualFaq.heading || '',
    missing,
    extra,
    rows: padRows(
      expectedQuestions.map((text) => ({ tag: 'faq', text })),
      actualQuestions.map((text) => ({ tag: 'faq', text }))
    ),
  };
};

const comparisonTableHtml = (title, rows) => {
  const body = (rows || [])
    .map(
      (row) =>
        `<tr><td>${row.index}</td><td>${row.expectedTag} ${escapeHtml(
          row.expectedText
        )}</td><td>${row.actualTag} ${escapeHtml(row.actualText)}</td><td>${escapeHtml(
          row.result
        )}</td></tr>`
    )
    .join('');
  return `<h3>${escapeHtml(title)}</h3>
<table border="1" cellpadding="6" cellspacing="0">
<thead><tr><th>#</th><th>Expected (stored in test data)</th><th>Actual (live page)</th><th>Result</th></tr></thead>
<tbody>${body || '<tr><td colspan="4">(none)</td></tr>'}</tbody>
</table>`;
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

module.exports = {
  cleanText,
  normalizeHeading,
  collectSeoStructure,
  diffHeadingLists,
  diffStringLists,
  headingLine,
  formatHeadingReport,
  formatFaqReport,
  comparisonTableHtml,
};
