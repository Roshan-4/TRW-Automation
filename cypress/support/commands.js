const { randomNumberGenerator, resetRandomNumberGenerator } = require('../../helpers/randomNumberGenerator');

Cypress.Commands.add('randomNumberGenerator', () => cy.wrap(randomNumberGenerator(), { log: false }));

Cypress.Commands.add('resetRandomNumberGenerator', () => {
  resetRandomNumberGenerator();
  return cy.wrap(null, { log: false });
});
