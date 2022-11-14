import mockUser from '../../../../fixtures/mock_user.json'
import faker from '@faker-js/faker';
const randomUserEmail = faker.internet.email('','', 'capgemini.com');


describe("Nominal User Creation Test", () => {
  context("Test de création d'un utilisateur via website", () => {
    it("Remplissage du formulaire pour la création d'un utilisateur", () => {
      cy.visit(`https://${Cypress.env("WEBSITE_FQDN")}/inscription/formulaire`, {
        failOnStatusCode: false,
        redirectionLimit: 20,
      }).then(() => {
        cy.createUser(mockUser, randomUserEmail);
      });
    });

    it("Test de la réception de l'email de bienvenue", () => {
      cy.visit(`https://${Cypress.env("MAILHOG_FQDN")}`, {
        failOnStatusCode: false,
        redirectionLimit: 20,
      }).then(() => {
        cy.assertEmailReceptionMailHog(randomUserEmail.toLowerCase());
      });
    });
  });
})