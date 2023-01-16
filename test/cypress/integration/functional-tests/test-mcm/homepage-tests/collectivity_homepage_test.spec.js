// https://gitlab-dev.cicd.moncomptemobilite.fr/mcm/platform/-/issues/418
describe("Collectivity homepage", function () {
	it("Test of the collectivity homepage", function () {
        cy.viewport(1440, 900); // Desktop mode
        cy.justVisit("WEBSITE_FQDN"); // Open website homepage
		cy.wait(10000);

        /* ==== Tabs Banner */
        cy.get('.nav-links__item--active > a').should('have.text', 'Citoyen.ne'); // Citizen tab
        cy.get('.nav-links > :nth-child(2) > a').should('have.text', 'Employeur'); // Enterprise tab
        cy.get('.nav-links > :nth-child(3) > a').should('have.text', 'Collectivité'); // Collectivity tab
        cy.get('.nav-links > :nth-child(4) > a').should('have.text', 'Opérateur de mobilité'); // MSP tab
        cy.get('.nav-links > :nth-child(3) > a').click(); // GOTO Collectivity tab
        cy.url().should("match", /collectivite/); // New page, new URL
        // TODO default citizen tab & mobile : tabs slide

        /* ==== Page title ==== */
        cy.get('.page-container > .mt-m').contains('Avec moB je peux promouvoir et gérer mes dispositifs d’aides à la mobilité durable à travers un guichet unique.'); // Text
        cy.get('#collectivite-contact > .button').should('have.text', 'Nous contacter');

        /* ==== Video Section ==== */
        cy.get('[data-testid="button"] > img').should('have.attr', 'src', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI0ZGRkZGRiIgY3g9IjUwIiBjeT0iNTAiIHI9IjUwIi8+PHBhdGggZD0iTTQ3IDQxLjZsMTIgOC4zODdMNDcgNTguNHoiIGZpbGw9IiMwMGE3NmUiLz48L2c+PC9zdmc+'); // Play icon TODO video plays onClick
        cy.viewport(365, 568); // Switch to mobile mode for responsive
        cy.get('[data-testid="button"] > img').should('have.attr', 'src', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI0ZGRkZGRiIgY3g9IjUwIiBjeT0iNTAiIHI9IjUwIi8+PHBhdGggZD0iTTQ3IDQxLjZsMTIgOC4zODdMNDcgNTguNHoiIGZpbGw9IiMwMGE3NmUiLz48L2c+PC9zdmc+'); // Play icon TODO mobile : video plays onClick & adapts to screen width
        cy.viewport(1440, 900); // Switch back to desktop mode for next step

        /* ==== Steps Section ==== */
        cy.get('.mcm-steps')
		  .should('have.class', 'mcm-steps') // Gray card
		  .should('have.text', 'Mon Compte Mobilité, comment ça marche ?Je me connecte à moB Mon Compte MobilitéJe gère les demandes d’aides de mes citoyensJe pilote ma politique de mobilité sur mon tableau de bord'); // Title & subs
        cy.get(':nth-child(2) > .step-img > img').should( // Image 1/3
            'have.attr',
            'src',            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODUiIGhlaWdodD0iODUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNNDIuODczIDYwLjkxMWMtNC43OTcgMC04Ljc1Ny0yLjYzNi05LjQ1LTYuMDdDMTguOTI3IDU3Ljk3MiA4LjIyNCA2OC40MTYgOCA4MC44OGg2OC45NzVjLS4yMi0xMi4yNTMtMTAuNTY1LTIyLjU1Ni0yNC42OS0yNS44NzQtLjc4MyAzLjM1NC00LjY5MiA1LjkwNi05LjQxMiA1LjkwNnoiIGZpbGw9IiM0NjRDRDAiLz48cGF0aCBkPSJNMjguNDg3IDE4LjM3OXMyLjkxNS04LjI5NSA1LjI4OC0xMC44NTFjMS44OTItMi4wNCA1LjA1MS0yLjM3NSA3Ljc2OC0xLjc4IDIuNzE3LjU5NiA1LjE5OCAxLjk1OSA3LjgyNyAyLjg2NyA0Ljc2MyAxLjY0NiA3LjYxNyAzLjI2NCAxMS42MTcgNS4yNjQtMiA2LTIuMzE1IDUuMTktNy41MzUgNi45NjgtMy41MDMgMS4xOTQtNy4zMTkuNjctMTEuMDIuNzM1LS44NDkuMDE0LTEuNzkzLjEwMy0yLjM2NS43My0uODUyLjkzNC0uNzMgMi4xMy0xLjU4IDMuMDY3LS41NTQuNjEtMS4yMDUuNzc5LTIgMS0xMy45OSAzLjg5OS04LTgtOC04IiBmaWxsPSIjMzYzNzU3Ii8+PHBhdGggZD0iTTYxLjc0NCAxMi41ODRjLTMuMTA0LTEuNTU3LTYuMTcyLTMuMTcyLTkuNDAyLTQuNDYtMS44MDUtLjcyLTMuNjQzLTEuMzM0LTUuNDM4LTIuMDgzLTEuNzI1LS43Mi0zLjQ3LTEuNDY3LTUuMzE4LTEuODExLTMuMDI3LS41NjMtNi40ODItLjE3NC04Ljc0NSAyLjEwOS0xLjY4NSAxLjctMi43MSA0LjExMi0zLjY1OCA2LjI2OWE3OC4xNzMgNzguMTczIDAgMDAtMi4wNyA1LjE4Yy0xLjQ4MyAzLjA1Ny0yLjU2OCA3Ljk1Ljk0MSAxMC4wMjIgMS4zNTUuNzk5IDMuMDI2LjkzNyA0LjU2My44MTUgMi4wOTEtLjE2NyA1LjA3MS0uNDkyIDYuNjg3LTEuOTUuNDc2LS40MjguODE1LS45NjQgMS4wNzYtMS41NDMuMjI1LS40OTguMzI1LTEuMzgxLjc0Ny0xLjc1OC40ODQtLjQzMyAxLjQwOC0uMjk3IDIuMDAxLS4yOTguOTMxLS4wMDEgMS44NjMuMDI4IDIuNzk0LjA0NyAzLjIwMy4wNjQgNi4wODMtLjI1NCA5LjEzNS0xLjIyNiAxLjYtLjUwOCAzLjQxOC0uODk0IDQuNjY4LTIuMDk0IDEuNDc4LTEuNDIgMi4wOC0zLjY1IDIuNzA4LTUuNTI1LjItLjU5MS0uMTI0LTEuNDExLS42ODktMS42OTRNNDEuOTM4IDcwLjQyMUw0MS45NiA3N2MuMDAyLjc4NC42ODggMS41MzYgMS41IDEuNS44MS0uMDM3IDEuNTAzLS42NiAxLjUtMS41LS4wMDctMi4xOTMtLjAxNS05LjM4Ni0uMDIyLTExLjU3OC0uMDAyLS43ODUtLjY4OC0xLjUzNy0xLjUtMS41LS44MS4wMzYtMS41MDIuNjYtMS41IDEuNSIgZmlsbD0iIzM2Mzc1NyIvPjxwYXRoIGQ9Ik00Ny44NzggMjcuNTcyYzEuOTMgMCAxLjkzNC0zIDAtMy0xLjkzMSAwLTEuOTM0IDMgMCAzIiBmaWxsPSIjMzYzNzU3Ii8+PHBhdGggZD0iTTU3Ljg0NSAxOS45MjVjLTMuNTQtMS41ODEtNi44OTctMy4wMy05LjkzMy01LjQ5NC0zLjE2LTIuNTY2LTYuNzQ2LTQuMzI4LTEwLjkzMi0zLjg0LTEuNzc1LjIwNy0zLjUzMS44MzctNC43NzIgMi4xNzgtMS4yMTEgMS4zMDktMS44MzUgMy4wMTgtMi4yODUgNC43MTMtLjQwMSAxLjUwNi0uNTk3IDMuMTMtMS4xOTYgNC41NzUtLjYzMiAxLjUyNC0yLjAwNyAxLjcwOS0zLjE3OCAyLjcwOS0yLjMxNiAxLjk3Ni0yLjAxNSA1LjA4NC0uMzkgNy4zOTUgMS4zNzUgMS45NTcgMy4zNzkgMy40MjggNS43NSAzLjY2OC4wMTkgNS42MjQuMDM4IDEzLjI0OC4wNTYgMTguODcuMDA1IDEuNDQ5IDIuMjU1IDEuNDUgMi4yNSAwLS4wMi02LjA2Mi0uMDQtMTQuMTI2LS4wNi0yMC4xOWExLjAyNyAxLjAyNyAwIDAwLS4zODQtLjgzMmMtLjIxNS0uNDQ3LS42NC0uNzktMS4yODMtLjc5OC0xLjA3MS0uMDE0LTEuMzQ1LS4yMi0yLjM1NC0uODU4LS41MDEtLjMxNy0xLjEwMy0uOTU0LTEuNTE3LTEuNTY2LS40MzItLjY0LS45LTEuNDgxLS43ODgtMi4yODcuMTQ2LTEuMDU3IDEuMTk3LTEuNDg3IDIuMDMyLTEuOTI2IDIuNTc4LTEuMzU0IDMuMDU1LTQuMjcgMy42NzYtNi44NTMuMzItMS4zMzEuNjItMi43NDggMS4zNjMtMy45Mi45NDUtMS40OTMgMi42MDMtMS45MzggNC4yODMtMS45NThhMTAuMjkgMTAuMjkgMCAwMTUuMTEyIDEuMjc3YzEuNjM4LjkwOCAyLjk4NiAyLjIzMiA0LjQ4MiAzLjM0MiAyLjU5NyAxLjkyOSA1LjYyNCAzLjA3NiA4LjU1NCA0LjM4NSAyLjU1IDEuMTQgNi40MyAyLjcxNyA3LjU2OSA1LjUyNC4yMjMuNTUuMzAzIDEuMjM1LjAzIDEuNzg3LS4zNS43MDctMS4xMS43ODMtMS44MTUuOS0xLjg1NC4zMS0zLjgyNS4zMTUtNS42NDUuNzgyLTEuNjQzLjQyMy0yLjQ5NyAxLjY2NS0yLjc0MyAzLjI4NC0uMzI4IDIuMTYyLS40MiA0LjM4Ni0uNTU2IDYuNTY3YTE3My4yMyAxNzMuMjMgMCAwMC0uMzA3IDEzLjYzNmMuMDMgMS45MjggMy4wMyAxLjkzNCAzIDBhMTczLjIzIDE3My4yMyAwIDAxLjMwNy0xMy42MzZjLjA3LTEuMTM1LjE1My0yLjI3LjI0Ny0zLjQwMi4wNzktLjk0Ny0uMDA4LTIuMTUyLjMyMy0zLjA0Ni4yOC0uNzU4IDEuNDc3LS42NiAyLjE4NC0uNzU1IDEuMDYzLS4xNDIgMi4xMjctLjI4MyAzLjE5LS40MjcgMS43NzItLjI0IDMuNDk0LS42OTMgNC40MDYtMi4zOS44MDktMS41MDIuNjk0LTMuMzExLS4wMy00LjgxNy0xLjU4LTMuMjktNS40ODQtNS4xODUtOC42NDYtNi41OTd6IiBmaWxsPSIjMzYzNzU3Ii8+PC9nPjwvc3ZnPgo='
        );
        cy.get(':nth-child(3) > .step-img > img').should( // Image 2/3
            'have.attr',
            'src',            'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iODVweCIgaGVpZ2h0PSI4NXB4IiB2aWV3Qm94PSIwIDAgODUgODUiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+SWxsdXMvQmlnL2lwYWQ8L3RpdGxlPgogICAgPGcgaWQ9IklsbHVzL0JpZy9pcGFkIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8cGF0aCBkPSJNMTguNjMxOSwxNS40ODc4IEMzNy4zMjQ5LDE1LjA5OTggNzQuNzYyOSwxNC4xMzM4IDc3LjI1ODksMTYuODUxOCBDNzkuMDQxOSwxOC43OTI4IDc4Ljg0NDksMjMuMjc5OCA3OS4wNDE5LDI1LjQ5NjggQzgwLjA2ODksMzcuMDA1OCA3OS4zNzc5LDQ5LjI5MjggNzkuNDAwOSw2MC45NDQ4IEM3OS40MDM5LDYyLjg4NjggNzkuMzA5OSw2NS42Mzg4IDc4LjQxNjksNjYuNjg3OCBDNzYuNzIyOSw2OC42Nzk4IDczLjc4NDksNjguNDQxOCA3MC4yMDU5LDY4LjU5ODggQzUwLjc0MzksNjkuNDU3OCAzMi4yMDU5LDY5LjY1NzggMTEuMDk5OSw2OS43OTY4IEM5LjE3MDksNjkuODA4OCA3LjY4NTksNjkuNzY1OCA2LjcwOTksNjcuODUyOCBDNi4xNDY5LDY2Ljc0NzggNi4wNjc5LDU2LjUwODggNi4wNTA5LDUxLjcwNjggQzYuMDE1OSw0Mi4wNTQ4IDUuODUxOSwzMy41Mzc4IDYuMzg3OSwyMy45MDA4IEM2LjQ5ODksMjEuOTA1OCA2LjQyMjksMTguNjI5OCA3Ljg5NTksMTcuMjc5OCBDMTAuMDI1OSwxNS4zMjU4IDEyLjE3NTksMTUuOTI0OCAxOC42MzE5LDE1LjQ4NzgiIGlkPSJGaWxsLTEiIGZpbGw9IiNGRkQzMTQiPjwvcGF0aD4KICAgICAgICA8cGF0aCBkPSJNNDIuNTM0MywxOS41Mzk1IEM0MS44ODQzLDE4Ljk4NTUgNDEuNTA1MywxOS4xMjQ1IDQxLjEyOTMsMTkuMTEzNSBDNDAuMzc4MywxOS4wOTA1IDM5Ljg5MzMsMTkuOTQ0NSAzOS45NDAzLDIwLjY5NDUgQzM5Ljk2OTMsMjEuMTUwNSA0MC4xNTUzLDIxLjYxMTUgNDAuNTEzMywyMS44OTY1IEM0MS4wOTczLDIyLjM2MDUgNDIuMDQyMywyMi4yMDU1IDQyLjUxMDMsMjEuNjI0NSBDNDIuOTc2MywyMS4wNDQ1IDQyLjk1ODMsMjAuMTUyNSA0Mi41MzQzLDE5LjUzOTUiIGlkPSJGaWxsLTQiIGZpbGw9IiMzNjM3NTciPjwvcGF0aD4KICAgICAgICA8cGF0aCBkPSJNMTUuMDEwOCwzNS40NjczIEMxOS44NTg4LDM1LjU3MzMgMjQuNzI4OCwzNS4zNjQzIDI5LjU3NDgsMzUuMjg2MyBDMzYuNjIxOCwzNS4xNzIzIDQzLjY2NzgsMzUuMDQ2MyA1MC43MTM4LDM0Ljk0ODMgQzUyLjY5NDgsMzQuOTIxMyA1NC42ODI4LDM0Ljg1NjMgNTYuNjYyOCwzNC45MDAzIEM1OC4xMTE4LDM0LjkzMTMgNTguMTExOCwzMi42ODEzIDU2LjY2MjgsMzIuNjUwMyBDNTEuODE1OCwzMi41NDMzIDQ2Ljk0NTgsMzIuNzUyMyA0Mi4wOTc4LDMyLjgzMDMgQzM1LjA1MTgsMzIuOTQ1MyAyOC4wMDU4LDMzLjA3MTMgMjAuOTU5OCwzMy4xNjgzIEMxOC45Nzg4LDMzLjE5NjMgMTYuOTkwOCwzMy4yNjAzIDE1LjAxMDgsMzMuMjE3MyBDMTMuNTYxOCwzMy4xODUzIDEzLjU2MjgsMzUuNDM1MyAxNS4wMTA4LDM1LjQ2NzMiIGlkPSJGaWxsLTYiIGZpbGw9IiMzNjM3NTciPjwvcGF0aD4KICAgICAgICA8cGF0aCBkPSJNMTUuMDEwOCw0Ny4xMTcyIEMxOS44NTg4LDQ3LjIyMzIgMjQuNzI4OCw0Ny4wMTQyIDI5LjU3NDgsNDYuOTM2MiBDMzYuNjIxOCw0Ni44MjIyIDQzLjY2NzgsNDYuNjk2MiA1MC43MTM4LDQ2LjU5ODIgQzUyLjY5NDgsNDYuNTcxMiA1NC42ODI4LDQ2LjUwNjIgNTYuNjYyOCw0Ni41NDkyIEM1OC4xMTE4LDQ2LjU4MTIgNTguMTExOCw0NC4zMzEyIDU2LjY2MjgsNDQuMjk5MiBDNTEuODE1OCw0NC4xOTMyIDQ2Ljk0NTgsNDQuNDAyMiA0Mi4wOTc4LDQ0LjQ4MDIgQzM1LjA1MTgsNDQuNTk1MiAyOC4wMDU4LDQ0LjcyMTIgMjAuOTU5OCw0NC44MTgyIEMxOC45Nzg4LDQ0Ljg0NjIgMTYuOTkwOCw0NC45MTAyIDE1LjAxMDgsNDQuODY3MiBDMTMuNTYxOCw0NC44MzUyIDEzLjU2MjgsNDcuMDg1MiAxNS4wMTA4LDQ3LjExNzIiIGlkPSJGaWxsLTgiIGZpbGw9IiMzNjM3NTciPjwvcGF0aD4KICAgICAgICA8cGF0aCBkPSJNMTUuMDEwOCw1OC43NjY2IEMxOS44NTg4LDU4Ljg3MzYgMjQuNzI4OCw1OC42NjM2IDI5LjU3NDgsNTguNTg1NiBDMzYuNjIxOCw1OC40NzE2IDQzLjY2NzgsNTguMzQ1NiA1MC43MTM4LDU4LjI0NzYgQzUyLjY5NDgsNTguMjIwNiA1NC42ODI4LDU4LjE1NTYgNTYuNjYyOCw1OC4xOTk2IEM1OC4xMTE4LDU4LjIzMDYgNTguMTExOCw1NS45ODA2IDU2LjY2MjgsNTUuOTQ5NiBDNTEuODE1OCw1NS44NDI2IDQ2Ljk0NTgsNTYuMDUxNiA0Mi4wOTc4LDU2LjEzMDYgQzM1LjA1MTgsNTYuMjQ0NiAyOC4wMDU4LDU2LjM3MDYgMjAuOTU5OCw1Ni40Njc2IEMxOC45Nzg4LDU2LjQ5NTYgMTYuOTkwOCw1Ni41NjA2IDE1LjAxMDgsNTYuNTE2NiBDMTMuNTYxOCw1Ni40ODQ2IDEzLjU2MjgsNTguNzM0NiAxNS4wMTA4LDU4Ljc2NjYiIGlkPSJGaWxsLTEwIiBmaWxsPSIjMzYzNzU3Ij48L3BhdGg+CiAgICAgICAgPHBhdGggZD0iTTYzLjkxMjIsMzUuMTQyNiBDNjQuMzIwMiwzNS41MTM2IDY1LjExNDIsMzUuNjQwNiA2NS41MDMyLDM1LjE0MjYgQzY3LjE4MDIsMzIuOTk2NiA2OC44NTUyLDMwLjg1MDYgNzAuNTMyMiwyOC43MDQ2IEM3MC44OTMyLDI4LjI0MTYgNzEuMDE2MiwyNy41NTg2IDcwLjUzMjIsMjcuMTEyNiBDNzAuMTI4MiwyNi43NDI2IDY5LjMyNzIsMjYuNjE3NiA2OC45NDAyLDI3LjExMjYgQzY3LjUxMDIsMjguOTQ1NiA2Ni4wNzgyLDMwLjc3ODYgNjQuNjQ3MiwzMi42MTA2IEM2NC41NzUyLDMyLjUwNjYgNjQuNTAzMiwzMi40MDI2IDY0LjQzNjIsMzIuMjk0NiBDNjQuMjgyMiwzMi4wNDQ2IDY0LjE0NDIsMzEuNzg0NiA2NC4wMjQyLDMxLjUxNjYgQzY0LjAwOTIsMzEuNDcyNiA2My45MjEyLDMxLjI1MzYgNjMuOTExMiwzMS4yMjU2IEM2My44NjEyLDMxLjA4MDYgNjMuODE3MiwzMC45MzU2IDYzLjc3NTIsMzAuNzg4NiBDNjMuNjE2MiwzMC4yMjI2IDYyLjk3MzIsMjkuODE0NiA2Mi4zOTEyLDMwLjAwMjYgQzYxLjgxNDIsMzAuMTg5NiA2MS40MzQyLDMwLjc4MDYgNjEuNjA2MiwzMS4zODY2IEM2Mi4wMTIyLDMyLjgyMTYgNjIuODA4MiwzNC4xMzg2IDYzLjkxMjIsMzUuMTQyNiIgaWQ9IkZpbGwtMTIiIGZpbGw9IiMzNjM3NTciPjwvcGF0aD4KICAgICAgICA8cGF0aCBkPSJNNjguOTQwNSwzOC43NjI3IEM2Ny41MDk1LDQwLjU5NTcgNjYuMDc4NSw0Mi40Mjg3IDY0LjY0NzUsNDQuMjYwNyBDNjQuNTc1NSw0NC4xNTY3IDY0LjUwMzUsNDQuMDUyNyA2NC40MzY1LDQzLjk0NDcgQzY0LjI4MjUsNDMuNjk0NyA2NC4xNDQ1LDQzLjQzMzcgNjQuMDI0NSw0My4xNjY3IEM2NC4wMDg1LDQzLjEyMTcgNjMuOTIwNSw0Mi45MDM3IDYzLjkxMTUsNDIuODc0NyBDNjMuODYxNSw0Mi43MzA3IDYzLjgxNzUsNDIuNTg1NyA2My43NzU1LDQyLjQzODcgQzYzLjYxNjUsNDEuODcyNyA2Mi45NzI1LDQxLjQ2NDcgNjIuMzkxNSw0MS42NTI3IEM2MS44MTQ1LDQxLjgzOTcgNjEuNDM0NSw0Mi40Mjk3IDYxLjYwNjUsNDMuMDM2NyBDNjIuMDExNSw0NC40NzE3IDYyLjgwNzUsNDUuNzg3NyA2My45MTI1LDQ2Ljc5MjcgQzY0LjMyMDUsNDcuMTYyNyA2NS4xMTQ1LDQ3LjI4OTcgNjUuNTAyNSw0Ni43OTI3IEM2Ny4xNzk1LDQ0LjY0NjcgNjguODU1NSw0Mi40OTk3IDcwLjUzMjUsNDAuMzUzNyBDNzAuODkzNSwzOS44OTA3IDcxLjAxNjUsMzkuMjA3NyA3MC41MzI1LDM4Ljc2MjcgQzcwLjEyNzUsMzguMzkxNyA2OS4zMjc1LDM4LjI2NzcgNjguOTQwNSwzOC43NjI3IiBpZD0iRmlsbC0xNCIgZmlsbD0iIzM2Mzc1NyI+PC9wYXRoPgogICAgICAgIDxwYXRoIGQ9Ik02OC45NDA1LDUwLjQxMjYgQzY3LjUwOTUsNTIuMjQ1NiA2Ni4wNzg1LDU0LjA3ODYgNjQuNjQ3NSw1NS45MTA2IEM2NC41NzU1LDU1LjgwNjYgNjQuNTAzNSw1NS43MDI2IDY0LjQzNjUsNTUuNTk0NiBDNjQuMjgyNSw1NS4zNDQ2IDY0LjE0NDUsNTUuMDgzNiA2NC4wMjQ1LDU0LjgxNjYgQzY0LjAwODUsNTQuNzcxNiA2My45MjA1LDU0LjU1MzYgNjMuOTExNSw1NC41MjQ2IEM2My44NjE1LDU0LjM4MDYgNjMuODE3NSw1NC4yMzQ2IDYzLjc3NTUsNTQuMDg4NiBDNjMuNjE2NSw1My41MjI2IDYyLjk3MjUsNTMuMTE0NiA2Mi4zOTE1LDUzLjMwMjYgQzYxLjgxNDUsNTMuNDg5NiA2MS40MzQ1LDU0LjA3OTYgNjEuNjA2NSw1NC42ODY2IEM2Mi4wMTE1LDU2LjEyMTYgNjIuODA3NSw1Ny40Mzc2IDYzLjkxMjUsNTguNDQyNiBDNjQuMzIwNSw1OC44MTI2IDY1LjExNDUsNTguOTM5NiA2NS41MDI1LDU4LjQ0MjYgQzY3LjE3OTUsNTYuMjk1NiA2OC44NTU1LDU0LjE0OTYgNzAuNTMyNSw1Mi4wMDM2IEM3MC44OTM1LDUxLjU0MDYgNzEuMDE2NSw1MC44NTc2IDcwLjUzMjUsNTAuNDEyNiBDNzAuMTI3NSw1MC4wNDE2IDY5LjMyNzUsNDkuOTE2NiA2OC45NDA1LDUwLjQxMjYiIGlkPSJGaWxsLTE2IiBmaWxsPSIjMzYzNzU3Ij48L3BhdGg+CiAgICA8L2c+Cjwvc3ZnPg=='
        );
        cy.get(':nth-child(4) > .step-img > img').should( // Image 3/3
            'have.attr',
            'src',            'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iODVweCIgaGVpZ2h0PSI4NXB4IiB2aWV3Qm94PSIwIDAgODUgODUiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+SWxsdXMvQmlnL0dyYXBoPC90aXRsZT4KICAgIDxnIGlkPSJJbGx1cy9CaWcvR3JhcGgiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxwYXRoIGQ9Ik0zMS40NzQ3OCwxNC4xMTEwOCBDMjMuMjAyNzgsMTMuMjQ3NTggMTcuMjc3MDgsMTcuODkzOTggMTIuMzcxMDgsMjQuMzg1MDggQzcuNDY1MDgsMzAuODc3MjggNS45NjkwOCwzOS41Mjk4OCA3LjY4MTc4LDQ3LjQ0OTg4IEM4LjMyNDE4LDUwLjQxNTQ4IDkuNDA0MzgsNTMuMzI2MDggMTEuMTUyMjgsNTUuODQxNzggQzE1Ljk0MTY4LDYyLjcyNzc4IDI1LjAyMTA4LDY1LjY1Mzc4IDMzLjU0MDU4LDY1LjkxMDA4IEM0MC43MTQ3OCw2Ni4xMjU2OCA0OC4zODA2OCw2NC41MzUwOCA1My4zNTA0OCw1OS41MzIyOCBDNTcuMzEwNDgsNTUuNTQ1ODggNTkuMDM2MzgsNDkuOTQ0NjggNjAuMDEwOTgsNDQuNDcxMDggQzYwLjcxMzg4LDQwLjUyNzU4IDYxLjA5MjI4LDM2LjQ0NDM4IDYwLjE3NDg4LDMyLjUzMjc4IEM1OC41NTEyOCwyNS42MDkzOCA1Mi45MTA0OCwxOS45Njc0OCA0Ni4yNjUzOCwxNy4wMDUxOCBDMzkuNjE5MTgsMTQuMDQzOTggMzkuNjE5MTgsMTQuMDQzOTggMzEuNDc0NzgsMTQuMTExMDgiIGlkPSJGaWxsLTEiIGZpbGw9IiMwMUJGN0QiPjwvcGF0aD4KICAgICAgICA8cGF0aCBkPSJNNTQuNSw2OSBDNTYuNzAxMzMsNzEuNDYwNjcgNTguNSw3My41IDY0LjUsNzkuNSBDNjYuMDAzNjY0LDgxLjAwMzY2NCA2OC4zNzUzNTU2LDc4Ljc3Nzk1NSA2Ni45MDEzLDc3LjI0MDYgQzU5LDY5IDYwLjk5MDkzLDcxLjM4NzE3IDUzLjUsNjIuNSBDNTIuMTYzMjMwMiw2MC45MTQwNjg3IDQ5Ljc3NzksNjIuNzg2MiA1MSw2NC41IEw1NC41LDY5IFoiIGlkPSJGaWxsLTYiIGZpbGw9IiMzNjM3NTciPjwvcGF0aD4KICAgICAgICA8cGF0aCBkPSJNMjQuMDE1NDYsMjQuNDYxMiBDMjcuNTc1MDYsMjQuNzA1NCAyOC4wNjg5NiwyNC4xMzAxIDMxLjYyODU2LDI0LjM3NDMgQzMwLjkwMzY2LDMzLjU3OCAzMS4yNDkwNiw0My43ODYgMzAuODUzMDYsNTMuNDA3NyBDMjkuMDIxNTYsNTMuNTkzNiAyNS42Mzc5Niw1My4zMjc0IDIzLjcyMDY2LDUzLjQwNzcgQzI0LjIxNjc2LDQzLjgyNzggMjMuMjY2MzYsMzMuODE3OCAyNC4wMTU0NiwyNC40NjEyIiBpZD0iRmlsbC04IiBmaWxsPSIjRkZEMzE0Ij48L3BhdGg+CiAgICAgICAgPHBhdGggZD0iTTMzLjg0NjcxLDMzLjgzMDU2IEMzNS4zODEyMSwzMy42ODg2NiAzNi45MjM0MSwzMy42MzI1NiAzOC40NjIzMSwzMy42NjMzNiBDMzguNzM0MDEsMzMuNjY4ODYgMzkuMDI1NTEsMzMuNjgzMTYgMzkuMjM4OTEsMzMuODUwMzYgQzM5LjU0MTQxLDM0LjA4NTc2IDM5LjU3MTExLDM0LjUyMjQ2IDM5LjU3NjYxLDM0LjkwNTI2IEMzOS42MzI3MSwzOS4zMDc0NiAzOS42Mjk0MSw0My43MTA3NiAzOS41NjU2MSw0OC4xMTQwNiBDMzkuNTQzNjEsNDkuNjk4MDYgMzkuMzgzMDEsNTMuMzIxNDYgMzkuMTQxMDEsNTMuNDc1NDYgQzM4Ljk0NDExLDUzLjYwMTk2IDM1Ljc4OTMxLDUzLjUwMDc2IDM0LjYwNDYxLDUzLjQwODM2IEMzNC4wNzk5MSw1My4zNjc2NiAzMy41NTc0MSw1My40MTgyNiAzMy4wODk5MSw1My4xNzczNiBMMzMuODQ2NzEsMzMuODMwNTYgWiIgaWQ9IkZpbGwtMTAiIGZpbGw9IiNGRkQzMTQiPjwvcGF0aD4KICAgICAgICA8cGF0aCBkPSJNNDEuNjQ5NzgsNDAuMDAyNDQgQzQyLjk4NjI4LDM5LjYxMzA0IDQ0LjI0Njg4LDM5LjkzNjQ0IDQ1LjY1NTk4LDM5LjgwNjY0IEM0NS44NzM3OCwzOS43ODY4NCA0Ni4xMTM1OCwzOS43NzM2NCA0Ni4yOTI4OCwzOS44ODAzNCBDNDYuNTMyNjgsNDAuMDIyMjQgNDYuNTU1NzgsNDAuMzA3MTQgNDYuNTU1NzgsNDAuNTUzNTQgQzQ2LjU0ODA4LDQ0LjU1MzE0IDQ2LjUzOTI4LDQ4LjU1MTY0IDQ2LjUzMTU4LDUyLjU1MTI0IEM0Ni41MzE1OCw1Mi44MzUwNCA0Ni41MDg0OCw1My4xNTk1NCA0Ni4yNDExOCw1My4zMzY2NCBDNDYuMDM2NTgsNTMuNDcxOTQgNDUuNzUxNjgsNTMuNDc0MTQgNDUuNDkyMDgsNTMuNDY5NzQgQzQ0LjQxODQ4LDUzLjQ1NDM0IDQyLjE1MDI4LDUzLjQ4NjI0IDQxLjA3NjY4LDUzLjQ3MDg0IEw0MS42NDk3OCw0MC4wMDI0NCBaIiBpZD0iRmlsbC0xMiIgZmlsbD0iI0ZGRDMxNCI+PC9wYXRoPgogICAgICAgIDxwYXRoIGQ9Ik02MC43NTM5NCwxNC40ODI3NyBDNjEuOTQwODQsMTIuMzM0NDcgNjMuMTI2NjQsMTAuMTg2MTcgNjQuMzEzNTQsOC4wMzc4NyBDNjQuNjQyNDQsNy40NDM4NyA2NC40Nzg1NCw2LjU5NTc3IDYzLjg0ODI0LDYuMjYzNTcgQzYzLjIzOTk0LDUuOTQxMjcgNjIuNDI1OTQsNi4wOTQxNyA2Mi4wNzUwNCw2LjcyODg3IEw1OC41MTQzNCwxMy4xNzM3NyBDNTguMTg2NTQsMTMuNzY3NzcgNTguMzQ5MzQsMTQuNjE1ODcgNTguOTc5NjQsMTQuOTQ4MDcgQzU5LjU4Nzk0LDE1LjI3MDM3IDYwLjQwMzA0LDE1LjExNzQ3IDYwLjc1Mzk0LDE0LjQ4Mjc3IiBpZD0iRmlsbC0xNCIgZmlsbD0iIzM2Mzc1NyI+PC9wYXRoPgogICAgICAgIDxwYXRoIGQ9Ik02Ny43MDI5NywxOS4zMzcxOCBDNjkuMzYzOTcsMTguMzQ0OTggNzEuMDI0OTcsMTcuMzUzODggNzIuNjgzNzcsMTYuMzYxNjggQzczLjI2Njc3LDE2LjAxNDA4IDczLjUzMTg3LDE1LjE4MDI4IDczLjE0OTA3LDE0LjU4NzM4IEM3Mi43NzE3NywxNC4wMDEwOCA3MS45OTg0NywxMy43NTAyOCA3MS4zNzU4NywxNC4xMjIwOCBDNjkuNzE0ODcsMTUuMTE0MjggNjguMDUzODcsMTYuMTA1MzggNjYuMzk1MDcsMTcuMDk3NTggQzY1LjgxMjA3LDE3LjQ0NjI4IDY1LjU0Njk3LDE4LjI4MDA4IDY1LjkyOTc3LDE4Ljg3MTg4IEM2Ni4zMDU5NywxOS40NTcwOCA2Ny4wODAzNywxOS43MDg5OCA2Ny43MDI5NywxOS4zMzcxOCIgaWQ9IkZpbGwtMTciIGZpbGw9IiMzNjM3NTciPjwvcGF0aD4KICAgICAgICA8cGF0aCBkPSJNNjcuOTE4OSwyNy41MzEzIEM3MC41ODQyLDI3Ljc2MzQgNzMuMjQ5NSwyNy45OTY2IDc1LjkxNDgsMjguMjI4NyBDNzYuNTkxMywyOC4yODgxIDc3LjI0MDMsMjcuNTkwNyA3Ny4yMTA2LDI2LjkzMTggQzc3LjE3NjUsMjYuMTc5NCA3Ni42Mzk3LDI1LjY5ODcgNzUuOTE0OCwyNS42MzQ5IEM3My4yNDk1LDI1LjQwMjggNzAuNTg0MiwyNS4xNzA3IDY3LjkxODksMjQuOTM4NiBDNjcuMjQxMywyNC44NzkyIDY2LjU5MjMsMjUuNTc2NiA2Ni42MjIsMjYuMjM0NCBDNjYuNjU2MSwyNi45ODc5IDY3LjE5MjksMjcuNDY3NSA2Ny45MTg5LDI3LjUzMTMiIGlkPSJGaWxsLTE5IiBmaWxsPSIjMzYzNzU3Ij48L3BhdGg+CiAgICA8L2c+Cjwvc3ZnPg=='
        );

		/* ==== Toolbox Section ==== */
		cy.get('.mcm-section-with-support--mac__image > .img-wrapper > .mcm-image.gatsby-image-wrapper > picture > img').should('have.attr', 'srcset', '/static/7dbc4a595f0dee946a877a9a28f025e1/fd013/support-mac.jpg 200w,\n/static/7dbc4a595f0dee946a877a9a28f025e1/25252/support-mac.jpg 400w,\n/static/7dbc4a595f0dee946a877a9a28f025e1/2f1b1/support-mac.jpg 800w,\n/static/7dbc4a595f0dee946a877a9a28f025e1/0ff54/support-mac.jpg 1200w,\n/static/7dbc4a595f0dee946a877a9a28f025e1/09428/support-mac.jpg 1449w'); // Image
		cy.get('.mcm-section-with-support--mac__body > .mb-m').should('have.text', 'moB met à disposition une plateforme de services pour gérer mes dispositifs d’incitations');
		cy.get('.mcm-ordered-list > :nth-child(1)')
		.should('have.class', 'mcm-ordered-list__item') // Bullet point 1/3
		.should('have.text', "Promouvoir mes aides pour encourager l'usage des mobilités durables"); // Text 1/3
		cy.get('.mcm-ordered-list > :nth-child(2)')
		.should('have.class', 'mcm-ordered-list__item') // Bullet point 2/3
		.should('have.text', 'Comprendre les déplacements des usagers et adapter ma politique d’aides selon leurs aspirations'); // Text 2/3
		cy.get('.mcm-ordered-list > :nth-child(3)')
		.should('have.class', 'mcm-ordered-list__item') // Bullet point 3/3
		.contains('Suivre et piloter mes dispositifs d’incitation par la mise à disposition d’indicateurs'); // Text 3/3
		cy.viewport(365, 568); // Switch to mobile mode for responsive
		cy.get('.mcm-section-with-support--mac__body > .mb-m').should('have.text', 'moB met à disposition une plateforme de services pour gérer mes dispositifs d’incitations');
		cy.get('.mcm-ordered-list > :nth-child(1)')
		.should('have.class', 'mcm-ordered-list__item') // Bullet point 1/3
		.should('have.text', "Promouvoir mes aides pour encourager l'usage des mobilités durables"); // Text 1/3
		cy.get('.mcm-ordered-list > :nth-child(2)')
		.should('have.class', 'mcm-ordered-list__item') // Bullet point 2/3
		.should('have.text', 'Comprendre les déplacements des usagers et adapter ma politique d’aides selon leurs aspirations'); // Text 2/3
		cy.get('.mcm-ordered-list > :nth-child(3)')
		.should('have.class', 'mcm-ordered-list__item') // Bullet point 3/3
		.contains('Suivre et piloter mes dispositifs d’incitation par la mise à disposition d’indicateurs'); // Text 3/3

		/* ==== moB banner Section ==== */
		cy.get('.mob-pattern__svg').should('be.visible');  // Logo image (mobile)
		cy.viewport(1440, 900); // Switch back to desktop mode for next step
		cy.get('.mob-pattern__svg').should('be.visible');  // Logo image (desktop)

		/* ==== Why join moB? Section ==== */
		cy.get('.mcm-section-with-image__image > .img-wrapper > .mcm-image > picture > img').should('have.attr', 'srcset', '/static/58caf28cdccd720d1d0983acb72c511e/fd013/dame-veste-corail.jpg 200w,\n/static/58caf28cdccd720d1d0983acb72c511e/25252/dame-veste-corail.jpg 400w,\n/static/58caf28cdccd720d1d0983acb72c511e/2f1b1/dame-veste-corail.jpg 800w,\n/static/58caf28cdccd720d1d0983acb72c511e/768f4/dame-veste-corail.jpg 1160w');// Image TODO right-aligned
		cy.get('h2.mb-s').should('have.text', 'Pourquoi rejoindre moB ?'); // Title
		cy.get('.mb-xs').should('have.text', 'En rejoignant moB j’intègre un écosystème constitué d’employeurs, d’opérateurs de la mobilité ainsi que d’autres Autorités Organisatrices de la Mobilité.'); // Text 1/2
		cy.get('p.mb-s').should('have.text', 'En me connectant avec les acteurs de la mobilité, j’ai la possibilité de créer des incitatifs adaptés pour les usagers et ainsi maximiser leur adoption.'); // Text
		cy.get('#collectivite-contact2 > .button')
		  .should('have.text', 'Nous contacter') // Button text
		  .click(); // Button text
		cy.url().should("match", /contact/); // Contact page
		cy.go(-1); // Go back to homepage
		cy.get('[href="/decouvrir-le-projet"] > .button')
		  .should('have.text', 'Découvrir le projet') // Button text
		  .should('have.class', 'button--secondary') // Different button style
		  .click(); // Redirect
		cy.url().should("match", /decouvrir-le-projet/); // Search page
		cy.go(-1); // Go back to homepage
		cy.get('.img-wrapper > .mcm-image > picture > img').should('have.attr', 'style', 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; object-fit: cover; object-position: center center; opacity: 1; transition: none 0s ease 0s;'); // TODO image right-aligned & other elements (title, text, button) left-aligned
		cy.viewport(365, 568); // Switch to mobile mode for responsive
		cy.get('.img-wrapper > .mcm-image > picture > img').should('have.attr', 'style', 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; object-fit: cover; object-position: center center; opacity: 1; transition: none 0s ease 0s;'); // TODO image right-aligned & other elements (title, text, button) left-aligned & ordered
		cy.viewport(1440, 900); // Switch back to desktop mode for next step

		/* ==== Partners Section ==== */
		cy.get('main.mcm-container__main > .mb-m').should('have.text', 'Tous nos partenaires'); // Title
		cy.get(':nth-child(1) > a > .mcm-image > picture > img').should('have.attr', 'srcset', '/static/a23bb028afc39085b9153e5f10b77489/8ac63/logo-ministere.png 200w,\n/static/a23bb028afc39085b9153e5f10b77489/37d5a/logo-ministere.png 300w'); // Image 1/7
		cy.get('.partner-list > :nth-child(1) > a')
          .should('have.attr', 'target', '_blank')
          .should('have.attr', 'href')
          .and('eq', ' https://www.gouvernement.fr/ministere-de-la-transition-ecologique-charge-des-transports') // TODO DEV remove blank ^^
          .then((href) => {
			  cy.request(href.trim()).its('status').should('eq', 200); // TODO remove trim
        });
		cy.get(':nth-child(2) > a > .mcm-image').should('have.attr', 'src', '/static/0a1183844844c732e6d2f1f748f5ddd8/logo-francemob.svg'); // Image 2/7
		cy.get('.partner-list > :nth-child(2) > a')
          .should('have.attr', 'target', '_blank')
          .should('have.attr', 'href')
          .and('eq', 'https://www.francemobilites.fr')
          .then((href) => {
			  cy.request(href).its('status').should('eq', 200);
        });
		cy.get(':nth-child(3) > a > .mcm-image > picture > img').should('have.attr', 'src', '/static/2ffe5b8f543e3351b0d4063f40713791/bc8e0/logo-fabmob.png'); // Image 3/7
		cy.get('.partner-list > :nth-child(3) > a')
          .should('have.attr', 'target', '_blank')
          .should('have.attr', 'href')
          .and('eq', 'http://lafabriquedesmobilites.fr/communs/mon-compte-mobilite/')
          .then((href) => {
			  cy.request(href).its('status').should('eq', 200);
        });
		cy.get(':nth-child(4) > a > .mcm-image > picture > img').should('have.attr', 'srcset', '/static/d47b24489ff8df5a19b3f9b74977a2ec/8ac63/logo-igart.png 200w,\n/static/d47b24489ff8df5a19b3f9b74977a2ec/ca83a/logo-igart.png 342w'); // Image 4/7
		cy.get('.partner-list > :nth-child(4) > a')
          .should('have.attr', 'target', '_blank')
          .should('have.attr', 'href')
          .and('eq', 'https://www.gart.org')
          .then((href) => {
			  cy.request(href).its('status').should('eq', 200);
        });
		cy.get(':nth-child(5) > a > .mcm-image').should('have.attr', 'src', '/static/23ad41fdd697ba45ef1dfa568671ae55/logo-ademe.svg'); // Image 5/7
		cy.get('.partner-list > :nth-child(5) > a')
          .should('have.attr', 'target', '_blank')
          .should('have.attr', 'href')
          .and('eq', 'https://www.ademe.fr')
          .then((href) => {
			  cy.request(href).its('status').should('eq', 200);
        });
		cy.get(':nth-child(6) > a > .mcm-image').should('have.attr', 'src', '/static/089f1ed33fee54b05556d02698f72f4e/logo-capgemini.svg'); // Image 6/7
		cy.get('.partner-list > :nth-child(6) > a')
          .should('have.attr', 'target', '_blank')
          .should('have.attr', 'href')
          .and('eq', 'https://www.capgemini.com/fr-fr/actualites/communiques-de-presse/premiere-experimentation-mon-compte-mobilite-avec-ile-de-france-mobilites-et-dans-agglomeration-mulhousienne/')
          .then((href) => {
			  cy.request(href).its('status').should('eq', 200);
        });
		cy.get(':nth-child(7) > a > .mcm-image > picture > img').should('have.attr', 'srcset', '/static/f906326c6cfd9c28f37ba0ed5f66fff0/8ac63/logo-certificats-%C3%A9conomies-%C3%A9nergie.png 200w,\n/static/f906326c6cfd9c28f37ba0ed5f66fff0/37d5a/logo-certificats-%C3%A9conomies-%C3%A9nergie.png 300w'); // Image 7/7
		cy.get('.partner-list > :nth-child(7) > a')
          .should('have.attr', 'target', '_blank')
          .should('have.attr', 'href')
          .and('eq', 'https://www.ecologie.gouv.fr/dispositif-des-certificats-deconomies-denergie')
          .then((href) => {
			  cy.request(href).its('status').should('eq', 200);
        });
    });
});