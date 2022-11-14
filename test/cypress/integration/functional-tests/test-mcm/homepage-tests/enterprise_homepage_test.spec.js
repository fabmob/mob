// https://gitlab-dev.cicd.moncomptemobilite.fr/mcm/platform/-/issues/417
describe("Enterprise homepage", function () {
	it("Test of the enterprise homepage", function () {
		cy.viewport(1440, 900); // Desktop mode
		cy.justVisit("WEBSITE_FQDN"); // Open website homepage

		/* ==== Tabs Banner */
		cy.get('.nav-links__item--active > a').should('have.text', 'Citoyen.ne'); // Citizen tab
		cy.get('.nav-links > :nth-child(2) > a').should('have.text', 'Employeur'); // Enterprise tab
		cy.get('.nav-links > :nth-child(3) > a').should('have.text', 'Collectivité'); // Collectivity tab
		cy.get('.nav-links > :nth-child(4) > a').should('have.text', 'Opérateur de mobilité'); // MSP tab
		cy.get('.nav-links > :nth-child(2) > a').click(); // GOTO Enterprise tab
		cy.url().should("match", /employeur/); // New page, new URL
		// TODO default citizen tab & mobile : tabs slide

		/* ==== Page title ==== */
		cy.get('.page-container > .mt-m').should('have.text', 'Améliorez  la mobilité de vos salarié.e.s, leurs conditions de vie et de travail tout en réduisant l\'impact carbone de votre entreprise.'); // Text
		cy.get('#employeur-contact > .button').should('have.text', 'Nous contacter'); // Button text

		/* ==== Video Section ==== */
		cy.get('[data-testid="button"] > img').should('have.attr', 'src', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI0ZGRkZGRiIgY3g9IjUwIiBjeT0iNTAiIHI9IjUwIi8+PHBhdGggZD0iTTQ3IDQxLjZsMTIgOC4zODdMNDcgNTguNHoiIGZpbGw9IiMwMGE3NmUiLz48L2c+PC9zdmc+'); // Play icon TODO video plays onClick
		cy.viewport(365, 568); // Switch to mobile mode for responsive
		cy.get('[data-testid="button"] > img').should('have.attr', 'src', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI0ZGRkZGRiIgY3g9IjUwIiBjeT0iNTAiIHI9IjUwIi8+PHBhdGggZD0iTTQ3IDQxLjZsMTIgOC4zODdMNDcgNTguNHoiIGZpbGw9IiMwMGE3NmUiLz48L2c+PC9zdmc+'); // Play icon TODO mobile : video plays onClick & adapts to screen width
		cy.viewport(1440, 900); // Switch back to desktop mode for next step

		/* ==== Steps Section ==== */
		cy.get('.mcm-steps')
		  .should('have.class', 'mcm-steps') // Gray card
		  .should('have.text', 'Mon Compte Mobilité, comment ça marche ?Je me connecte à moB Mon Compte MobilitéJe gère les demandes d’aides de mes salariésJe me connecte à moB Mon Compte Mobilité'); // Title & subs
		cy.get(':nth-child(2) > .step-img > img').should( // Image 1/3
			'have.attr',
			'src',      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODUiIGhlaWdodD0iODUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNNDIuODczIDYwLjkxMWMtNC43OTcgMC04Ljc1Ny0yLjYzNi05LjQ1LTYuMDdDMTguOTI3IDU3Ljk3MiA4LjIyNCA2OC40MTYgOCA4MC44OGg2OC45NzVjLS4yMi0xMi4yNTMtMTAuNTY1LTIyLjU1Ni0yNC42OS0yNS44NzQtLjc4MyAzLjM1NC00LjY5MiA1LjkwNi05LjQxMiA1LjkwNnoiIGZpbGw9IiNGRkQzMTQiLz48cGF0aCBkPSJNMjguNDg3IDE4LjM3OXMyLjkxNS04LjI5NSA1LjI4OC0xMC44NTFjMS44OTItMi4wNCA1LjA1MS0yLjM3NSA3Ljc2OC0xLjc4IDIuNzE3LjU5NiA1LjE5OCAxLjk1OSA3LjgyNyAyLjg2NyA0Ljc2MyAxLjY0NiA3LjYxNyAzLjI2NCAxMS42MTcgNS4yNjQtMiA2LTIuMzE1IDUuMTktNy41MzUgNi45NjgtMy41MDMgMS4xOTQtNy4zMTkuNjctMTEuMDIuNzM1LS44NDkuMDE0LTEuNzkzLjEwMy0yLjM2NS43My0uODUyLjkzNC0uNzMgMi4xMy0xLjU4IDMuMDY3LS41NTQuNjEtMS4yMDUuNzc5LTIgMS0xMy45OSAzLjg5OS04LTgtOC04IiBmaWxsPSIjMzYzNzU3Ii8+PHBhdGggZD0iTTYxLjc0NCAxMi41ODRjLTMuMTA0LTEuNTU3LTYuMTcyLTMuMTcyLTkuNDAyLTQuNDYtMS44MDUtLjcyLTMuNjQzLTEuMzM0LTUuNDM4LTIuMDgzLTEuNzI1LS43Mi0zLjQ3LTEuNDY3LTUuMzE4LTEuODExLTMuMDI3LS41NjMtNi40ODItLjE3NC04Ljc0NSAyLjEwOS0xLjY4NSAxLjctMi43MSA0LjExMi0zLjY1OCA2LjI2OWE3OC4xNzMgNzguMTczIDAgMDAtMi4wNyA1LjE4Yy0xLjQ4MyAzLjA1Ny0yLjU2OCA3Ljk1Ljk0MSAxMC4wMjIgMS4zNTUuNzk5IDMuMDI2LjkzNyA0LjU2My44MTUgMi4wOTEtLjE2NyA1LjA3MS0uNDkyIDYuNjg3LTEuOTUuNDc2LS40MjguODE1LS45NjQgMS4wNzYtMS41NDMuMjI1LS40OTguMzI1LTEuMzgxLjc0Ny0xLjc1OC40ODQtLjQzMyAxLjQwOC0uMjk3IDIuMDAxLS4yOTguOTMxLS4wMDEgMS44NjMuMDI4IDIuNzk0LjA0NyAzLjIwMy4wNjQgNi4wODMtLjI1NCA5LjEzNS0xLjIyNiAxLjYtLjUwOCAzLjQxOC0uODk0IDQuNjY4LTIuMDk0IDEuNDc4LTEuNDIgMi4wOC0zLjY1IDIuNzA4LTUuNTI1LjItLjU5MS0uMTI0LTEuNDExLS42ODktMS42OTRNNDEuOTM4IDcwLjQyMUw0MS45NiA3N2MuMDAyLjc4NC42ODggMS41MzYgMS41IDEuNS44MS0uMDM3IDEuNTAzLS42NiAxLjUtMS41LS4wMDctMi4xOTMtLjAxNS05LjM4Ni0uMDIyLTExLjU3OC0uMDAyLS43ODUtLjY4OC0xLjUzNy0xLjUtMS41LS44MS4wMzYtMS41MDIuNjYtMS41IDEuNSIgZmlsbD0iIzM2Mzc1NyIvPjxwYXRoIGQ9Ik00Ny44NzggMjcuNTcyYzEuOTMgMCAxLjkzNC0zIDAtMy0xLjkzMSAwLTEuOTM0IDMgMCAzIiBmaWxsPSIjMzYzNzU3Ii8+PHBhdGggZD0iTTU3Ljg0NSAxOS45MjVjLTMuNTQtMS41ODEtNi44OTctMy4wMy05LjkzMy01LjQ5NC0zLjE2LTIuNTY2LTYuNzQ2LTQuMzI4LTEwLjkzMi0zLjg0LTEuNzc1LjIwNy0zLjUzMS44MzctNC43NzIgMi4xNzgtMS4yMTEgMS4zMDktMS44MzUgMy4wMTgtMi4yODUgNC43MTMtLjQwMSAxLjUwNi0uNTk3IDMuMTMtMS4xOTYgNC41NzUtLjYzMiAxLjUyNC0yLjAwNyAxLjcwOS0zLjE3OCAyLjcwOS0yLjMxNiAxLjk3Ni0yLjAxNSA1LjA4NC0uMzkgNy4zOTUgMS4zNzUgMS45NTcgMy4zNzkgMy40MjggNS43NSAzLjY2OC4wMTkgNS42MjQuMDM4IDEzLjI0OC4wNTYgMTguODcuMDA1IDEuNDQ5IDIuMjU1IDEuNDUgMi4yNSAwLS4wMi02LjA2Mi0uMDQtMTQuMTI2LS4wNi0yMC4xOWExLjAyNyAxLjAyNyAwIDAwLS4zODQtLjgzMmMtLjIxNS0uNDQ3LS42NC0uNzktMS4yODMtLjc5OC0xLjA3MS0uMDE0LTEuMzQ1LS4yMi0yLjM1NC0uODU4LS41MDEtLjMxNy0xLjEwMy0uOTU0LTEuNTE3LTEuNTY2LS40MzItLjY0LS45LTEuNDgxLS43ODgtMi4yODcuMTQ2LTEuMDU3IDEuMTk3LTEuNDg3IDIuMDMyLTEuOTI2IDIuNTc4LTEuMzU0IDMuMDU1LTQuMjcgMy42NzYtNi44NTMuMzItMS4zMzEuNjItMi43NDggMS4zNjMtMy45Mi45NDUtMS40OTMgMi42MDMtMS45MzggNC4yODMtMS45NThhMTAuMjkgMTAuMjkgMCAwMTUuMTEyIDEuMjc3YzEuNjM4LjkwOCAyLjk4NiAyLjIzMiA0LjQ4MiAzLjM0MiAyLjU5NyAxLjkyOSA1LjYyNCAzLjA3NiA4LjU1NCA0LjM4NSAyLjU1IDEuMTQgNi40MyAyLjcxNyA3LjU2OSA1LjUyNC4yMjMuNTUuMzAzIDEuMjM1LjAzIDEuNzg3LS4zNS43MDctMS4xMS43ODMtMS44MTUuOS0xLjg1NC4zMS0zLjgyNS4zMTUtNS42NDUuNzgyLTEuNjQzLjQyMy0yLjQ5NyAxLjY2NS0yLjc0MyAzLjI4NC0uMzI4IDIuMTYyLS40MiA0LjM4Ni0uNTU2IDYuNTY3YTE3My4yMyAxNzMuMjMgMCAwMC0uMzA3IDEzLjYzNmMuMDMgMS45MjggMy4wMyAxLjkzNCAzIDBhMTczLjIzIDE3My4yMyAwIDAxLjMwNy0xMy42MzZjLjA3LTEuMTM1LjE1My0yLjI3LjI0Ny0zLjQwMi4wNzktLjk0Ny0uMDA4LTIuMTUyLjMyMy0zLjA0Ni4yOC0uNzU4IDEuNDc3LS42NiAyLjE4NC0uNzU1IDEuMDYzLS4xNDIgMi4xMjctLjI4MyAzLjE5LS40MjcgMS43NzItLjI0IDMuNDk0LS42OTMgNC40MDYtMi4zOS44MDktMS41MDIuNjk0LTMuMzExLS4wMy00LjgxNy0xLjU4LTMuMjktNS40ODQtNS4xODUtOC42NDYtNi41OTd6IiBmaWxsPSIjMzYzNzU3Ii8+PC9nPjwvc3ZnPgo='
		);
		cy.get(':nth-child(3) > .step-img > img').should( // Image 2/3
			'have.attr',
			'src',            'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iODVweCIgaGVpZ2h0PSI4NXB4IiB2aWV3Qm94PSIwIDAgODUgODUiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+SWxsdXMvQmlnL01vYmlsZTwvdGl0bGU+CiAgICA8ZyBpZD0iSWxsdXMvQmlnL01vYmlsZSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPHBhdGggZD0iTTI0LjE1NDQyOTcsMTMuNzY4NjgyIEMyNS4wODM5Mjk3LDguNTg1NDgyMDQgMjYuMjQ3NzI5Nyw1LjEwNjE4MjA0IDMwLjIwMDAyOTcsNS4wMDM4ODIwNCBDMzIuMTQxNTI5Nyw0Ljk1MzI4MjA0IDQ5LjE1NjMyOTcsNS4zNzM0ODIwNCA2MC44MTYzMjk3LDcuNjgwMTgyMDQgQzYyLjc0NDYyOTcsOC4wNjE4ODIwNCA2NC45Nzk4Mjk3LDguNDA4MzgyMDQgNjYuMjQ4MTI5Nyw5Ljc4MzM4MjA0IEM2Ny4zMTk1Mjk3LDEwLjk0NzE4MiA2Ny44NTUyMjk3LDEzLjE2NDc4MiA2Ny44NTY0MzMyLDE0LjY4Mzg4MiBDNjcuODczOTI5NywzNC44NTQ1ODIgNjUuNjQ2NDI5Nyw1NC45MzYxODIgNjEuNDAyNjI5Nyw3NC43MzM5ODIgQzYxLjA4NDcyOTcsNzYuMjE2NzgyIDYwLjY5NjQyOTcsNzcuNzk3NDgyIDU5LjQ4NTMyOTcsNzguODMxNDgyIEM1OC4wOTA1Mjk3LDgwLjAyMTY4MiA1NS45OTk0Mjk3LDgwLjE2MDI4MiA1NC4wODg3Mjk3LDgwLjIwMzE4MiBDNDEuODEyNzI5Nyw4MC40NzM3ODIgMzIuODUyMTI5Nyw3OS4wOTIxODIgMjAuODM2ODI5Nyw3Ni43ODU0ODIgQzE5LjkwNzMyOTcsNzYuNjA2MTgyIDE4Ljg0MjUyOTcsNzYuMzI0NTgyIDE3Ljg3NjcyOTcsNzUuMTY3MzgyIEMxNy4yNzYxMjk3LDc0LjQ0Nzk4MiAxNy4wMDExMjk3LDcyLjI2MjI4MiAxNyw3MS4zNjEzODIgQzE2Ljk4NzkyOTcsNTEuNjE3NDgyIDIwLjY3ODQyOTcsMzMuMjU4NDgyIDI0LjE1NDQyOTcsMTMuNzY4NjgyIiBpZD0iRmlsbC0xIiBmaWxsPSIjNDY0Q0QwIj48L3BhdGg+CiAgICAgICAgPHBhdGggZD0iTTMyLjI3MTk2LDI5Ljg4NjMgQzM1Ljk4MTE2LDMwLjM0NjEgMzkuNjkwMzYsMzAuODA3IDQzLjQwMDY2LDMxLjI2NjggQzQ0LjA2NTA2LDMxLjM0OTMgNDQuNjM4MTYsMzAuNjM5OCA0NC42MzgxNiwzMC4wMjkzIEM0NC42MzgxNiwyOS4yOTIzIDQ0LjA2NzI2LDI4Ljg3NTQgNDMuNDAwNjYsMjguNzkxOCBDMzkuNjkwMzYsMjguMzMyIDM1Ljk4MTE2LDI3Ljg3MTEgMzIuMjcxOTYsMjcuNDExMyBDMzEuNjA3NTYsMjcuMzI4OCAzMS4wMzQ0NiwyOC4wMzk0IDMxLjAzNDQ2LDI4LjY0ODggQzMxLjAzNDQ2LDI5LjM4NTggMzEuNjA2NDYsMjkuODAzOCAzMi4yNzE5NiwyOS44ODYzIiBpZD0iRmlsbC00IiBmaWxsPSIjRkZEMzE0Ij48L3BhdGg+CiAgICAgICAgPHBhdGggZD0iTTQxLjIyODcxLDE0LjYzOTg2IEM0NC45Mzc5MSwxNS4wOTk2NiA0OC42NDcxMSwxNS41NjA1NiA1Mi4zNTYzMSwxNi4wMjAzNiBDNTMuMDIxODEsMTYuMTAyODYgNTMuNTkzODEsMTUuMzkzMzYgNTMuNTkzODEsMTQuNzgyODYgQzUzLjU5MzgxLDE0LjA0NTg2IDUzLjAyNDAxLDEzLjYyODk2IDUyLjM1NjMxLDEzLjU0NTM2IEM0OC42NDcxMSwxMy4wODU1NiA0NC45Mzc5MSwxMi42MjQ2NiA0MS4yMjg3MSwxMi4xNjQ4NiBDNDAuNTY0MzEsMTIuMDgyMzYgMzkuOTkxMjEsMTIuNzkyOTYgMzkuOTkxMjEsMTMuNDAyMzYgQzM5Ljk5MTIxLDE0LjEzOTM2IDQwLjU2MjExLDE0LjU1NzM2IDQxLjIyODcxLDE0LjYzOTg2IiBpZD0iRmlsbC02IiBmaWxsPSIjMzYzNzU3Ij48L3BhdGg+CiAgICAgICAgPHBhdGggZD0iTTMwLjMzMTg5LDQyLjcyOTY4IEMzNC4xNTU0OSw0My4yMDM3OCAzNy45Nzc5OSw0My42Nzc4OCA0MS44MDE1OSw0NC4xNTMwOCBDNDIuNDY1OTksNDQuMjM1NTggNDMuMDM5MDksNDMuNTI0OTggNDMuMDM5MDksNDIuOTE1NTggQzQzLjAzOTA5LDQyLjE3ODU4IDQyLjQ2ODE5LDQxLjc2MDU4IDQxLjgwMTU5LDQxLjY3ODA4IEMzNy45Nzc5OSw0MS4yMDI4OCAzNC4xNTU0OSw0MC43Mjg3OCAzMC4zMzE4OSw0MC4yNTQ2OCBDMjkuNjY3NDksNDAuMTcyMTggMjkuMDk0MzksNDAuODgyNzggMjkuMDk0MzksNDEuNDkyMTggQzI5LjA5NDM5LDQyLjIyOTE4IDI5LjY2NTI5LDQyLjY0NzE4IDMwLjMzMTg5LDQyLjcyOTY4IiBpZD0iRmlsbC04IiBmaWxsPSIjRkZEMzE0Ij48L3BhdGg+CiAgICAgICAgPHBhdGggZD0iTTI4LjM0MzUzLDU2Ljc1NjIyIEMzMi4yNDg1Myw1Ny4yNDAyMiAzNi4xNTM1Myw1Ny43MjUzMiA0MC4wNTc0Myw1OC4yMDkzMiBDNDAuNzIxODMsNTguMjkxODIgNDEuMjk0OTMsNTcuNTgyMzIgNDEuMjk0OTMsNTYuOTcxODIgQzQxLjI5NDkzLDU2LjIzNDgyIDQwLjcyNDAzLDU1LjgxNjgyIDQwLjA1NzQzLDU1LjczNDMyIEMzNi4xNTM1Myw1NS4yNTAzMiAzMi4yNDg1Myw1NC43NjUyMiAyOC4zNDM1Myw1NC4yODEyMiBDMjcuNjc5MTMsNTQuMTk4NzIgMjcuMTA2MDMsNTQuOTA5MzIgMjcuMTA2MDMsNTUuNTE4NzIgQzI3LjEwNjAzLDU2LjI1NTcyIDI3LjY3ODAzLDU2LjY3MzcyIDI4LjM0MzUzLDU2Ljc1NjIyIiBpZD0iRmlsbC0xMCIgZmlsbD0iI0ZGRDMxNCI+PC9wYXRoPgogICAgICAgIDxwYXRoIGQ9Ik01OS41OTM2NSwyNC44MTA1NyBDNTkuMDk5NzUsMjQuMzE2NjcgNTguMzQxODUsMjQuMzYxNzcgNTcuODQzNTUsMjQuODEwNTcgQzU1LjcyMjc1LDI2LjcyMDE3IDUzLjYwMzA1LDI4LjYyOTc3IDUxLjQ4MjI1LDMwLjUzOTM3IEM1MS4wNzA4NSwyOS43NDQwNyA1MC43ODE1NSwyOC44OTkyNyA1MC42OTQ2NSwyOC4wNDIzNyBDNTAuNjI3NTUsMjcuMzc2ODcgNTAuMTc0MzUsMjYuODA0ODcgNDkuNDU3MTUsMjYuODA0ODcgQzQ4Ljg0MTE1LDI2LjgwNDg3IDQ4LjE1MjU1LDI3LjM3MzU3IDQ4LjIxOTY1LDI4LjA0MjM3IEM0OC40MDU1NSwyOS44NjUwNyA0OS4wMTcxNSwzMS42MDk2NyA1MC4xNDM1NSwzMy4wNjgyNyBDNTAuNjQyOTUsMzMuNzE2MTcgNTEuNDM3MTUsMzMuOTA1MzcgNTIuMDg4MzUsMzMuMzE5MDcgQzU0LjU4OTc1LDMxLjA2NjI3IDU3LjA5MjI1LDI4LjgxMzQ3IDU5LjU5MzY1LDI2LjU2MDY3IEM2MC4wOTA4NSwyNi4xMTI5NyA2MC4wNDkwNSwyNS4yNjU5NyA1OS41OTM2NSwyNC44MTA1NyIgaWQ9IkZpbGwtMTIiIGZpbGw9IiNGRkQzMTQiPjwvcGF0aD4KICAgICAgICA8cGF0aCBkPSJNNTYuMTEyMDQsMzguNzYyNTMgQzUzLjk5MTI0LDQwLjY3MjEzIDUxLjg3MTU0LDQyLjU4MTczIDQ5Ljc1MDc0LDQ0LjQ5MTMzIEM0OS4zNDA0NCw0My42OTcxMyA0OS4wNTExNCw0Mi44NTEyMyA0OC45NjQyNCw0MS45OTQzMyBDNDguODk0OTQsNDEuMzI4ODMgNDguNDQyODQsNDAuNzU2ODMgNDcuNzI2NzQsNDAuNzU2ODMgQzQ3LjEwOTY0LDQwLjc1NjgzIDQ2LjQxOTk0LDQxLjMyNTUzIDQ2LjQ4OTI0LDQxLjk5NDMzIEM0Ni42NzQwNCw0My44MTgxMyA0Ny4yODY3NCw0NS41NjE2MyA0OC40MTMxNCw0Ny4wMjEzMyBDNDguOTEyNTQsNDcuNjY4MTMgNDkuNzA1NjQsNDcuODU3MzMgNTAuMzU2ODQsNDcuMjcxMDMgQzUyLjg1ODI0LDQ1LjAxODIzIDU1LjM1OTY0LDQyLjc2NTQzIDU3Ljg2MzI0LDQwLjUxMjYzIEM1OC4zNTkzNCw0MC4wNjYwMyA1OC4zMTc1NCwzOS4yMTc5MyA1Ny44NjMyNCwzOC43NjI1MyBDNTcuMzY5MzQsMzguMjY4NjMgNTYuNjEwMzQsMzguMzEzNzMgNTYuMTEyMDQsMzguNzYyNTMiIGlkPSJGaWxsLTE0IiBmaWxsPSIjRkZEMzE0Ij48L3BhdGg+CiAgICAgICAgPHBhdGggZD0iTTU0LjQ3MzkyLDUxLjk2NzkyIEM1Mi4zNTMxMiw1My44Nzc1MiA1MC4yMzM0Miw1NS43ODcxMiA0OC4xMTI2Miw1Ny42OTY3MiBDNDcuNzAyMzIsNTYuOTAyNTIgNDcuNDEzMDIsNTYuMDU2NjIgNDcuMzI1MDIsNTUuMTk5NzIgQzQ3LjI1NzkyLDU0LjUzNDIyIDQ2LjgwNDcyLDUzLjk2MjIyIDQ2LjA4NzUyLDUzLjk2MjIyIEM0NS40NzA0Miw1My45NjIyMiA0NC43ODE4Miw1NC41MzA5MiA0NC44NTAwMiw1NS4xOTk3MiBDNDUuMDM1OTIsNTcuMDIzNTIgNDUuNjQ4NjIsNTguNzY3MDIgNDYuNzc1MDIsNjAuMjI2NzIgQzQ3LjI3NDQyLDYwLjg3MzUyIDQ4LjA2NzUyLDYxLjA2MjcyIDQ4LjcxODcyLDYwLjQ3NjQyIEM1MS4yMjAxMiw1OC4yMjM2MiA1My43MjE1Miw1NS45NzA4MiA1Ni4yMjQwMiw1My43MTgwMiBDNTYuNzIxMjIsNTMuMjcxNDIgNTYuNjc5NDIsNTIuNDIzMzIgNTYuMjI0MDIsNTEuOTY3OTIgQzU1LjczMTIyLDUxLjQ3NDAyIDU0Ljk3MjIyLDUxLjUxOTEyIDU0LjQ3MzkyLDUxLjk2NzkyIiBpZD0iRmlsbC0xNiIgZmlsbD0iI0ZGRDMxNCI+PC9wYXRoPgogICAgICAgIDxwYXRoIGQ9Ik00Mi4xNTg5OCw2OS4zNjgxNiBDNDAuOTQ4OTgsNjguMzM4NTYgNDAuMjQzODgsNjguNTk3MDYgMzkuNTQ1MzgsNjguNTc1MDYgQzM4LjE0ODM4LDY4LjUzMzI2IDM3LjI0ODU4LDcwLjEyMDU2IDM3LjMzNTQ4LDcxLjUxNTM2IEMzNy4zODgyOCw3Mi4zNjM0NiAzNy43MzU4OCw3My4yMjE0NiAzOC40MDEzOCw3My43NTA1NiBDMzkuNDg0ODgsNzQuNjE0MDYgNDEuMjQzNzgsNzQuMzI0NzYgNDIuMTEyNzgsNzMuMjQ1NjYgQzQyLjk4MDY4LDcyLjE2NTQ2IDQyLjk0NzY4LDcwLjUwNzc2IDQyLjE1ODk4LDY5LjM2ODE2IiBpZD0iRmlsbC0xOCIgZmlsbD0iIzM2Mzc1NyI+PC9wYXRoPgogICAgPC9nPgo8L3N2Zz4='
		);
		cy.get(':nth-child(4) > .step-img > img').should( // Image 3/3
			'have.attr',
			'src',            'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iODVweCIgaGVpZ2h0PSI4NXB4IiB2aWV3Qm94PSIwIDAgODUgODUiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+SWxsdXMvQmlnL0dyYXBoPC90aXRsZT4KICAgIDxnIGlkPSJJbGx1cy9CaWcvR3JhcGgiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxwYXRoIGQ9Ik0zMS40NzQ3OCwxNC4xMTEwOCBDMjMuMjAyNzgsMTMuMjQ3NTggMTcuMjc3MDgsMTcuODkzOTggMTIuMzcxMDgsMjQuMzg1MDggQzcuNDY1MDgsMzAuODc3MjggNS45NjkwOCwzOS41Mjk4OCA3LjY4MTc4LDQ3LjQ0OTg4IEM4LjMyNDE4LDUwLjQxNTQ4IDkuNDA0MzgsNTMuMzI2MDggMTEuMTUyMjgsNTUuODQxNzggQzE1Ljk0MTY4LDYyLjcyNzc4IDI1LjAyMTA4LDY1LjY1Mzc4IDMzLjU0MDU4LDY1LjkxMDA4IEM0MC43MTQ3OCw2Ni4xMjU2OCA0OC4zODA2OCw2NC41MzUwOCA1My4zNTA0OCw1OS41MzIyOCBDNTcuMzEwNDgsNTUuNTQ1ODggNTkuMDM2MzgsNDkuOTQ0NjggNjAuMDEwOTgsNDQuNDcxMDggQzYwLjcxMzg4LDQwLjUyNzU4IDYxLjA5MjI4LDM2LjQ0NDM4IDYwLjE3NDg4LDMyLjUzMjc4IEM1OC41NTEyOCwyNS42MDkzOCA1Mi45MTA0OCwxOS45Njc0OCA0Ni4yNjUzOCwxNy4wMDUxOCBDMzkuNjE5MTgsMTQuMDQzOTggMzkuNjE5MTgsMTQuMDQzOTggMzEuNDc0NzgsMTQuMTExMDgiIGlkPSJGaWxsLTEiIGZpbGw9IiMwMUJGN0QiPjwvcGF0aD4KICAgICAgICA8cGF0aCBkPSJNNTQuNSw2OSBDNTYuNzAxMzMsNzEuNDYwNjcgNTguNSw3My41IDY0LjUsNzkuNSBDNjYuMDAzNjY0LDgxLjAwMzY2NCA2OC4zNzUzNTU2LDc4Ljc3Nzk1NSA2Ni45MDEzLDc3LjI0MDYgQzU5LDY5IDYwLjk5MDkzLDcxLjM4NzE3IDUzLjUsNjIuNSBDNTIuMTYzMjMwMiw2MC45MTQwNjg3IDQ5Ljc3NzksNjIuNzg2MiA1MSw2NC41IEw1NC41LDY5IFoiIGlkPSJGaWxsLTYiIGZpbGw9IiMzNjM3NTciPjwvcGF0aD4KICAgICAgICA8cGF0aCBkPSJNMjQuMDE1NDYsMjQuNDYxMiBDMjcuNTc1MDYsMjQuNzA1NCAyOC4wNjg5NiwyNC4xMzAxIDMxLjYyODU2LDI0LjM3NDMgQzMwLjkwMzY2LDMzLjU3OCAzMS4yNDkwNiw0My43ODYgMzAuODUzMDYsNTMuNDA3NyBDMjkuMDIxNTYsNTMuNTkzNiAyNS42Mzc5Niw1My4zMjc0IDIzLjcyMDY2LDUzLjQwNzcgQzI0LjIxNjc2LDQzLjgyNzggMjMuMjY2MzYsMzMuODE3OCAyNC4wMTU0NiwyNC40NjEyIiBpZD0iRmlsbC04IiBmaWxsPSIjRkZEMzE0Ij48L3BhdGg+CiAgICAgICAgPHBhdGggZD0iTTMzLjg0NjcxLDMzLjgzMDU2IEMzNS4zODEyMSwzMy42ODg2NiAzNi45MjM0MSwzMy42MzI1NiAzOC40NjIzMSwzMy42NjMzNiBDMzguNzM0MDEsMzMuNjY4ODYgMzkuMDI1NTEsMzMuNjgzMTYgMzkuMjM4OTEsMzMuODUwMzYgQzM5LjU0MTQxLDM0LjA4NTc2IDM5LjU3MTExLDM0LjUyMjQ2IDM5LjU3NjYxLDM0LjkwNTI2IEMzOS42MzI3MSwzOS4zMDc0NiAzOS42Mjk0MSw0My43MTA3NiAzOS41NjU2MSw0OC4xMTQwNiBDMzkuNTQzNjEsNDkuNjk4MDYgMzkuMzgzMDEsNTMuMzIxNDYgMzkuMTQxMDEsNTMuNDc1NDYgQzM4Ljk0NDExLDUzLjYwMTk2IDM1Ljc4OTMxLDUzLjUwMDc2IDM0LjYwNDYxLDUzLjQwODM2IEMzNC4wNzk5MSw1My4zNjc2NiAzMy41NTc0MSw1My40MTgyNiAzMy4wODk5MSw1My4xNzczNiBMMzMuODQ2NzEsMzMuODMwNTYgWiIgaWQ9IkZpbGwtMTAiIGZpbGw9IiNGRkQzMTQiPjwvcGF0aD4KICAgICAgICA8cGF0aCBkPSJNNDEuNjQ5NzgsNDAuMDAyNDQgQzQyLjk4NjI4LDM5LjYxMzA0IDQ0LjI0Njg4LDM5LjkzNjQ0IDQ1LjY1NTk4LDM5LjgwNjY0IEM0NS44NzM3OCwzOS43ODY4NCA0Ni4xMTM1OCwzOS43NzM2NCA0Ni4yOTI4OCwzOS44ODAzNCBDNDYuNTMyNjgsNDAuMDIyMjQgNDYuNTU1NzgsNDAuMzA3MTQgNDYuNTU1NzgsNDAuNTUzNTQgQzQ2LjU0ODA4LDQ0LjU1MzE0IDQ2LjUzOTI4LDQ4LjU1MTY0IDQ2LjUzMTU4LDUyLjU1MTI0IEM0Ni41MzE1OCw1Mi44MzUwNCA0Ni41MDg0OCw1My4xNTk1NCA0Ni4yNDExOCw1My4zMzY2NCBDNDYuMDM2NTgsNTMuNDcxOTQgNDUuNzUxNjgsNTMuNDc0MTQgNDUuNDkyMDgsNTMuNDY5NzQgQzQ0LjQxODQ4LDUzLjQ1NDM0IDQyLjE1MDI4LDUzLjQ4NjI0IDQxLjA3NjY4LDUzLjQ3MDg0IEw0MS42NDk3OCw0MC4wMDI0NCBaIiBpZD0iRmlsbC0xMiIgZmlsbD0iI0ZGRDMxNCI+PC9wYXRoPgogICAgICAgIDxwYXRoIGQ9Ik02MC43NTM5NCwxNC40ODI3NyBDNjEuOTQwODQsMTIuMzM0NDcgNjMuMTI2NjQsMTAuMTg2MTcgNjQuMzEzNTQsOC4wMzc4NyBDNjQuNjQyNDQsNy40NDM4NyA2NC40Nzg1NCw2LjU5NTc3IDYzLjg0ODI0LDYuMjYzNTcgQzYzLjIzOTk0LDUuOTQxMjcgNjIuNDI1OTQsNi4wOTQxNyA2Mi4wNzUwNCw2LjcyODg3IEw1OC41MTQzNCwxMy4xNzM3NyBDNTguMTg2NTQsMTMuNzY3NzcgNTguMzQ5MzQsMTQuNjE1ODcgNTguOTc5NjQsMTQuOTQ4MDcgQzU5LjU4Nzk0LDE1LjI3MDM3IDYwLjQwMzA0LDE1LjExNzQ3IDYwLjc1Mzk0LDE0LjQ4Mjc3IiBpZD0iRmlsbC0xNCIgZmlsbD0iIzM2Mzc1NyI+PC9wYXRoPgogICAgICAgIDxwYXRoIGQ9Ik02Ny43MDI5NywxOS4zMzcxOCBDNjkuMzYzOTcsMTguMzQ0OTggNzEuMDI0OTcsMTcuMzUzODggNzIuNjgzNzcsMTYuMzYxNjggQzczLjI2Njc3LDE2LjAxNDA4IDczLjUzMTg3LDE1LjE4MDI4IDczLjE0OTA3LDE0LjU4NzM4IEM3Mi43NzE3NywxNC4wMDEwOCA3MS45OTg0NywxMy43NTAyOCA3MS4zNzU4NywxNC4xMjIwOCBDNjkuNzE0ODcsMTUuMTE0MjggNjguMDUzODcsMTYuMTA1MzggNjYuMzk1MDcsMTcuMDk3NTggQzY1LjgxMjA3LDE3LjQ0NjI4IDY1LjU0Njk3LDE4LjI4MDA4IDY1LjkyOTc3LDE4Ljg3MTg4IEM2Ni4zMDU5NywxOS40NTcwOCA2Ny4wODAzNywxOS43MDg5OCA2Ny43MDI5NywxOS4zMzcxOCIgaWQ9IkZpbGwtMTciIGZpbGw9IiMzNjM3NTciPjwvcGF0aD4KICAgICAgICA8cGF0aCBkPSJNNjcuOTE4OSwyNy41MzEzIEM3MC41ODQyLDI3Ljc2MzQgNzMuMjQ5NSwyNy45OTY2IDc1LjkxNDgsMjguMjI4NyBDNzYuNTkxMywyOC4yODgxIDc3LjI0MDMsMjcuNTkwNyA3Ny4yMTA2LDI2LjkzMTggQzc3LjE3NjUsMjYuMTc5NCA3Ni42Mzk3LDI1LjY5ODcgNzUuOTE0OCwyNS42MzQ5IEM3My4yNDk1LDI1LjQwMjggNzAuNTg0MiwyNS4xNzA3IDY3LjkxODksMjQuOTM4NiBDNjcuMjQxMywyNC44NzkyIDY2LjU5MjMsMjUuNTc2NiA2Ni42MjIsMjYuMjM0NCBDNjYuNjU2MSwyNi45ODc5IDY3LjE5MjksMjcuNDY3NSA2Ny45MTg5LDI3LjUzMTMiIGlkPSJGaWxsLTE5IiBmaWxsPSIjMzYzNzU3Ij48L3BhdGg+CiAgICA8L2c+Cjwvc3ZnPg=='
		);

		/* ==== Toolbox Section ==== */
		cy.get('.mcm-section-with-support--iphone__image > .mcm-image > picture > img').should('have.attr', 'srcset', '/static/5b768200d371dcb5d2e8ae26f4f6d0e7/8ac63/support-iphone.png 200w,\n/static/5b768200d371dcb5d2e8ae26f4f6d0e7/3891b/support-iphone.png 400w,\n/static/5b768200d371dcb5d2e8ae26f4f6d0e7/bc8e0/support-iphone.png 800w,\n/static/5b768200d371dcb5d2e8ae26f4f6d0e7/e48ff/support-iphone.png 868w'); // Image
		cy.get('.mcm-section-with-support--iphone__body > .mb-m').should('have.text', 'MOB est une boîte à outils qui vous permettra de :'); // Title
		cy.get('.mcm-ordered-list > :nth-child(1)')
		.should('have.class', 'mcm-ordered-list__item') // Bullet point 1/3
		.should('have.text', 'Mieux comprendre les déplacements de vos salarié.e.s et calculer l’impact carbone de votre entreprise.'); // Text 1/3
		cy.get('.mcm-ordered-list > :nth-child(2)')
		.should('have.class', 'mcm-ordered-list__item') // Bullet point 2/3
		.should('have.text', 'Simplifier la mise en place et la gestion des aides de mobilité existantes, comme le forfait mobilité durable.'); // Text 2/3
		cy.get('.mcm-ordered-list > :nth-child(3)')
		.should('have.class', 'mcm-ordered-list__item') // Bullet point 3/3
		.should('have.text', 'Expérimenter et évaluer de nouvelles aides adaptées à votre politique de mobilité.'); // Text 3/3
		cy.viewport(365, 568); // Switch to mobile mode for responsive
		cy.get('.mcm-section-with-support--iphone__body > .mb-m').should('have.text', 'MOB est une boîte à outils qui vous permettra de :'); // Title
		cy.get('.mcm-ordered-list > :nth-child(1)')
		.should('have.class', 'mcm-ordered-list__item') // Bullet point 1/3
		.should('have.text', 'Mieux comprendre les déplacements de vos salarié.e.s et calculer l’impact carbone de votre entreprise.'); // Text 1/3
		cy.get('.mcm-ordered-list > :nth-child(2)')
		.should('have.class', 'mcm-ordered-list__item') // Bullet point 2/3
		.should('have.text', 'Simplifier la mise en place et la gestion des aides de mobilité existantes, comme le forfait mobilité durable.'); // Text 2/3
		cy.get('.mcm-ordered-list > :nth-child(3)')
		.should('have.class', 'mcm-ordered-list__item') // Bullet point 3/3
		.should('have.text', 'Expérimenter et évaluer de nouvelles aides adaptées à votre politique de mobilité.'); // Text 3/3

		/* ==== moB banner Section ==== */
		cy.get('.mob-pattern__svg').should('be.visible');  // Logo image (mobile)
		cy.viewport(1440, 900); // Switch back to desktop mode for next step
		cy.get('.mob-pattern__svg').should('be.visible');  // Logo image (desktop)

		/* ==== Why join moB? Section ==== */
		cy.get('.img-wrapper > .mcm-image > picture > img').should('have.attr', 'srcset', '/static/3af6040b800ec4cdb106f764b7dea9b8/fd013/homme-d-affaire.jpg 200w,\n/static/3af6040b800ec4cdb106f764b7dea9b8/25252/homme-d-affaire.jpg 400w,\n/static/3af6040b800ec4cdb106f764b7dea9b8/2f1b1/homme-d-affaire.jpg 800w,\n/static/3af6040b800ec4cdb106f764b7dea9b8/768f4/homme-d-affaire.jpg 1160w');// Image TODO right-aligned
		cy.get('h2.mb-s').should('have.text', 'Pourquoi rejoindre moB ?'); // Title
		cy.get('.mb-xs').should('have.text', 'Rejoindre Mon Compte MOB signifie rejoindre un écosystème comprenant des Collectivités, des Opérateurs de transports et d’autres Employeurs.'); // Text 1/2
		cy.get('p.mb-s').should('have.text', 'Via cet écosystème, vous aurez l\'opportunité de créer des liens avec les collectivités et différents opérateurs de mobilité. Vous pourrez ainsi proposer à vos salariés des aides plus adaptées à leurs besoins.'); // Text 2/2
		cy.get('#employeur-contact2 > .button')
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