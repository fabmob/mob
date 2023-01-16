import faker from "@faker-js/faker";

/*
function checkRequest :
Cypress Command, sends a GET request, then checks response status is equal to 200.
Params :
 - app : idp / admin / website etc...
 - landscape : master, [branch name], etc..
 - ENVIRONNEMENT : prod, préprod, testing, etc...
*/
Cypress.Commands.add("checkRequest", (FQDN) => {
  cy.request({
    method: "GET",
    url: `https://${Cypress.env(FQDN)}`,
    failOnStatusCode: false,
    redirectionLimit: 20,
  }).should((response) => {
    expect(response.status).to.eq(200);
  });
});

/*
function checkRequestRedirect :
 * cy.request() sends request where type and url are configurable.
the function aims to check Website URL, which is slightly different than others URLs :
when requesting Website, the expected behaviour is to recieve a 404 status, then the page displays "keycloak is loading...", and redirects to Website homepage eventually
thus, this functions expects to get a 404 then to be redirected, then to get a 200.
*/
Cypress.Commands.add("checkRequestRedirect", (FQDN) => {
  cy.request({
    method: "GET",
    url: `https://${Cypress.env(FQDN)}`,
    failOnStatusCode: false,
    redirectionLimit: 20,
  }).should((response) => {
    expect(response.status).to.eq(404);
  });
  cy.on("url:redirection", () => {
    cy.should((response) => {
      expect(response.status).to.eq(200);
    });
  });
});

/*
fonction assertApplicationIsLoaded :
 * cy.visit() : goes to mentionned URL.
 * cy.get(assertionWitness).should("be.visible") : searchs for an element of the page called assertionWitness, and check it's available
the function asserts that the app is loaded, while checking the homepage is available.
*/
Cypress.Commands.add("assertApplicationIsLoaded", (FQDN, assertionWitness) => {
  cy.visit(`https://${Cypress.env(FQDN)}`, {
    failOnStatusCode: false,
    redirectionLimit: 20,
  });
  cy.get(assertionWitness, { timeout: 5000 }).should("be.visible");
});

/*
fonction justVisit :
 * cy.visit() : goes to mentionned URL.
the function asserts that the app is loaded, while checking the homepage is available.
*/
Cypress.Commands.add("justVisit", (FQDN) => {
  cy.visit(`https://${Cypress.env(FQDN)}`, {
    failOnStatusCode: false,
    redirectionLimit: 20,
  });
});

/*
Account creation function.
Fills each element of the register form and submits.
*/
Cypress.Commands.add("createUser", (user, randomUserEmail) => {
  // impossible to get the Select element "Statut professionnel", Cypress Studio solution :
  /* ==== Generated with Cypress Studio ==== */
  // cy.get('#mcm-select').click();
  // cy.wait(2000);
  // cy.contains('[gender="Mr"]').click();
  /* ==== End Cypress Studio ==== */

  cy.wait(10000);
  cy.get(
    ":nth-child(1) > .form__fields > :nth-child(1) > #mcm-select > .mcm-select__control > .mcm-select__value-container"
  ).click();
  cy.get("#react-select-5-option-1").click();
  cy.get("#lastName").type(user.lastName);
  cy.get("#firstName").type(user.firstName);
  cy.get(".react-date-picker__inputGroup__day").click();
  cy.get(".react-calendar__month-view__days > :nth-child(1) > abbr").click();
  cy.get(".react-date-picker__inputGroup__year").click();
  cy.get(".react-date-picker__inputGroup__day").clear();
  cy.get(".react-date-picker__inputGroup__day").type("28");
  cy.get(".react-date-picker__inputGroup__month").clear();
  cy.get(".react-date-picker__inputGroup__month").type("12");
  cy.get(".react-date-picker__inputGroup__year").clear();
  cy.get(".react-date-picker__inputGroup__year").type("1990");
  cy.get("#email").type(randomUserEmail);
  cy.get("#password").type(user.password);
  cy.get("#passwordConfirmation").type(user.passwordConfirmation);
  cy.get("#city").type(user.city);
  cy.get("#postcode").type(user.postcode);
  cy.get(':nth-child(1) > #mcm-select > .mcm-select__control > .mcm-select__value-container > .mcm-select__placeholder').click();
  cy.get('[id$=-option-0').click();
  cy.get("input[id=companyNotFound]").check({ force: true });
  cy.get("input[id=hasNoEnterpriseEmail]").check({ force: true });
  cy.get("input[id=tos1]").check({ force: true });
  cy.get("input[id=tos2]").check({ force: true });
  cy.get('button[type="submit"]').click();
  cy.wait(5000);
});

/*
Asserts the welcome email has been recieved and is in Mailhog
*/

Cypress.Commands.add('assertEmailReceptionMailHog', (userEmail) => {

  cy.get('.col-sm-4').contains(userEmail);
});

/*
User creation function: sends a POST request directly to API.
*/
Cypress.Commands.add('injectUser', (user) => {
  cy.request({
    url: `https://${Cypress.env("API_FQDN")}/v1/citizens`,
    method: 'POST',
    headers: {
      'X-API-KEY': `${Cypress.env("API_KEY")}`
    },
    body: {
      gender: faker.name.gender(true),
      email: user.email,
      firstName: faker.name.lastName(),
      lastName: faker.name.firstName(),
      id: "",
      password: "Jacq00illes!",
      birthdate: "1970-01-01",
      city: "Toulouse",
      postcode: "31000",
      status: "etudiant",
      tos1: true,
      tos2: true,
      affiliation: {
        enterpriseId: "",
        enterpriseEmail: user.affiliation.enterpriseEmail,
        affiliationStatus: "A_AFFILIER"
      }
    },
    failOnStatusCode: false
  }).then((res) => {
    expect(res.status).to.eq(200)
  });
});
