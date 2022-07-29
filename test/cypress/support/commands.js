import faker from '@faker-js/faker';

/*
function checkRequest :
Commande Cypress effectuant une requête GET, puis vérifiant que le statut de réponse est bien 200.
Paramètres :
 - app : idp / admin / website etc...
 - landscape : master, [nom branche], etc..
 - ENVIRONNEMENT : prod, préprod, testing, etc... paramétré via la commande de lancement de cypress (voir "smoke_tests_script" dans .gitlab-ci.yml)
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
function checkWebsite :
 * cy.request() effectue une requete dont le type et l'url sont paramétrables.
la fonction est prévue pour la vérification de l'url website, qui diffère un peu de celle des autres :
lorsque l'on requete l'url website la réponse est un statut 404, alors que la page affiche "keycloak is loading..."
puis une redirection automatique est effectuée atterissant sur la page d'accueil de website.
la fonction certifie donc que, lors d'une requête sur l'url website, on a bien une réponse de statut 404, puis une redirection, pour enfin obtenir un statut 200.
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
 * cy.visit() : se rend sur l'url placé en paramètres.
 * cy.get(assertionWitness).should("be.visible") : cherche un élément de la page appelé assertionWitness, et vérifie qu'il est bien accessible
la fonction certifie que l'application est bien chargée, en vérifiant que la page d'accueil est accessible.
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
 * cy.visit() : se rend sur l'url placé en paramètres.
la fonction certifie que l'application est bien chargée, en vérifiant que la page d'accueil est accessible.
*/
Cypress.Commands.add("justVisit", (FQDN) => {
  cy.visit(`https://${Cypress.env(FQDN)}`, {
    failOnStatusCode: false,
    redirectionLimit: 20,
  });
});

/*
fonction Création de compte.
Remplissage de chaque élement du formulaire d'inscription un à un et soumission du formulaire.
*/

Cypress.Commands.add("createUser", (user, randomUserEmail) => {
  // impossible d'attrapper le Select de Statut professionnel, Cypress Studio solution :
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
fonction de vérification de la réception de l'email de bienvenue après inscription
Confirmation de la présence de l'email de l'utilisateur créé comme preuve, dans la boite de réception de MH.
*/

Cypress.Commands.add('assertEmailReceptionMailHog', (userEmail) => {
  cy.get('.col-sm-4').contains(userEmail);
});

/*
fonction de création d'utilisateur directement via api
*/

Cypress.Commands.add('injectUser', (user) => {
  cy.request({
    url: `https://${Cypress.env("API_FQDN")}/v1/citizens`,
    method: 'POST',
    headers: {
      'X-API-KEY': ' 827e60ca-0421-4e8c-803c-1252f9c8145c'
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
