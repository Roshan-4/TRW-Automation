const tabbedModelOffersData = require('../../testData/UtilityPages/TabbedModelOffersData.json');
const truckInIndiaData = require('../../testData/HomePage/TruckInIndiaData.json');
const { LeadFormFiller, exactText, makeThrottledCtaClicker } = require('../../helpers/leadFormFiller');

/**
 * Pages built around a "Popular Models by <Application/Category>" tab strip
 * (Select Your Truck's application tabs, Offers' vehicle-category tabs):
 * clicking a tab swaps the model cards shown below it, and every card's
 * "Check Offers" button opens the same shared CheckOffersLead modal already
 * used across the rest of the site. Live-audited: the modal's fields and
 * confirmation text behave normally here (no per-item-popup quirks like the
 * bus pages), so this reuses the standard `LeadFormFiller` config.
 *
 * Per request, the positive-submission test fills and submits one real lead
 * per tab (not just the first tab) to prove every tab's CTA genuinely opens
 * a working modal — the tab strip is real navigation, not decoration.
 */
class TabbedModelOffers {
  constructor(lang = 'en', pageKey) {
    this.lang = lang;
    const pages = tabbedModelOffersData.TabbedModelOffers[lang]?.pages || [];
    this.page = pages.find((p) => p.key === pageKey);
    if (!this.page) {
      throw new Error(`Unknown TabbedModelOffers page key: ${pageKey} for lang=${lang}`);
    }
    this.pageUrl = this.page.path;

    this.checkOffersLeadCopy =
      truckInIndiaData.CheckOffersForm[lang] || truckInIndiaData.CheckOffersForm.en;
    this.checkOffersLead = new LeadFormFiller({
      nameSelector: 'input#name[name="name"]',
      mobileSelector: 'input#phone[name="phone"]',
      cityPlaceholder: this.checkOffersLeadCopy.cityPlaceholder,
      submitText: this.checkOffersLeadCopy.submitCta,
      focusFieldsBeforeType: true,
      // Playwright capture of the open Check Offers modal:
      //   div[data-modal-open="true"] → input#name[name="name"]
      // `data-modal-open` is the stable open-state attribute; `#name` /
      // `#phone` are unique ids. Do not use Tailwind `max-w-[…]` or
      // placeholder text — those change.
      formRootFinder: () => cy.get('[data-modal-open="true"]'),
    });
  }

  static get supportedLanguages() {
    return Object.keys(tabbedModelOffersData.TabbedModelOffers);
  }

  static get pageKeys() {
    return tabbedModelOffersData.TabbedModelOffers.en.pages.map((p) => p.key);
  }

  get pageLabel() {
    return this.page.name;
  }

  get tabs() {
    return this.page.tabs;
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

  /** Click a tab button by its exact visible label; re-click until active. */
  selectTab(tabLabel) {
    cy.document().then((doc) => {
      const clickTab = () => {
        const btn = [...doc.querySelectorAll('button.tab-btn')].find(
          (el) => el.title === tabLabel && el.offsetParent !== null
        );
        if (btn) {
          btn.click();
        }
      };

      clickTab();
      cy.contains('button.tab-btn', exactText(tabLabel)).should(($btn) => {
        if (!/bg-\[#006db7\]|text-white/.test($btn.attr('class') || '')) {
          clickTab();
        }
        expect($btn.attr('class') || '', `"${tabLabel}" tab is active`).to.match(/text-white/);
      });
    });
  }

  /**
   * Scroll the page to a card's Check Offers button, then click it.
   * The modal is `position:fixed` (`[data-modal-open="true"]`) and already
   * centered — do not scroll again after it opens (that moves the page
   * under the overlay and Cypress misses the name field).
   */
  openLeadFormViaCta() {
    const ctaLabel = this.page.ctaLabel;
    cy.document().then((doc) => {
      const findCta = () =>
        [...doc.querySelectorAll('button')].find(
          (el) => el.textContent.trim() === ctaLabel && el.offsetParent !== null
        );

      const cta = findCta();
      expect(cta, `${ctaLabel} button is on the page`).to.exist;
      cta.scrollIntoView({ block: 'center' });

      const clickCta = makeThrottledCtaClicker(doc, ctaLabel);
      clickCta();
      cy.get('[data-modal-open="true"]')
        .should('be.visible')
        .find('input#name[name="name"]')
        .should(($input) => {
          if (!$input.is(':visible')) {
            clickCta();
          }
          expect($input.is(':visible'), `${ctaLabel} lead form is visible`).to.eq(true);
        });
    });
  }

  verifyLeadSubmitted() {
    cy.contains('h3', exactText(this.checkOffersLeadCopy.thankYouHeading)).should('be.visible');
  }

  /** One CheckOffersLead fill + submit for the currently active tab. */
  submitLeadForActiveTab(overrides = {}) {
    this.openLeadFormViaCta();
    this.checkOffersLead.fillAndSubmit({
      name: 'testqa',
      city: this.checkOffersLeadCopy.city,
      ...overrides,
    });
    this.verifyLeadSubmitted();
  }

  /**
   * Submit one real lead per tab, proving every tab's CTA genuinely works.
   * A successful submission swaps the form into a "you may also be
   * interested in" upsell screen with several interactive elements
   * (alternative-truck cards, a "Receive similar offers" button); live
   * testing found no reliably distinguishable close control there — one
   * attempt accidentally navigated to an unrelated truck's PDP page. Fresh
   * navigation between tabs sidesteps that screen entirely rather than
   * risking a wrong click on it.
   */
  submitLeadForEveryTab() {
    this.tabs.forEach((tabLabel, index) => {
      if (index > 0) {
        // A same-test re-visit doesn't reset storage the way a fresh test
        // does — without this, the previous tab's submitted name/state can
        // bleed into the next tab's fresh page load (observed live as a
        // duplicated "testqatestqa" name value).
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.window().then((win) => {
          win.sessionStorage.clear();
        });
        this.navigate();
      }
      this.selectTab(tabLabel);
      this.submitLeadForActiveTab();
    });
  }
}

module.exports = TabbedModelOffers;
