const popularTruckBrandsData = require('../../testData/HomePage/PopularTruckBrandsData.json');
const { currentDevice, itemsShownOnDevice } = require('../../helpers/deviceLayout');

const LANG_HOME_PATH = {
  en: '/',
  hi: '/hi',
  ta: '/ta',
};

const exactText = (text) =>
  new RegExp(`^\\s*${String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);

const STICKY_HEADER_OFFSET = 140;

/**
 * Homepage "Popular Truck Brands" section.
 * Locators from live DOM: h2 heading, brand cards a[title][href] + img + label,
 * nearby "View All Brands" → /{lang}/brands.
 */
class PopularTruckBrands {
  constructor(lang = 'en') {
    this.lang = lang;
    this.pageUrl = LANG_HOME_PATH[lang] || '/';
    this.copy = popularTruckBrandsData.PopularTruckBrands[lang];
  }

  static get supportedLanguages() {
    return Object.keys(popularTruckBrandsData.PopularTruckBrands);
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

  /** Brand grid wrapper under the section heading. */
  getSection() {
    return this.getHeading().closest('div.mb-3', { log: false });
  }

  /** Wider column that also holds View All Brands. */
  getSectionColumn() {
    return this.getHeading().closest('div.col-span-12', { log: false });
  }

  scrollToSection() {
    this.getHeading()
      .scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } })
      .should('exist');
  }

  /**
   * Brands this device actually renders (mobile omits the last 6 from the DOM).
   */
  get brandsShownOnThisDevice() {
    return itemsShownOnDevice(this.copy.brands, popularTruckBrandsData.visibleCountByDevice);
  }

  getBrandCards() {
    return this.getSection().find('a[title][href]', { log: false }).filter(':visible');
  }

  getBrandCardBySlug(slug) {
    return this.getSection().find(`a[href="/${this.lang}/${slug}"]`, { log: false });
  }

  getViewAllBrandsLink() {
    return this.getSectionColumn().find(`a[title="${this.copy.viewAll.label}"]`, { log: false });
  }

  expectedBrandPath(slug) {
    return `/${this.lang}/${slug}`;
  }

  verifySectionVisible() {
    this.scrollToSection();
    this.getHeading().should('be.visible').and('have.text', this.copy.heading);
    this.getSection().should('be.visible');
    this.getBrandCards().its('length').should('be.gte', 1);
  }

  verifyAllBrandCardsPresent() {
    this.scrollToSection();
    const shown = this.brandsShownOnThisDevice;
    shown.forEach((brand) => {
      this.getBrandCardBySlug(brand.slug)
        .should('be.visible')
        .and('have.attr', 'title', brand.title)
        .and('have.attr', 'href', this.expectedBrandPath(brand.slug))
        .within(() => {
          cy.get('img')
            .should('have.attr', 'alt', brand.title)
            .and('have.attr', 'src')
            .and('not.be.empty');
          cy.contains('p', exactText(brand.name)).should('be.visible');
        });
    });
    this.getBrandCards().should(($cards) => {
      expect(
        $cards.length,
        `Popular Truck Brands should show ${shown.length} brand cards on ${currentDevice()} (not the other device's count)`
      ).to.eq(shown.length);
    });
  }

  verifyNoDuplicateBrands() {
    this.scrollToSection();
    this.getBrandCards().then(($cards) => {
      const hrefs = [...$cards].map((el) => el.getAttribute('href'));
      const titles = [...$cards].map((el) => el.getAttribute('title'));
      const names = [...$cards].map((el) => (el.querySelector('p')?.textContent || '').trim());

      expect(hrefs, 'Brand card URLs should be unique').to.have.length(new Set(hrefs).size);
      expect(titles, 'Brand card titles should be unique').to.have.length(new Set(titles).size);
      expect(names, 'Brand names should be unique').to.have.length(new Set(names).size);
    });
  }

  verifyNoBrokenBrandLogos() {
    this.scrollToSection();
    this.getBrandCards().each(($card) => {
      const brandTitle = $card.attr('title') || 'brand';
      cy.wrap($card)
        .find('img')
        .should(($img) => {
          const img = $img[0];
          const src = $img.attr('src') || '';
          expect(src, `Logo for "${brandTitle}" should have an image URL`).to.have.length.greaterThan(0);
          expect(
            img.complete && img.naturalWidth > 0,
            `Logo for "${brandTitle}" should load (not broken)`
          ).to.eq(true);
        });
    });
  }

  /**
   * Click each popular brand card and confirm real navigation to that brand page.
   */
  verifyEachBrandCardNavigatesToBrandPage() {
    this.brandsShownOnThisDevice.forEach((brand, index) => {
      if (index > 0) {
        this.navigate();
      } else {
        this.scrollToSection();
      }

      cy.task(
        'log',
        `[PopularTruckBrands] Opening brand card "${brand.name}" → ${this.expectedBrandPath(brand.slug)}`,
        { log: false }
      );

      this.getBrandCardBySlug(brand.slug).should('be.visible').click({ force: true });
      cy.location('pathname').should((pathname) => {
        expect(
          pathname,
          `Clicking "${brand.name}" should open the brand page ${this.expectedBrandPath(brand.slug)}`
        ).to.eq(this.expectedBrandPath(brand.slug));
      });
    });
  }

  verifyViewAllBrandsNavigates() {
    this.scrollToSection();
    this.getViewAllBrandsLink()
      .should('be.visible')
      .and('have.attr', 'href', this.copy.viewAll.href)
      .and('have.attr', 'title', this.copy.viewAll.label);

    this.getViewAllBrandsLink().click({ force: true });
    cy.location('pathname').should((pathname) => {
      expect(
        pathname,
        `View All Brands should open ${this.copy.viewAll.href}`
      ).to.eq(this.copy.viewAll.href);
    });
  }
}

module.exports = PopularTruckBrands;
