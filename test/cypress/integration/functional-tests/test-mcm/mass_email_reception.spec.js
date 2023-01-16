import faker from '@faker-js/faker';

describe("Mass User Creation Test", () => {
    context("On souhaite repérer l'anomalie de non réception d'e-mail de bienvenue en effectuant une injection de masse d'utilisateurs", () => {
        const mockUserList = [];
        it.skip("Création d'une centaine d'utilisateurs à la chaîne", () => {
            Cypress._.times(50, () => {
                const randomUserEmail = faker.internet.email();
                const user = {
                    email: randomUserEmail,
                    affiliation: {
                        enterpriseEmail: randomUserEmail
                    }
                }
                cy.injectUser(user);
                mockUserList.push(user);
            });
        });
        it.skip("Confirmation des emails recus", () => {
            cy.visit(`https://${Cypress.env("MAILHOG_FQDN")}`, {
                failOnStatusCode: false,
                redirectionLimit: 20,
            }).then(() => {
                cy.get(mockUserList).each((user) => {
                    cy.assertEmailReceptionMailHog(user.email.toLowerCase());
                   ;
                });
            });
        });
    });
});