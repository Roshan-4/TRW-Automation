const ptcData = require('../../testData/HomePage/PopularTruckComparisonData.json');
const { exactText } = require('../../helpers/leadFormFiller');

const LANG_HOME_PATH = {
  en: '/',
  hi: '/hi',
  ta: '/ta',
};

const STICKY_HEADER_OFFSET = 140;

/**
 * Homepage "Popular Truck Comparison" section.
 * Truck name links → PDP; View All Comparison → /{lang}/compare.
 * No Check Offers lead in this section.
 */
class PopularTruckComparison {
  constructor(lang = 'en') {
    this.lang = lang;
    this.pageUrl = LANG_HOME_PATH[lang] || '/';
    this.copy = ptcData.PopularTruckComparison[lang];
  }

  static get supportedLanguages() {
    return Object.keys(ptcData.PopularTruckComparison);
  }

  navigate() {
    cy.visit(this.pageUrl);
    cy.document().its('readyState').should('eq', 'complete');
    this.dismissBlockingOverlays();
    this.scrollToSection();
  }

  dismissBlockingOverlays() {
    cy.get('body').then(($body) => {
      const dismissTexts = [/accept/i, /agree/i, /got it/i, /allow/i, /close/i, /ठीक/i];
      dismissTexts.forEach((pattern) => {
        const btn = $body.find('button').filter((_, el) => pattern.test(el.textContent || ''));
        if (btn.length) {
          cy.wrap(btn.first()).click({ force: true });
        }
      });
    });
  }

  getHeading() {
    return cy.contains('h2', exactText(this.copy.heading), { log: false });
  }

  getSection() {
    return this.getHeading().closest('div.section-wrapper', { log: false });
  }

  scrollToSection() {
    this.getHeading()
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('exist');
  }

  getVisibleProductNameLinks() {
    return this.getSection()
      .find('a[title][href*="-truck/"]', { log: false })
      .filter(':visible')
      .filter((_, el) => !el.querySelector('img') && Boolean((el.textContent || '').trim()));
  }

  getViewAllLink() {
    return this.getSection().find(`a[title="${this.copy.viewAll.label}"]`, { log: false });
  }

  verifySectionVisible() {
    this.scrollToSection();
    this.getHeading().should('be.visible').and('have.text', this.copy.heading);
    this.getSection().should('be.visible');
    this.getVisibleProductNameLinks().its('length').should('be.gte', 1);
  }

  clickFirstProductNameAndVerifyNavigation() {
    this.scrollToSection();
    this.getVisibleProductNameLinks()
      .first()
      .then(($link) => {
        const href = $link.attr('href');
        const title = ($link.attr('title') || $link.text() || '').trim();
        expect(href, `Compared truck “${title}” should have a truck PDP URL`).to.match(
          new RegExp(`^/${this.lang}/[^/]+-truck/`)
        );
        cy.wrap($link).click();
        cy.location('pathname').should('eq', href);
      });
  }

  clickViewAllAndVerifyNavigation() {
    this.scrollToSection();
    this.getViewAllLink()
      .should('be.visible')
      .and('have.attr', 'href', this.copy.viewAll.href);
    // { force: true }: Cypress's actionability check flags this link as
    // "hidden" because of its own nested text-wrapping `<span>` (confirmed
    // live — the element actually at the click point is that span, not an
    // unrelated overlay); the link is real, visible, and correctly
    // positioned.
    this.getViewAllLink().click({ force: true });
    cy.location('pathname').should('eq', this.copy.viewAll.href);
  }

  /** Negative: View All must not accidentally reuse a product card's URL. */
  verifyViewAllLinkDoesNotMatchAProductLink() {
    this.scrollToSection();
    this.getVisibleProductNameLinks().first().invoke('attr', 'href').then((productHref) => {
      this.getViewAllLink().should('not.have.attr', 'href', productHref);
    });
  }

  /**
   * Edge: no two comparison cards should compare the exact same pair of
   * trucks. Each card links two trucks (A vs B), and a popular truck
   * legitimately appears as one side of several different comparisons —
   * confirmed live (e.g. "Intra V20 Gold" paired against three different
   * competitors) — so individual truck links repeating across cards is
   * expected, real behavior, not a bug. What must stay unique is the pair
   * itself.
   */
  verifyNoDuplicateProductLinks() {
    this.scrollToSection();
    this.getVisibleProductNameLinks().then(($links) => {
      const hrefs = [...$links].map((el) => el.getAttribute('href'));
      const pairs = [];
      for (let i = 0; i < hrefs.length - 1; i += 2) {
        pairs.push([hrefs[i], hrefs[i + 1]].sort().join(' vs '));
      }
      expect(new Set(pairs).size, 'Each visible comparison card should compare a distinct pair of trucks').to.eq(
        pairs.length
      );
    });
  }
}

module.exports = PopularTruckComparison;
