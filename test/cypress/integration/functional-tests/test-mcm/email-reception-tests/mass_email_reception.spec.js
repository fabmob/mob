import faker from '@faker-js/faker';

describe("Mass User Creation Test", () => {
    context("On souhaite repérer l'anomalie de non réception d'e-mail de bienvenue en effectuant une injection de masse d'utilisateurs", () => {
        it("Création d'une centaine d'utilisateurs à la chaîne", () => {
            const mockUserList = [];
            const i = 20;
            Cypress._.times(i, () => {
                const randomUserEmail = faker.internet.email('', '', 'capgemini.com');
                const user = {
                    email: randomUserEmail,
                    affiliation: {
                        enterpriseEmail: randomUserEmail
                    }
                }
                cy.injectUser(user);
                mockUserList.push(user);
            });
            cy.visit(`https://${Cypress.env("MAILHOG_FQDN")}`, {
                failOnStatusCode: false,
                redirectionLimit: 20,
            }).then(() => {
                cy.get(mockUserList).each((user) => {
                    cy.assertEmailReceptionMailHog(user.email.toLowerCase());
                });
            });
        });
    });
});