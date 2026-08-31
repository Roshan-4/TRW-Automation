const seoData = require('../../testData/Seo/UtilityPages/TyresSeoContentData.json');
const { currentDevice } = require('../../helpers/deviceLayout');

/**
 * Tyres listing Load More (hub, Latest Truck Tyres, brand listings).
 *
 * Lead forms stay on `pages/UtilityPages/Tyres.js`. About/FAQ live under
 * `pages/Seo/UtilityPages/TyresSeoContent.js`. This class only covers the
 * listing Load More control, which can differ by device even when copy matches.
 */
class TyresListing {
  constructor(lang = 'en', pageKey) {
    this.lang = lang;
    const pages = seoData.TyresSeoContent[lang]?.pages || [];
    this.page = pages.find((p) => p.key === pageKey);
    if (!this.page) {
      throw new Error(`Unknown Tyres listing page key: ${pageKey} for lang=${lang}`);
    }
  }

  static get supportedLanguages() {
    return Object.keys(seoData.TyresSeoContent);
  }

  static getPageKeys() {
    return (seoData.TyresSeoContent.en.pages || [])
      .filter((p) => p.key !== 'continentalHdw2')
      .map((p) => p.key);
  }

  get pageLabel() {
    return this.page.name;
  }

  get pageUrl() {
    return this.page.path;
  }

  hasLoadMore() {
    return Boolean(this.page.hasLoadMore);
  }

  navigate() {
    cy.visit(this.pageUrl, { timeout: 90000 });
    cy.document().its('readyState').should('eq', 'complete');
    this.dismissBlockingOverlays();
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

  clickLoadMoreAndExpectMoreCards() {
    const cta = this.page.cardCta;
    const pageLabel = this.pageLabel;
    const device = currentDevice();

    cy.get('body', { timeout: 20000 }).should(() => {
      const found = [...Cypress.$('button')].some((el) => el.textContent.trim() === 'Load More');
      expect(found, `Load More is present on ${pageLabel} (${device})`).to.eq(true);
    });

    cy.document().then((doc) => {
      const countCtas = () =>
        [...doc.querySelectorAll('button')].filter(
          (el) => el.textContent.trim() === cta && el.offsetParent !== null
        ).length;
      const before = countCtas();
      let lastClickAt = 0;
      const clickLoadMore = () => {
        const now = Date.now();
        if (now - lastClickAt < 1000) {
          return;
        }
        const btn = [...doc.querySelectorAll('button')].find(
          (el) => el.textContent.trim() === 'Load More'
        );
        if (!btn) {
          return;
        }
        ['mousedown', 'mouseup', 'click'].forEach((type) => {
          btn.dispatchEvent(
            new MouseEvent(type, { bubbles: true, cancelable: true, view: doc.defaultView })
          );
        });
        lastClickAt = now;
      };
      clickLoadMore();
      cy.wrap(null, { timeout: 20000 }).should(() => {
        if (countCtas() <= before) {
          clickLoadMore();
        }
        expect(
          countCtas(),
          `Load More should show more "${cta}" cards on ${pageLabel} (${device})`
        ).to.be.greaterThan(before);
      });
    });
  }

  clickLoadMoreAgainIfStillShown() {
    const cta = this.page.cardCta;
    const pageLabel = this.pageLabel;
    const device = currentDevice();

    cy.document().then((doc) => {
      const countCtas = () =>
        [...doc.querySelectorAll('button')].filter(
          (el) => el.textContent.trim() === cta && el.offsetParent !== null
        ).length;
      const stillHasLoadMore = () =>
        [...doc.querySelectorAll('button')].some((el) => el.textContent.trim() === 'Load More');

      if (!stillHasLoadMore()) {
        return;
      }

      const before = countCtas();
      let lastClickAt = 0;
      const clickLoadMore = () => {
        const now = Date.now();
        if (now - lastClickAt < 1000) {
          return;
        }
        const btn = [...doc.querySelectorAll('button')].find(
          (el) => el.textContent.trim() === 'Load More'
        );
        if (!btn) {
          return;
        }
        ['mousedown', 'mouseup', 'click'].forEach((type) => {
          btn.dispatchEvent(
            new MouseEvent(type, { bubbles: true, cancelable: true, view: doc.defaultView })
          );
        });
        lastClickAt = now;
      };
      clickLoadMore();
      cy.wrap(null, { timeout: 20000 }).should(() => {
        if (!stillHasLoadMore()) {
          return;
        }
        if (countCtas() <= before) {
          clickLoadMore();
        }
        expect(
          countCtas(),
          `A second Load More should show still more "${cta}" cards on ${pageLabel} (${device}) when the button remains`
        ).to.be.greaterThan(before);
      });
    });
  }

  verifyLoadMoreNotShown() {
    cy.get('body', { timeout: 20000 }).should('be.visible');
    cy.get('body').then(($body) => {
      const found = [...$body.find('button')].some((el) => el.textContent.trim() === 'Load More');
      expect(
        found,
        `Load More should not be shown on ${this.pageLabel} (${currentDevice()})`
      ).to.eq(false);
    });
  }
}

module.exports = TyresListing;
