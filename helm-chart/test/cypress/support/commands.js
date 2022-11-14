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
