const { randomNumberGenerator } = require('./randomNumberGenerator');

/**
 * Filler for the "Get Information" lead form shared by the vehicle-tool
 * pages (CV Permit, Vehicle Report, E Challan). Confirmed live to be one
 * shared backend component across all three — the real submit request always
 * hits an `.../vehicle-permit...` endpoint regardless of which page
 * triggered it. Distinct from `LeadFormFiller`'s CheckOffersLead/GetOffersLead
 * shapes: fields are matched by `name` attribute only (no `id`), phone is
 * `type="number"`, and the third field is a required truck-brand
 * autocomplete ("Choose Your Brand" floating label) rather than a city.
 *
 * This form only appears after its page's vehicle-registration-number
 * precondition is filled and the primary CTA (Check Permit Info / Check
 * Vehicle Report / Check Challan) is clicked — each page's `open*` method
 * handles that precondition before calling into this filler.
 */
class GetInformationLeadFiller {
  getNameInput() {
    return cy.get('input[name="name"]:visible');
  }

  getPhoneInput() {
    return cy.get('input[name="phone"]:visible');
  }

  getBrandInput() {
    return cy.contains('label', 'Choose Your Brand', { log: false }).parent().find('input');
  }

  getSubmitButton() {
    return cy.contains('button', 'Submit', { log: false });
  }

  fillAndSubmit({ name, mobile, brand = 'Tata' } = {}) {
    const resolvedMobile = mobile === undefined ? randomNumberGenerator() : mobile;

    this.getNameInput().should('be.visible').clear({ force: true }).type(String(name), { force: true });
    this.getPhoneInput()
      .should('be.visible')
      .clear({ force: true })
      .type(String(resolvedMobile), { force: true });

    this.getBrandInput().should('be.visible').clear({ force: true }).type(brand, { force: true });
    cy.contains('li, div', new RegExp(`^${brand}$`), { log: false })
      .should('be.visible')
      .click({ force: true });

    this.getSubmitButton().should('be.visible').click({ force: true });

    return resolvedMobile;
  }
}

module.exports = { GetInformationLeadFiller };
