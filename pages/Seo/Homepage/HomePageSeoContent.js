const seoData = require('../../../testData/Seo/Homepage/HomePageSeoContentData.json');
const { exactText } = require('../../../helpers/leadFormFiller');

const LANG_HOME_PATH = {
  en: '/',
  hi: '/hi',
  ta: '/ta',
};

const STICKY_HEADER_OFFSET = 140;

/**
 * Homepage SEO / About Truck Junction content block (#description-box-1).
 * Collapsed by default — expand via Read More. English exposes nested h2 SEO
 * sections and brand links; hi/ta expand to additional paragraph copy.
 */
class HomePageSeoContent {
  constructor(lang = 'en') {
    this.lang = lang;
    this.pageUrl = LANG_HOME_PATH[lang] || '/';
    this.copy = seoData.HomePageSeoContent[lang];
  }

  static get supportedLanguages() {
    return Object.keys(seoData.HomePageSeoContent);
  }

  navigate() {
    cy.visit(this.pageUrl);
    cy.document().its('readyState').should('eq', 'complete');
    this.dismissBlockingOverlays();
    this.scrollToAbout();
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

  getAboutBox() {
    return cy.get('#description-box-1', { log: false });
  }

  getAboutHeading() {
    return this.getAboutBox().contains('h3', exactText(this.copy.aboutHeading), { log: false });
  }

  getReadMoreButton() {
    return this.getAboutBox().find(`button[title="${this.copy.readMore}"]`, { log: false });
  }

  getReadLessButton() {
    return this.getAboutBox().find(`button[title="${this.copy.readLess}"]`, { log: false });
  }

  scrollToAbout() {
    this.getAboutHeading()
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('exist');
  }

  verifyAboutSectionVisible() {
    this.scrollToAbout();
    this.getAboutHeading().should('be.visible').and('have.text', this.copy.aboutHeading);
    this.getReadMoreButton().should('be.visible');
  }

  expandReadMore() {
    this.scrollToAbout();
    this.getAboutBox().then(($box) => {
      const clickUntilExpanded = () => {
        const root = () => Cypress.$('#description-box-1');
        if (root().find(`button[title="${this.copy.readLess}"]`).length) {
          return;
        }
        const button = root().find(`button[title="${this.copy.readMore}"]`).get(0);
        if (button) {
          button.click();
        }
      };

      clickUntilExpanded();
      cy.get('#description-box-1', { log: false }).should(($el) => {
        if (!$el.find(`button[title="${this.copy.readLess}"]`).length) {
          clickUntilExpanded();
        }
        expect(
          $el.find(`button[title="${this.copy.readLess}"]`).length,
          'About content should expand after Read More'
        ).to.be.gte(1);
      });
    });
  }

  verifySeoHeadingsVisible() {
    const headings = this.copy.seoHeadings || [];
    expect(headings.length, 'English SEO heading list should not be empty').to.be.gte(1);
    headings.forEach((heading) => {
      this.getAboutBox()
        .contains('h2', exactText(heading))
        .should('be.visible')
        .and('have.text', heading);
    });
  }

  clickSampleBrandLinkAndVerifyNavigation() {
    const link = this.copy.sampleBrandLink;
    expect(link, 'sampleBrandLink should be defined for this language').to.exist;
    this.getAboutBox()
      .contains('a', exactText(link.text))
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('be.visible')
      .then(($a) => {
        const path = String($a.attr('href') || '').replace(/^https?:\/\/[^/]+/, '');
        expect(path, `Brand link “${link.text}” should open ${link.href}`).to.eq(link.href);
        // SEO links often open in a new tab — visit the path in this window instead.
        cy.visit(path);
        cy.location('pathname').should('eq', link.href);
      });
  }
}

module.exports = HomePageSeoContent;
