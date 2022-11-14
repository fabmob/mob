import faker from '@faker-js/faker';

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
  cy.get(':nth-child(1) > #mcm-select > .mcm-select__control > .mcm-select__value-container > .mcm-select__placeholder').click({ force: true });
  cy.get(':nth-child(1) > #mcm-select > .mcm-select__control > .mcm-select__value-container > .mcm-select__placeholder').click();
  cy.get('#react-select-4-option-1').click();
  cy.get('.mcm-select__single-value').should('have.text', user.status);
  /* ==== End Cypress Studio ==== */

  cy.get('input[name="lastName"]').type(user.lastName);
  cy.get('input[name="firstName"]').type(user.firstName);
  cy.get('input[name="birthdate"]').type(user.birthdate);
  cy.get('input[name="email"]').type(randomUserEmail);
  cy.get('input[name="password"]').type(user.password);
  cy.get('input[name="passwordConfirmation"]').type(user.passwordConfirmation);
  cy.get('input[name="city"]').type(user.city);
  cy.get('input[name="postcode"]').type(user.postcode);

  cy.get('input[id=companyNotFound]').check({ force: true });
  cy.get('input[id=hasNoEnterpriseEmail]').check({ force: true });

  cy.get('input[id=tos1]').check({ force: true });
  cy.get('input[id=tos2]').check({ force: true });
  cy.get('button[type="submit"]').click();
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
