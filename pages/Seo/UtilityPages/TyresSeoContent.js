const seoData = require('../../../testData/Seo/UtilityPages/TyresSeoContentData.json');
const { exactText } = require('../../../helpers/leadFormFiller');
const { currentDevice } = require('../../../helpers/deviceLayout');

const STICKY_HEADER_OFFSET = 160;

/**
 * Tyres SEO content (About + FAQ) across the Tyres page family.
 *
 * Live capture: listing/brand "About … In India" sits in
 * `#description-box-2` on desktop and `#description-box-3` on mobile.
 * Locating by the visible About heading (then the nearest description-box)
 * covers both, without baking a device-specific id into the tests.
 */
class TyresSeoContent {
  constructor(lang = 'en', pageKey) {
    this.lang = lang;
    const pages = seoData.TyresSeoContent[lang]?.pages || [];
    this.page = pages.find((p) => p.key === pageKey);
    if (!this.page) {
      throw new Error(`Unknown Tyres SEO page key: ${pageKey} for lang=${lang}`);
    }
    this.copy = seoData.TyresSeoContent[lang];
  }

  static get supportedLanguages() {
    return Object.keys(seoData.TyresSeoContent);
  }

  static getPageKeys() {
    return (seoData.TyresSeoContent.en.pages || []).map((p) => p.key);
  }

  get pageLabel() {
    return this.page.name;
  }

  get pageUrl() {
    return this.page.path;
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

  aboutHeadingSelector() {
    return '[id^="description-box"] h1, [id^="description-box"] h2, [id^="description-box"] h3, [id^="description-box"] h4';
  }

  getAboutBox() {
    return cy
      .contains(this.aboutHeadingSelector(), exactText(this.page.aboutHeading), { timeout: 20000 })
      .closest('[id^="description-box"]');
  }

  getReadMoreButton() {
    return this.getAboutBox().find(`button[title="${this.copy.readMore}"]`);
  }

  getReadLessButton() {
    return this.getAboutBox().find(`button[title="${this.copy.readLess}"]`);
  }

  scrollToAbout() {
    this.getAboutBox()
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('exist');
  }

  verifyAboutSectionVisible() {
    this.scrollToAbout();
    this.getAboutBox()
      .should('be.visible')
      .and('contain', this.page.collapsedSnippet);
    this.getReadMoreButton().should('be.visible');
  }

  /** jQuery set for the About / description box, located by heading (device-safe). */
  findAboutBox$() {
    const heading = Cypress.$(this.aboutHeadingSelector()).filter((_, el) =>
      exactText(this.page.aboutHeading).test(el.textContent || '')
    );
    return heading.closest('[id^="description-box"]');
  }

  expandReadMore() {
    this.scrollToAbout();
    const readMore = this.copy.readMore;
    const readLess = this.copy.readLess;

    const clickUntilExpanded = () => {
      const box = this.findAboutBox$();
      if (box.find(`button[title="${readLess}"]`).length) {
        return;
      }
      const button = box.find(`button[title="${readMore}"]`).get(0);
      if (button) {
        button.click();
      }
    };

    clickUntilExpanded();
    this.getAboutBox().should(($el) => {
      if (!$el.find(`button[title="${readLess}"]`).length) {
        clickUntilExpanded();
      }
      expect(
        $el.find(`button[title="${readLess}"]`).length,
        `About content on ${this.pageLabel} (${currentDevice()}) should expand after Read More`
      ).to.be.gte(1);
    });
  }

  verifyReadLessNotShownBeforeExpanding() {
    this.scrollToAbout();
    this.getReadLessButton().should('not.exist');
  }

  collapseReadLess() {
    const readMore = this.copy.readMore;
    const readLess = this.copy.readLess;

    const clickUntilCollapsed = () => {
      const box = this.findAboutBox$();
      if (box.find(`button[title="${readMore}"]`).length) {
        return;
      }
      const button = box.find(`button[title="${readLess}"]`).get(0);
      if (button) {
        button.click();
      }
    };

    clickUntilCollapsed();
    this.getAboutBox().should(($el) => {
      if (!$el.find(`button[title="${readMore}"]`).length) {
        clickUntilCollapsed();
      }
      expect(
        $el.find(`button[title="${readMore}"]`).length,
        `About content on ${this.pageLabel} (${currentDevice()}) should collapse after Read Less`
      ).to.be.gte(1);
    });
  }

  verifyFaqHeadingAndQuestions() {
    cy.contains(exactText(this.page.faqHeading), { timeout: 20000 })
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('be.visible');
    (this.page.faqQuestions || []).forEach((question) => {
      cy.contains('h3', exactText(question), { timeout: 20000 }).should('exist');
    });
  }

  /**
   * Tyres FAQs have no #truckFaq / #faqSection id (live capture). The
   * heading sits in `.headingbar`; the three `.accordion` items are in
   * that bar's parent. Toggle is a chevron (`alt="Chevron Icon"`);
   * open = answer loses `hidden` and the chevron gets `rotate-180`.
   */
  getFaqRootEl(doc) {
    const heading = [...doc.querySelectorAll('h1, h2, h3, h4')].find((el) =>
      exactText(this.page.faqHeading).test(el.textContent || '')
    );
    if (!heading) {
      return null;
    }
    const bar = heading.closest('.headingbar');
    return (bar && bar.parentElement) || heading.parentElement;
  }

  expandFaqQuestion() {
    cy.contains('h2, h3', exactText(this.page.faqHeading), { timeout: 20000 }).scrollIntoView({
      offset: { top: -STICKY_HEADER_OFFSET, left: 0 },
    });

    cy.document().then((doc) => {
      const getAcc = () => {
        const root = this.getFaqRootEl(doc);
        if (!root) {
          return null;
        }
        return root.querySelectorAll('.accordion')[1] || root.querySelectorAll('.accordion')[0];
      };
      const isOpen = () => {
        const acc = getAcc();
        if (!acc) {
          return false;
        }
        const answer = acc.lastElementChild;
        const img = acc.querySelector('img');
        const imgClass = (img && img.className) || '';
        return Boolean(answer && !answer.classList.contains('hidden')) || /rotate-180/.test(imgClass);
      };
      let lastClickAt = 0;
      const clickTrigger = () => {
        const now = Date.now();
        if (now - lastClickAt < 1000) {
          return;
        }
        const acc = getAcc();
        if (!acc) {
          return;
        }
        const trigger =
          acc.querySelector('img[alt="Chevron Icon"]') ||
          acc.querySelector('img[alt="Plus minus Icon"]') ||
          acc.querySelector('.cursor-pointer') ||
          acc.querySelector('h3');
        if (!trigger) {
          return;
        }
        ['mousedown', 'mouseup', 'click'].forEach((type) => {
          trigger.dispatchEvent(
            new MouseEvent(type, { bubbles: true, cancelable: true, view: doc.defaultView })
          );
        });
        lastClickAt = now;
      };

      expect(getAcc(), `FAQ question on ${this.pageLabel} is present`).to.exist;
      clickTrigger();
      cy.wrap(null, { timeout: 15000 }).should(() => {
        if (!isOpen()) {
          clickTrigger();
        }
        expect(
          isOpen(),
          `An FAQ answer should be shown on ${this.pageLabel} after opening a question`
        ).to.eq(true);
      });
    });
  }
}

module.exports = TyresSeoContent;
