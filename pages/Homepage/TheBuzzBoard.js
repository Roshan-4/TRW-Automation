const buzzData = require('../../testData/HomePage/TheBuzzBoardData.json');
const { exactText } = require('../../helpers/leadFormFiller');

const LANG_HOME_PATH = {
  en: '/',
  hi: '/hi',
  ta: '/ta',
};

const STICKY_HEADER_OFFSET = 140;

/**
 * Homepage "The Buzz Board" news carousel.
 * Article title links → /{lang}/news/... (not present on Tamil homepage).
 */
class TheBuzzBoard {
  constructor(lang = 'en') {
    this.lang = lang;
    this.pageUrl = LANG_HOME_PATH[lang] || '/';
    this.copy = buzzData.TheBuzzBoard[lang];
  }

  static get supportedLanguages() {
    return Object.keys(buzzData.TheBuzzBoard);
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
    return this.getHeading().closest('div.mb-5', { log: false });
  }

  scrollToSection() {
    this.getHeading()
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('exist');
  }

  getVisibleArticleTitleLinks() {
    return this.getSection()
      .find(`a[title][href*="/${this.lang}/news/"]`, { log: false })
      .filter(':visible')
      .filter((_, el) => !el.querySelector('img') && Boolean((el.textContent || '').trim()));
  }

  verifySectionVisible() {
    this.scrollToSection();
    this.getHeading().should('be.visible').and('have.text', this.copy.heading);
    this.getSection().should('be.visible');
    this.getVisibleArticleTitleLinks().its('length').should('be.gte', 1);
  }

  clickFirstArticleTitleAndVerifyNavigation() {
    this.scrollToSection();
    this.getVisibleArticleTitleLinks()
      .first()
      .then(($link) => {
        const href = $link.attr('href');
        const title = ($link.attr('title') || $link.text() || '').trim();
        expect(href, `News article “${title}” should open a news page`).to.match(
          new RegExp(`^/${this.lang}/news/`)
        );
        cy.wrap($link).click();
        cy.location('pathname').should('eq', href);
      });
  }
}

module.exports = TheBuzzBoard;
