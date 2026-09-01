/**
 * The tyres section's per-card CTA ("View <Month> Offer") rotates to the
 * current calendar month on the live site. A literal month name in test
 * code/data goes stale on the 1st of every month (confirmed: it broke going
 * from August to September). Derive it from the clock instead so it never
 * needs a manual monthly update.
 */
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const getTyresOfferCta = (date = new Date()) => `View ${MONTH_NAMES[date.getMonth()]} Offer`;

module.exports = { getTyresOfferCta };
