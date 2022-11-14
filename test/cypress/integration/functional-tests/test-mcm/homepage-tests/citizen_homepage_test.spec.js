// https://gitlab-dev.cicd.moncomptemobilite.fr/mcm/platform/-/issues/287
describe("Citizen homepage", function () {
	it("Test of the citizen homepage", function () {
        cy.viewport(1440, 900); // Desktop mode
        cy.justVisit("WEBSITE_FQDN"); // Open website homepage

        /* ==== Tabs Banner */
        cy.get('.nav-links__item--active > a').should('have.text', 'Citoyen.ne'); // Citizen tab
        cy.get('.nav-links > :nth-child(2) > a').should('have.text', 'Employeur'); // Enterprise tab
        cy.get('.nav-links > :nth-child(3) > a').should('have.text', 'Collectivité'); // Collectivity tab
        cy.get('.nav-links > :nth-child(4) > a').should('have.text', 'Opérateur de mobilité'); // MSP tab
		// TODO default citizen tab & mobile : tabs slide

        /* ==== Video Section ==== */
        cy.get('.display__item').should('have.text', 'Découvrir moB'); // Button text TODO video plays onClick
        cy.viewport(365, 568); // Switch to mobile mode for responsive
        cy.get('.display__item').should('have.text', 'Découvrir moB'); // Button text TODO mobile : video plays onClick & adapts to screen width
        cy.viewport(1440, 900); // Switch back to desktop mode for next step

        /* ==== Steps Section ==== */
        cy.get('.mcm-steps')
		  .should('have.class', 'mcm-steps') // Gray card
          .should('have.text', 'Mon Compte Mobilité, comment ça marche ?Je crée Mon Compte Mobilité en quelques clicsJe souscris aux aides qui me correspondentJe finance tous mes trajets grâce à mes aides'); // Title & subs
        cy.get(':nth-child(2) > .step-img > img').should( // Image 1/3
            'have.attr',
            'src',      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODUiIGhlaWdodD0iODUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNNDIuODczIDYwLjkxMWMtNC43OTcgMC04Ljc1Ny0yLjYzNi05LjQ1LTYuMDdDMTguOTI3IDU3Ljk3MiA4LjIyNCA2OC40MTYgOCA4MC44OGg2OC45NzVjLS4yMi0xMi4yNTMtMTAuNTY1LTIyLjU1Ni0yNC42OS0yNS44NzQtLjc4MyAzLjM1NC00LjY5MiA1LjkwNi05LjQxMiA1LjkwNnoiIGZpbGw9IiNGRkQzMTQiLz48cGF0aCBkPSJNMjguNDg3IDE4LjM3OXMyLjkxNS04LjI5NSA1LjI4OC0xMC44NTFjMS44OTItMi4wNCA1LjA1MS0yLjM3NSA3Ljc2OC0xLjc4IDIuNzE3LjU5NiA1LjE5OCAxLjk1OSA3LjgyNyAyLjg2NyA0Ljc2MyAxLjY0NiA3LjYxNyAzLjI2NCAxMS42MTcgNS4yNjQtMiA2LTIuMzE1IDUuMTktNy41MzUgNi45NjgtMy41MDMgMS4xOTQtNy4zMTkuNjctMTEuMDIuNzM1LS44NDkuMDE0LTEuNzkzLjEwMy0yLjM2NS43My0uODUyLjkzNC0uNzMgMi4xMy0xLjU4IDMuMDY3LS41NTQuNjEtMS4yMDUuNzc5LTIgMS0xMy45OSAzLjg5OS04LTgtOC04IiBmaWxsPSIjMzYzNzU3Ii8+PHBhdGggZD0iTTYxLjc0NCAxMi41ODRjLTMuMTA0LTEuNTU3LTYuMTcyLTMuMTcyLTkuNDAyLTQuNDYtMS44MDUtLjcyLTMuNjQzLTEuMzM0LTUuNDM4LTIuMDgzLTEuNzI1LS43Mi0zLjQ3LTEuNDY3LTUuMzE4LTEuODExLTMuMDI3LS41NjMtNi40ODItLjE3NC04Ljc0NSAyLjEwOS0xLjY4NSAxLjctMi43MSA0LjExMi0zLjY1OCA2LjI2OWE3OC4xNzMgNzguMTczIDAgMDAtMi4wNyA1LjE4Yy0xLjQ4MyAzLjA1Ny0yLjU2OCA3Ljk1Ljk0MSAxMC4wMjIgMS4zNTUuNzk5IDMuMDI2LjkzNyA0LjU2My44MTUgMi4wOTEtLjE2NyA1LjA3MS0uNDkyIDYuNjg3LTEuOTUuNDc2LS40MjguODE1LS45NjQgMS4wNzYtMS41NDMuMjI1LS40OTguMzI1LTEuMzgxLjc0Ny0xLjc1OC40ODQtLjQzMyAxLjQwOC0uMjk3IDIuMDAxLS4yOTguOTMxLS4wMDEgMS44NjMuMDI4IDIuNzk0LjA0NyAzLjIwMy4wNjQgNi4wODMtLjI1NCA5LjEzNS0xLjIyNiAxLjYtLjUwOCAzLjQxOC0uODk0IDQuNjY4LTIuMDk0IDEuNDc4LTEuNDIgMi4wOC0zLjY1IDIuNzA4LTUuNTI1LjItLjU5MS0uMTI0LTEuNDExLS42ODktMS42OTRNNDEuOTM4IDcwLjQyMUw0MS45NiA3N2MuMDAyLjc4NC42ODggMS41MzYgMS41IDEuNS44MS0uMDM3IDEuNTAzLS42NiAxLjUtMS41LS4wMDctMi4xOTMtLjAxNS05LjM4Ni0uMDIyLTExLjU3OC0uMDAyLS43ODUtLjY4OC0xLjUzNy0xLjUtMS41LS44MS4wMzYtMS41MDIuNjYtMS41IDEuNSIgZmlsbD0iIzM2Mzc1NyIvPjxwYXRoIGQ9Ik00Ny44NzggMjcuNTcyYzEuOTMgMCAxLjkzNC0zIDAtMy0xLjkzMSAwLTEuOTM0IDMgMCAzIiBmaWxsPSIjMzYzNzU3Ii8+PHBhdGggZD0iTTU3Ljg0NSAxOS45MjVjLTMuNTQtMS41ODEtNi44OTctMy4wMy05LjkzMy01LjQ5NC0zLjE2LTIuNTY2LTYuNzQ2LTQuMzI4LTEwLjkzMi0zLjg0LTEuNzc1LjIwNy0zLjUzMS44MzctNC43NzIgMi4xNzgtMS4yMTEgMS4zMDktMS44MzUgMy4wMTgtMi4yODUgNC43MTMtLjQwMSAxLjUwNi0uNTk3IDMuMTMtMS4xOTYgNC41NzUtLjYzMiAxLjUyNC0yLjAwNyAxLjcwOS0zLjE3OCAyLjcwOS0yLjMxNiAxLjk3Ni0yLjAxNSA1LjA4NC0uMzkgNy4zOTUgMS4zNzUgMS45NTcgMy4zNzkgMy40MjggNS43NSAzLjY2OC4wMTkgNS42MjQuMDM4IDEzLjI0OC4wNTYgMTguODcuMDA1IDEuNDQ5IDIuMjU1IDEuNDUgMi4yNSAwLS4wMi02LjA2Mi0uMDQtMTQuMTI2LS4wNi0yMC4xOWExLjAyNyAxLjAyNyAwIDAwLS4zODQtLjgzMmMtLjIxNS0uNDQ3LS42NC0uNzktMS4yODMtLjc5OC0xLjA3MS0uMDE0LTEuMzQ1LS4yMi0yLjM1NC0uODU4LS41MDEtLjMxNy0xLjEwMy0uOTU0LTEuNTE3LTEuNTY2LS40MzItLjY0LS45LTEuNDgxLS43ODgtMi4yODcuMTQ2LTEuMDU3IDEuMTk3LTEuNDg3IDIuMDMyLTEuOTI2IDIuNTc4LTEuMzU0IDMuMDU1LTQuMjcgMy42NzYtNi44NTMuMzItMS4zMzEuNjItMi43NDggMS4zNjMtMy45Mi45NDUtMS40OTMgMi42MDMtMS45MzggNC4yODMtMS45NThhMTAuMjkgMTAuMjkgMCAwMTUuMTEyIDEuMjc3YzEuNjM4LjkwOCAyLjk4NiAyLjIzMiA0LjQ4MiAzLjM0MiAyLjU5NyAxLjkyOSA1LjYyNCAzLjA3NiA4LjU1NCA0LjM4NSAyLjU1IDEuMTQgNi40MyAyLjcxNyA3LjU2OSA1LjUyNC4yMjMuNTUuMzAzIDEuMjM1LjAzIDEuNzg3LS4zNS43MDctMS4xMS43ODMtMS44MTUuOS0xLjg1NC4zMS0zLjgyNS4zMTUtNS42NDUuNzgyLTEuNjQzLjQyMy0yLjQ5NyAxLjY2NS0yLjc0MyAzLjI4NC0uMzI4IDIuMTYyLS40MiA0LjM4Ni0uNTU2IDYuNTY3YTE3My4yMyAxNzMuMjMgMCAwMC0uMzA3IDEzLjYzNmMuMDMgMS45MjggMy4wMyAxLjkzNCAzIDBhMTczLjIzIDE3My4yMyAwIDAxLjMwNy0xMy42MzZjLjA3LTEuMTM1LjE1My0yLjI3LjI0Ny0zLjQwMi4wNzktLjk0Ny0uMDA4LTIuMTUyLjMyMy0zLjA0Ni4yOC0uNzU4IDEuNDc3LS42NiAyLjE4NC0uNzU1IDEuMDYzLS4xNDIgMi4xMjctLjI4MyAzLjE5LS40MjcgMS43NzItLjI0IDMuNDk0LS42OTMgNC40MDYtMi4zOS44MDktMS41MDIuNjk0LTMuMzExLS4wMy00LjgxNy0xLjU4LTMuMjktNS40ODQtNS4xODUtOC42NDYtNi41OTd6IiBmaWxsPSIjMzYzNzU3Ii8+PC9nPjwvc3ZnPgo='
        );
        cy.get(':nth-child(3) > .step-img > img').should( // Image 2/3
            'have.attr',
            'src',            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODUiIGhlaWdodD0iODUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNNTIuMDE1IDkuMzc3YzcuNDQ1LTUuMTcyIDEzLjkxIDMuMDQ3IDguNTg2IDEyLjQzOCA5LjE2LTEuMDM1IDE0LjY5NSAxMC45NTMgNS4wNCAxOC4wNDcgOS4xNjcgMi41NjIgOC4zMDggMTAuNjQxLjI1NyAxNS4zMjQgMS45NyAxMC43ODUtMTUuMDEyIDEwLjM2Ny0yMS41NyAzLjg1Mi0uODQ0LS44MzYtMy4zMjgtMS4xODgtNC40MjItLjU5LTQuOTMgMi42OTUtMTAuNTY2IDEuNDI2LTEzLjgwNS0zLjAyLTE0LjAwOC0xLjI0Ni04LjU5LTEwLjI3Ny00LjEwNi0xMi4yOTdDOS45MSA0MS42NzggOC4zMiAzMC40OTQgMTkuNzc3IDI3LjEwMWMtNC44MTctNS40ODUuNTQzLTExLjY2NSAxMy40OTEtMTEuNDMtMS4yODUtNC45NDIgOC43NjItMTcuMTc3IDE4Ljc0Ny02LjI5NHoiIGZpbGw9IiM0NjRDRDAiLz48cGF0aCBkPSJNNDcuMTA3IDQ5LjkzN2MzLjEzNi0zLjQxNyA3LjgyOC00Ljc3IDExLjI0OC03Ljg1NyAzLjQ4OC0zLjE1IDUuNTI2LTcuNjY2IDUuODA0LTEyLjMzMS4xMTUtMS45MjgtMi44ODYtMS45MjEtMyAwLS4yNSA0LjE5LTIuMzIzIDguMTg0LTUuNjE0IDEwLjc5Ni0yLjQ4NSAxLjk3Mi01LjQzMiAzLjIzNy03Ljk5NyA1LjA1OC4wNTgtLjU3OC4xMjgtMS4xNTMuMTY1LTEuNzM2LjIyNi0zLjYwNy4yNDYtNy4yNDMuMDczLTEwLjg1NiAzLjEzMi0yLjI1MSA1LjY2OC01LjI4NyA3LjE3My04Ljg1Mi4zMDQtLjcyMS4yNDEtMS42NDEtLjUzOS0yLjA1Mi0uNjQtLjM0LTEuNzI2LS4yMzQtMi4wNTIuNTM4YTE5LjcyNiAxOS43MjYgMCAwMS0xLjE4MiAyLjM1NyAxOS4xMTYgMTkuMTE2IDAgMDEtMS4wOCAxLjYzOGwtLjIwNC4yNy0uMDAzLjAwNWEyMC42MiAyMC42MiAwIDAxLTEuNzg4IDEuOTYzYy0uMTg2LjE4LS4zODQuMzQ3LS41NzguNTE4LS4zMy0zLjUzNC0uOTEzLTcuMDQzLTEuODgtMTAuNDYxLS41MjQtMS44NTUtMy40MTktMS4wNjYtMi44OTIuNzk3IDEuMzcyIDQuODU2IDEuOTUzIDkuODUzIDIuMDk0IDE0Ljg4OC4xMzggNC45ODguMDg2IDEwLjA5OS0uODE2IDE1LjAxOS0uNDAyIDIuMTk1LS44NjYgNC4zNS0xLjI3IDYuNTEzLTEuODk2LTIuNDU0LTQuNS00LjMyNi03LjEzLTUuOTUyLTMuMzYtMi4wNzctNy4xMi0zLjk1OC05LjU0My03LjE5Mi0uNDg1LS42NDctMS4yOTYtLjk4LTIuMDUyLS41MzgtLjYzOC4zNzMtMS4wMjcgMS40LS41MzggMi4wNTIgMi41MjcgMy4zNzQgNi4wNyA1LjUxOSA5LjYyNSA3LjY2MyAzLjMzMyAyLjAxIDYuNzQ1IDQuMjI1IDguNTMgNy44MTYuMTEyLjIyNi4yNTQuMzkzLjQxMy41MTVhMzkuOTQ3IDM5Ljk0NyAwIDAwLS4yODMgMy42NjljLS4xNDQgNS4wNjkuMTkxIDEwLjE2LjM3NCAxNS4yMjYuMDcgMS45MjUgMy4wNyAxLjkzNCAzIDAtLjI3NS03LjYzNC0uOTM1LTE1LjM2LjUxLTIyLjkwNS40NDEuMjQzLjk3MS4yNjcgMS40NzQuMDE4YTMyLjIgMzIuMiAwIDAxMS41MzYtLjcwMyAzMS44NSAzMS44NSAwIDAxMi44MjgtMS4wMTdjLjc1LS4yMjggMS4zMDItMS4wNiAxLjA0OC0xLjg0NS0uMjQ1LS43NTYtMS4wNC0xLjI5My0xLjg0NS0xLjA0N2EzMy4zOCAzMy4zOCAwIDAwLTQuNDcyIDEuNzM2Yy4yNDUtMS4xODUuNDgtMi4zNy42ODgtMy41NTUuMDYtLjA0OC4xMTgtLjA5NC4xNzUtLjE1NiIgZmlsbD0iIzM2Mzc1NyIvPjxwYXRoIGQ9Ik00Mi4xMzYgNDMuMzkyYy43NDMuMzIxIDEuNjEuMjIgMi4wNTItLjUzOC4zNzEtLjYzNC4yMS0xLjcyOS0uNTM4LTIuMDUyLTUuNjY0LTIuNDUyLTEwLjQ2OC02LjU3Ny0xMy42Ni0xMS44NjgtLjk5Ni0xLjY1MS0zLjU5MS0uMTQ1LTIuNTkgMS41MTQgMy40MzYgNS42OTYgOC42MjUgMTAuMyAxNC43MzYgMTIuOTQ0IiBmaWxsPSIjMzYzNzU3Ii8+PC9nPjwvc3ZnPg=='
        );
        cy.get(':nth-child(4) > .step-img > img').should( // Image 3/3
            'have.attr',
            'src',            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODUiIGhlaWdodD0iODUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxkZWZzPjxwYXRoIGlkPSJhIiBkPSJNMCAuMjM4aDY4LjJWNjVIMHoiLz48cGF0aCBpZD0iYyIgZD0iTS4xNDIuMjY3aDguMDcydjUuMDcySC4xNDJ6Ii8+PC9kZWZzPjxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNyAxMS4xMzQpIj48bWFzayBpZD0iYiIgZmlsbD0iI2ZmZiI+PHVzZSB4bGluazpocmVmPSIjYSIvPjwvbWFzaz48cGF0aCBkPSJNNjcuMTE3IDM5LjA5NUM2Mi4xNTcgNTYuOTUyIDQ4LjI3NyA2NSAyOS40MzcgNjUgOC4yNDMgNjUgMCA1My41MDggMCAzNC45NzRTMTMuNTQuMjM4IDM1LjMyNS4yMzhjMTguNTMzIDAgMzcuNjc5IDE3LjY2MiAzMS43OTIgMzguODU3IiBmaWxsPSIjMDFCRjdEIiBtYXNrPSJ1cmwoI2IpIi8+PC9nPjxwYXRoIGQ9Ik02MC4zMTggNDkuNjkxYy0uMDg2IDEuODk5LS40ODIgMy40OS0yLjI2NSA0LjQyNC0xLjY5NC44ODgtMy43ODcgMS4xMDEtNS42NjIgMS4yNjYtNy42ODcuNjc3LTE1LjUzNy41NDEtMjMuMjQyLjMxNi0yLjk5Mi0uMDg3LTguMDQuNTA2LTguMzc4LTMuNjA4LS4yMjQtMi43MTkuNDItNS4xNjkuNzE2LTcuOTM4LjItMi4xNDcuODMtNC4yMyAxLjYzMy02LjIyMy43MjUtMS44IDEuNTYzLTMuNjUyIDIuODM2LTUuMTM2IDEuMS0xLjI4MiAyLjQ3Mi0yLjM0IDQuMTI0LTIuNzgxIDIuMDg2LS41NTcgNC40MTktLjM0OSA2LjU1OC0uMzQ3IDQuNTg2LjAwNCA5LjE3Ni4xMjEgMTMuNzU0LjM4NyAxLjkwMy4xMTEgMy44NjUuMjkgNS4yMzQgMS43NzMgMS4yODUgMS4zOTIgMS44NCAzLjMwMyAyLjQyNSA1LjA1OSAxLjM3NyA0LjEzOSAyLjQ2NyA4LjQxMyAyLjI2NyAxMi44MDhtMi43NC0zLjg5OGMtLjI2Mi0yLjQ5NS0uODA4LTQuOTQ1LTEuNTE4LTcuMzQ5LTEuMjAyLTQuMDY5LTIuNTA3LTkuMDYxLTYuOTcyLTEwLjYxMy0yLjI1Ni0uNzg1LTQuODUxLS42ODYtNy4yMDUtLjc4OGEyNTIuNDMzIDI1Mi40MzMgMCAwMC03LjkyNi0uMjJjLTIuODc4LS4wMzQtNS44NjUtLjIxNS04LjcyMy4xNjktMi4zMTguMzEyLTQuMzY4IDEuMzY3LTYuMDQyIDIuOTk1LTEuNzUyIDEuNzA0LTIuODc4IDMuODMzLTMuODM3IDYuMDUyLTEuMTI4IDIuNjA5LTEuOTQyIDUuMjc0LTIuMjA2IDguMTEyLS4yOSAyLjY5Ni0uOTY1IDUuNTM1LS42OSA4LjI1OS4xNjcgMS42NTkuODU1IDMuMjQyIDIuMTQyIDQuMzQ1IDEuNTMgMS4zMTIgMy41NDIgMS41NjQgNS40ODQgMS42NjUgNC4zNTUuMjI4IDguNzI0LjI2NSAxMy4wODMuMjQ4IDQuNS0uMDE4IDkuMDM2LS4wMzggMTMuNTIzLS40MSA0LS4zMzEgOS4xNTYtMS4wNTggMTAuNTc2LTUuNDk2LjY5LTIuMTYyLjU0OC00Ljc0Ni4zMTItNi45NjkiIGZpbGw9IiMzNjM3NTciLz48cGF0aCBkPSJNNDIuNzgxIDI2Ljc3NGEzLjE1OSAzLjE1OSAwIDAxLS4zOTctLjFjLS4wMTItLjAwNS0uMDI0LS4wMTQtLjAzNy0uMDJ2LS4wMDJhMS45NDMgMS45NDMgMCAwMS0uMDUzLS4xOTkgNC41NCA0LjU0IDAgMDEuMDA1LS42OGwuMDE2LS4wODRjLjAxNi0uMDY2LjA0LS4xMjguMDYtLjE5Mi4wMi0uMDM1LjA0LS4wNzIuMDYyLS4xMDUuMDAyLS4wMDIuMDAzLS4wMDIuMDA1LS4wMDIuMDUyLS4wMTcuMTA0LS4wMzIuMTU3LS4wNDRsLjA2Ni4wMDJjLjEyLjAzMy4yMzguMDcuMzU0LjExNi4xNzEuMDc3LjMzNC4xNjYuNDkxLjI2Ny4wNDguMDQzLjA5NS4wOS4xNDEuMTM3bC4wMzcuMDZjMCAuMDMxIDAgLjA2My0uMDAyLjA5My0uMDM1LjE1LS4wOC4yOTYtLjEzNC40NGEzLjM4NyAzLjM4NyAwIDAxLS4xOC4zMyA0LjE1OCA0LjE1OCAwIDAxLS41OS0uMDE3bTMuNjMzLTEuNzRjLS4yNzUtLjc1OC0uNzgyLTEuMzM4LTEuNDUyLTEuNzc3LS4zMS0uMjA0LS42NjUtLjM0NS0xLjAwNy0uNDgtLjM3Mi0uMTQ4LS43NDUtLjI4NC0xLjE1My0uMjk0LS42NDMtLjAxNS0xLjM2Ni4xMjItMS45MDcuNDg2LS42ODcuNDYtMS4xNDUgMS4xNi0xLjMzOSAxLjk2LS4zMzcgMS41MTctLjEyIDMuMzI4IDEuMzI1IDQuMi42MS4zNjcgMS4zMjEuNDY2IDIuMDE2LjUxOC43OC4wNTkgMS41NTctLjA2OSAyLjE4OC0uNTU2LjYxNS0uNDc2LjkzNi0xLjEyNSAxLjIxNC0xLjgzMi4yNzEtLjY5LjM3Mi0xLjUxNS4xMTUtMi4yMjYiIGZpbGw9IiMzNjM3NTciLz48cGF0aCBkPSJNMzcuODM0IDI1LjQxM2wuMDYtLjAzN2guMDkzYy4xNS4wMzcuMjk2LjA4Mi40NC4xMzYuMTEzLjA1NC4yMjMuMTE0LjMyOS4xOC4wMDguMTk4LjAwNC4zOTQtLjAxNi41OWEzLjAzNSAzLjAzNSAwIDAxLS4xLjM5OGwtLjAyMS4wMzZoLS4wMDFhMi4yNCAyLjI0IDAgMDEtLjIuMDU0IDQuNTQgNC41NCAwIDAxLS42OC0uMDA1bC0uMDg0LS4wMTZjLS4wNjUtLjAxNi0uMTI4LS4wNC0uMTkyLS4wNmExLjk2OCAxLjk2OCAwIDAxLS4xMDUtLjA2M2wtLjAwMi0uMDA1YTEuMzggMS4zOCAwIDAxLS4wNDItLjE1NmMtLjAwMi0uMDIyIDAtLjA0NSAwLS4wNjdhMy44MyAzLjgzIDAgMDEuMTE2LS4zNTNjLjA3Ny0uMTcxLjE2Ni0uMzM0LjI2Ny0uNDkxLjA0NC0uMDUuMDktLjA5Ni4xMzgtLjE0MW0zLjIyMi0xLjQzNWMtLjQ3NS0uNjE1LTEuMTIzLS45MzYtMS44MzEtMS4yMTQtLjY5LS4yNzEtMS41MTYtLjM3Mi0yLjIyNi0uMTE1LS43NTcuMjc0LTEuMzM4Ljc4Mi0xLjc3NyAxLjQ1Mi0uMjAyLjMxLS4zNDQuNjY1LS40OCAxLjAwNi0uMTQ4LjM3My0uMjg0Ljc0Ni0uMjkzIDEuMTUzLS4wMTUuNjQ0LjEyIDEuMzY2LjQ4NSAxLjkwOC40Ni42ODcgMS4xNiAxLjE0NCAxLjk2IDEuMzM4IDEuNTE3LjMzNyAzLjMyOC4xMiA0LjItMS4zMjQuMzY4LS42MS40NjgtMS4zMjEuNTE5LTIuMDE3LjA1OC0uNzgtLjA3LTEuNTU2LS41NTctMi4xODdNNjAuMjg2IDUxLjUyOGMtLjM5NSAzLjg2NC01LjgzOSAzLjgxOC04Ljc3NiAzLjk4Ni03LjExOC40MS0xNC4yOS4zNzEtMjEuNDE2LjIyNC0xLjg1Mi0uMDM4LTMuNzIzLS4wMzgtNS41Ny0uMTktMS4zNTMtLjExMS0zLjAxNC0uNDQ3LTMuNTk4LTEuODU1LS4yNTYtLjYxNy0uMTk3LTEuMzczLS4xNjItMi4wMjQuMDIyLS40Mi4wNjUtLjc1Mi4wOS0uOTA3LjIyMy0xLjQyMi40NDctMi44MzkuNjMzLTQuMjY2LjM4Mi0zLjI4OCAyLjItNy4wODkgNC42NjgtOS4zMjYgMi45MjMtMi42NSA2LjgwNC0yLjMxIDEwLjQ4My0yLjMwNyA0LjE5Ny4wMDMgOC4zOTUuMDkyIDEyLjU4OC4yNjggMS44NDUuMDc2IDMuOTU0LS4wMSA1LjYyNC44OTkgMS42MTUuODggMi4zOTUgMi42MTEgMy4wNjMgNC4yMzMgMS40NTYgMy41MzggMi43NyA3LjM4MyAyLjM3MyAxMS4yNjVtMi43ODktMy41NDdjLS4yNzItMi4yODgtLjg5LTQuNS0xLjY5LTYuNjU3LTEuNDU5LTMuOTMzLTMuMTY0LTcuODMtNy43MjUtOC42OC0yLjI4OC0uNDI2LTQuNjc4LS4zOTItNi45OTctLjQ3YTMwNC4xMTIgMzA0LjExMiAwIDAwLTcuNDYtLjE1N2MtNC44MjItLjA0NC0xMC4xODctLjY3NS0xNC4yNDIgMi40NS0zLjU2MyAyLjc0Ni01LjgyMyA3LjYzNi02LjMzMyAxMi4wMy0uMzE4IDIuNDM4LTEuMjAzIDUuMjY5LS41MzMgNy43MTYgMS4wNDIgMy44MDggNS4yMTYgNC4xNzggOC41MDcgNC4yOSA4LjIwOS4yODMgMTYuNDg0LjMyNyAyNC42ODgtLjExNyAzLjU5Ny0uMTk1IDkuMTYzLS4zMzQgMTEuMTI1LTQuMDEgMS0xLjg3Mi45MDQtNC4zNDguNjYtNi4zOTRNNjUuNDY2IDE0LjE5OGMuNTEzLTEuOTggMS4wMjUtMi45NiAxLjUzOC00Ljk0LjEzLS41MDYtLjE2Ni0xLjExLS43LTEuMjMtLjUyLS4xMi0xLjA4OC4xNTYtMS4yMy42OTgtLjUxMSAxLjk4LTEuMDI0IDIuOTYtMS41MzcgNC45NC0uMTMxLjUwNi4xNjcgMS4xMDkuNjk5IDEuMjMuNTIyLjExOSAxLjA5LS4xNTYgMS4yMy0uNjk4TTY5Ljg4NCAxNi42MDdhMTMuMzkgMTMuMzkgMCAwMTEuNDY2LTEuNDhjLjEzNy0uMTIxLjI3Ni0uMjQuNDE3LS4zNTZsLjIyNS0uMTgzLjExMy0uMDlhMTIuNjYgMTIuNjYgMCAwMS44NDQtLjYwMmMuNDM2LS4yODguNjY0LS44OTUuMzU5LTEuMzY3LS4yOC0uNDM0LS45MDItLjY2OC0xLjM2OC0uMzYtMS4yNy44NDMtMi40OTMgMS44NS0zLjQ3IDMuMDI0LS4xNzQuMjA5LS4yOTMuNDI2LS4yOTMuNzA3IDAgLjI0NS4xMDkuNTM4LjI5My43MDcuMzY5LjMzOSAxLjA1Ny40MjkgMS40MTQgMCIgZmlsbD0iIzM2Mzc1NyIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDcwIDE2LjEzNCkiPjxtYXNrIGlkPSJkIiBmaWxsPSIjZmZmIj48dXNlIHhsaW5rOmhyZWY9IiNjIi8+PC9tYXNrPjxwYXRoIGQ9Ik0xLjY0IDUuMjE3YzIuOS0xLjQwMiAyLjgwNi0xLjkyNyA1Ljg4NC0yLjk2NCAxLjIxOC0uNDEuNjg5LTIuMzQ0LS41MzItMS45MjhDMy43MTIgMS40NCAzLjY4NiAyLjAxNC42MyAzLjQ5Yy0uNDg3LjIzNS0uNjE2LjkyOC0uMzU4IDEuMzY4LjI5LjQ5Ny44OC41OTUgMS4zNjcuMzU5IiBmaWxsPSIjMzYzNzU3IiBtYXNrPSJ1cmwoI2QpIi8+PC9nPjwvZz48L3N2Zz4='
        );

        /* ==== Search for an incentive Section ==== */
        cy.get('.mcm-section-with-image--image-left > .mcm-section-with-image__image > .img-wrapper > .mcm-image > picture > img').should( // Image
            'have.attr',
            'srcset',
            '/static/a121f1570b7b10709bf14f6a60b3b971/fd013/woman-yellow-coat.jpg 200w,\n/static/a121f1570b7b10709bf14f6a60b3b971/25252/woman-yellow-coat.jpg 400w,\n/static/a121f1570b7b10709bf14f6a60b3b971/2f1b1/woman-yellow-coat.jpg 800w,\n/static/a121f1570b7b10709bf14f6a60b3b971/0ff54/woman-yellow-coat.jpg 1200w,\n/static/a121f1570b7b10709bf14f6a60b3b971/06655/woman-yellow-coat.jpg 1600w,\n/static/a121f1570b7b10709bf14f6a60b3b971/7731d/woman-yellow-coat.jpg 1808w'
        );
        cy.get('.mcm-section-with-image--image-left > .mcm-section-with-image__body > h2.mb-s').should('have.text', 'Rechercher facilement des aides éco-responsables pour financer vos déplacements'); // Title
        cy.get('.mcm-section-with-image--image-left > .mcm-section-with-image__body > p.mb-s').should('have.text', 'Profitez de tous les avantages mis à disposition par votre collectivité ou votre entreprise pour des déplacements plus simples et plus durables au quotidien. MOB, c’est un compte unique et personnel qui rassemble tout ce dont vous avez besoin pour mieux vous déplacer et profiter de vos aides.'); // Text
        cy.get('.mcm-section-with-image--image-left > .mcm-section-with-image__body > a > .button')
		  .should('have.text', 'Rechercher une aide ') // Button text
          .click(); // Redirect
        cy.url().should("match", /recherche/); // Search page
        cy.go(-1); // Go back to homepage
		cy.get('.mcm-section-with-image--image-left > .mcm-section-with-image__image > .img-wrapper > .mcm-image > picture > img').should('have.attr', 'style', 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; object-fit: cover; object-position: center center; opacity: 1; transition: none 0s ease 0s;'); // TODO elements (image, title, text, button) left-aligned
        cy.viewport(365, 568); // Switch to mobile mode for responsive
		cy.get('.mcm-section-with-image--image-left > .mcm-section-with-image__image > .img-wrapper > .mcm-image > picture > img').should('have.attr', 'style', 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; object-fit: cover; object-position: center center; opacity: 1; transition: none 0s ease 0s;'); // TODO elements (image, title, text, button) left-aligned & ordered

        /* ==== moB banner Section ==== */
		cy.get('.mob-pattern__svg').should('be.visible');  // Logo image (mobile)
        cy.viewport(1440, 900); // Switch back to desktop mode for next step
		cy.get('.mob-pattern__svg').should('be.visible');  // Logo image (desktop)

        /* ==== Collaborative project Section ==== */
		cy.get(':nth-child(4) > .mcm-section-with-image__image > .img-wrapper > .mcm-image > picture > img').should( // Image
			'have.attr',
			'srcset',
			'/static/608102772e219ed9d765051143a1f289/fd013/trees.jpg 200w,\n/static/608102772e219ed9d765051143a1f289/25252/trees.jpg 400w,\n/static/608102772e219ed9d765051143a1f289/2f1b1/trees.jpg 800w,\n/static/608102772e219ed9d765051143a1f289/0ff54/trees.jpg 1200w,\n/static/608102772e219ed9d765051143a1f289/06655/trees.jpg 1600w,\n/static/608102772e219ed9d765051143a1f289/7731d/trees.jpg 1808w'
		);
		cy.get(':nth-child(4) > .mcm-section-with-image__body > h2.mb-s').should('have.text', 'Un projet collaboratif'); // Title
		cy.get('.mb-xs').should('have.text', 'Ce projet d’intérêt général ouvert et collaboratif, financé dans le cadre de l’appel à programmes des certificats d’économies d’énergie lancé par le ministère de la Transition écologique et solidaire.'); // Text 1/2
		cy.get(':nth-child(4) > .mcm-section-with-image__body > p.mb-s').should('have.text', 'Son développement sera incrémental et expérimenté sur 3 territoires pilotes en 2021 et 2022, en partenariat avec plusieurs collectivités, employeurs et acteurs de la mobilité. Il sera ensuite porté par un acteur neutre, tiers de confiance.'); // Text 2/2
		cy.get('[href="/contact"] > .button')
		  .should('have.text', 'Nous contacter') // Button text
		  .click(); // Redirect
        cy.url().should("match", /contact/); // Contact page
        cy.go(-1); // Go back to homepage
		cy.get('[href="/decouvrir-le-projet"] > .button')
		  .should('have.text', 'Découvrir le projet') // Button text
		  .should('have.class', 'button--secondary') // Different button style
		  .click(); // Redirect
        cy.url().should("match", /decouvrir-le-projet/); // Search page
        cy.go(-1); // Go back to homepage
		cy.get(':nth-child(4) > .mcm-section-with-image__image > .img-wrapper > .mcm-image > picture > img').should('have.attr', 'style', 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; object-fit: cover; object-position: center center; opacity: 1; transition: none 0s ease 0s;'); // TODO image right-aligned & other elements (title, text, button) left-aligned
        cy.viewport(365, 568); // Switch to mobile mode for responsive
		cy.get(':nth-child(4) > .mcm-section-with-image__image > .img-wrapper > .mcm-image > picture > img').should('have.attr', 'style', 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; object-fit: cover; object-position: center center; opacity: 1; transition: none 0s ease 0s;'); // TODO image right-aligned & other elements (title, text, button) left-aligned & ordered
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
		cy.get(':nth-child(3) > a > .mcm-image').should('have.attr', 'src', '/static/66e7dd5e7118c2530d603c629276e063/logo-fabmob.png'); // Image 3/7
		cy.get('.partner-list > :nth-child(3) > a')
          .should('have.attr', 'target', '_blank')
          .should('have.attr', 'href')
          .and('eq', 'http://lafabriquedesmobilites.fr/communs/mon-compte-mobilite/')
          .then((href) => {
			  cy.request(href).its('status').should('eq', 200);
        });
		cy.get(':nth-child(4) > a > .mcm-image > picture > img').should('have.attr', 'srcset', '/static/86b6820a622b2cd351c5631eaac00851/8ac63/logo-igart.png 200w,\n/static/86b6820a622b2cd351c5631eaac00851/8bf6f/logo-igart.png 352w'); // Image 4/7
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
          .and('eq', 'https://www.capgemini.com/fr-fr/mon-compte-mobilite/')
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