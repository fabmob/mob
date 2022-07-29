// l'environnement de test est précisé dans la commande de lancement (... --env ENVIRONNEMENT=...)
describe("Smoke Test MOB", () => {
  context("Test des différentes urls du landscape master", () => {
    it("Test sur l'url IDP", () => {
      cy.assertApplicationIsLoaded("IDP_FQDN", '[class="welcome-header"]').then(
        () => {
          cy.checkRequest("IDP_FQDN");
        }
      );
    });
    it("Test sur l'url API", () => {
      cy.assertApplicationIsLoaded("API_FQDN", '[class="info"]').then(() => {
        cy.checkRequest("API_FQDN");
      });
    });
    // Err 404 puis redirection, puis atterissage sur website
    it("Test sur l'url Website", () => {
      cy.assertApplicationIsLoaded(
        "WEBSITE_FQDN",
        '[class="mcm-hero__actions"]'
      ).then(() => {
        cy.justVisit("WEBSITE_FQDN");
      });
    });
    it("Test sur l'url Admin", () => {
      cy.assertApplicationIsLoaded(
        "ADMIN_FQDN",
        '[class="login-pf-header"]'
      ).then(() => {
        cy.checkRequest("ADMIN_FQDN");
      });
    });
  });
});
