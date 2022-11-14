const userName = "etudiant.mcm@yopmail.com";
const userPassword = Cypress.env("STUDENT_PASSWORD");
const websiteUrl = "https://" + Cypress.env("WEBSITE_FQDN")

describe("Subscription incentive tests unconnected", function () {
  it("test how to implement target blank", function () {
    // Chose the viewport of the navigator window
    cy.viewport(1536, 731);
    // Website Starting page here
    cy.justVisit("WEBSITE_FQDN");
    // Precise the route of the target element
    cy.get(
      "nav > .mcm-nav > .mcm-nav__desktop > .mcm-nav__item > #nav-recherche"
    ).click();
    // Waiting element
    cy.wait(2000);
    cy.get('.mcm-dispositifs').then($dispositifs => {
      if ($dispositifs.find("#aide-page-0 > div > div > h3", {
        timeout: 4000, //for exemple timeout if you need attente
      }).length > 0) {
        // Create a @tag for save a string and reuse it after
        cy.get("#aide-page-0 > div > div > h3").invoke("text").as("titleValue");
        // Methode to manage the target blank
        cy.get("#aide-page-0")
          .should("have.attr", "target", "_blank")
          .should("have.attr", "href")
          .and("include", "aide-page")
          .then((href) => {
            cy.visit(websiteUrl + href);
          });
        // Check if the url contain match regex
        cy.url().should("match", /aide-page/);
        // Reuse @tag text on a other page
        cy.get("@titleValue").then((value) => {
          cy.log(value);
          cy.get("h1").should("have.text", value);
        });
        // Go to page with the same methode
        cy.get("#subscriptions-incentive")
          .should("have.attr", "target", "_blank")
          .should("have.attr", "href")
          .and("include", "subscriptions")
          .then((href) => {
            cy.visit(websiteUrl + href);
          });
        // Conditionnig use case to test
        if (cy.url().should("match", /moncomptemobilite.fr/)) {
          cy.wait(2000);
          // 2 use case :
          cy.url().then(($url) => {
            // not connected
            cy.url().should(
              "match",
              /moncomptemobilite\.fr\/auth\/realms\/mcm\/protocol\/openid-connect/
            );
            cy.get(
              "#kc-form-wrapper > #mcm-login > #kc-form-login > .form-group > #username"
            ).type(userName);
            cy.get(
              "#kc-form-wrapper > #mcm-login > #kc-form-login > .form-group > #password"
            ).type(userPassword);
            cy.get(
              "#mcm-login > #kc-form-login > .kc-inputs-form > .checkbox > label"
            ).click();
            cy.get(
              "#mcm-login > #kc-form-login > .kc-inputs-form > #kc-form-buttons > #kc-login"
            ).click();
            cy.url().should(
              "match",
              /moncomptemobilite\.fr\/subscriptions\/new\/\?incentiveId=/
            );
            cy.wait(2000);
            cy.get(".field > #mcm-select").click();
            cy.get("#react-select-2-option-0").click();
            cy.get(
              "div > .mcm-demande__fields-section > .check-tos > .checkbox-radio > #consent"
            ).check({ force: true });
            cy.get(
              ".mcm-container > .mcm-container__main > .mcm-subscription > .mt-m > .button"
            ).click();
            cy.get(
              ".mcm-container > .mcm-container__main > .mcm-subscription > .mt-m > .button"
            ).click();
            cy.get(
              ".mcm-container > .mcm-container__main > .mcm-subscription > .mt-m > .button"
            ).click();
            cy.get("#toast-mcm > div > div > div").should(
              "contain",
              "Votre souscription à l'aide Covoiturez à Simulation maas a bien été enregistrée auprès de nos services"
            );
          });
        }
      } else {
        // TODO : write something else
        cy.should((response) => {
          expect(response.status).to.eq(200);
        });
      }
    });
  });
});

describe("Subscription incentive tests already connected", function () {
  it("test how to implement target blank", function () {
    // Chose the viewport of the navigator window
    cy.viewport(1536, 731);
    // Website Starting page here
    cy.justVisit("WEBSITE_FQDN");
    cy.get(
      "nav > .mcm-nav > .mcm-nav__list > .mcm-nav__item > #nav-login2"
    ).click();
    cy.url().should(
      "match",
      /moncomptemobilite\.fr\/auth\/realms\/mcm\/protocol\/openid-connect/
    );
    cy.get(
      "#kc-form-wrapper > #mcm-login > #kc-form-login > .form-group > #username"
    ).type(userName);
    cy.get(
      "#kc-form-wrapper > #mcm-login > #kc-form-login > .form-group > #password"
    ).type(userPassword);
    cy.get(
      "#mcm-login > #kc-form-login > .kc-inputs-form > .checkbox > label"
    ).click();
    cy.get(
      "#mcm-login > #kc-form-login > .kc-inputs-form > #kc-form-buttons > #kc-login"
    ).click();
    cy.url().should("match", /moncomptemobilite.fr\/mon-profil/);
    cy.get(
      "nav > .mcm-nav > .mcm-nav__desktop > .mcm-nav__item > #nav-recherche"
    ).click();
    // Waiting element
    if (
      cy.get("#aide-page-0 > div > div > h3", {
        timeout: 3000, //for exemple timeout if you need attente
      })
        .should("be.visible")
    ) {
      cy.get("#aide-page-0 > div > div > h3").invoke("text").as("titleValue");
      cy.get("#aide-page-0")
        .should("have.attr", "target", "_blank")
        .should("have.attr", "href")
        .and("include", "aide-page")
        .then((href) => {
          cy.visit(websiteUrl + href);
        });
      cy.url().should("match", /aide-page/);
      cy.get("@titleValue").then((value) => {
        cy.log(value);
        cy.get("h1").should("have.text", value);
      });
      cy.get("#subscriptions-incentive")
        .should("have.attr", "target", "_blank")
        .should("have.attr", "href")
        .and("include", "subscriptions")
        .then((href) => {
          cy.visit(websiteUrl + href);
        });
      if (cy.url().should("match", /moncomptemobilite.fr/)) {
        cy.wait(2000);
        cy.url().then(($url) => {
          cy.url().should("match", /subscriptions\/new/);
          cy.get(".field > #mcm-select").click();
          cy.get("#react-select-2-option-0").click();
          cy.get(
            "div > .mcm-demande__fields-section > .check-tos > .checkbox-radio > #consent"
          ).check({ force: true });
          cy.get(
            ".mcm-container > .mcm-container__main > .mcm-subscription > .mt-m > .button"
          ).click();
          cy.get(
            ".mcm-container > .mcm-container__main > .mcm-subscription > .mt-m > .button"
          ).click();
          cy.get(
            ".mcm-container > .mcm-container__main > .mcm-subscription > .mt-m > .button"
          ).click();
          cy.get("#toast-mcm > div > div > div").should(
            "contain",
            "Votre souscription à l'aide Covoiturez à Simulation maas a bien été enregistrée auprès de nos services"
          );
          cy.get("#nav-logout2").click({ force: true });

          cy.visit(`${websiteUrl}/mon-profil/#`);
        });
      } else {
        // do something else
        cy.should((response) => {
          expect(response.status).to.eq(200);
        });
      }
    }
  });
});
