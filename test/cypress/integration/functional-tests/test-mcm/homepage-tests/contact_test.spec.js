describe("Contact page", function(){
    it("Test of the contact page", function(){
        cy.viewport(1440,900);//Desktop mode
        cy.justVisit("WEBSITE_FQDN");//Opn website contact page

        cy.wait(500);
        cy.get('[href="/contact"] > .button')
		  .should('have.text', 'Nous contacter') // Button text
		  .click(); // Redirect


        /* ==== Page title ==== */
        cy.wait(500);
        cy.get('h1.mb-s').should('have.text', 'Nous contacter');// title
        cy.get('.mcm-section-with-image__body > :nth-child(2)').should('have.text', 'Vous souhaitez être accompagné dans la mise en place de votre projet et/ou participer à la construction de la plateforme MOB ?');//texte 1/2
        cy.get('.mcm-section-with-image__body > :nth-child(3)').should('have.text', "Contactez-nous, un membre de l'équipe reviendra vers vous dans les plus brefs délais.");//texte 2/2
        cy.get('.img-wrapper > .mcm-image > picture > img').should('have.attr', 'srcset', '/static/608102772e219ed9d765051143a1f289/fd013/trees.jpg 200w,\n/static/608102772e219ed9d765051143a1f289/25252/trees.jpg 400w,\n/static/608102772e219ed9d765051143a1f289/2f1b1/trees.jpg 800w,\n/static/608102772e219ed9d765051143a1f289/0ff54/trees.jpg 1200w,\n/static/608102772e219ed9d765051143a1f289/06655/trees.jpg 1600w,\n/static/608102772e219ed9d765051143a1f289/7731d/trees.jpg 1808w');//image


        /* ==== Form section ==== */
        cy.get('.form-btn-radio > :nth-child(2) > .field__label').should('have.text','Un employeur (entreprise, association...)').click();//check button employeur
        cy.get('.form-btn-radio > :nth-child(3) > .field__label').should('have.text','Une collectivité').click();//check button collectivité
        cy.get('.form-btn-radio > :nth-child(4) > .field__label').should('have.text','Un opérateur de mobilité').click();//check button opérateur mobilité
        cy.get('.form-btn-radio > :nth-child(1) > .field__label').should('have.text','Un.e citoyen.ne').click();//check button citoyen
        
        cy.get('.form__fields > :nth-child(1) > .field__label').should('have.text','Nom *');
        cy.get('.form__fields > :nth-child(1)').type('Rasovsky');//fill in empty fields Name
        cy.get('.form__fields > :nth-child(2) > .field__label').should('have.text','Prénom *');
        cy.get('.form__fields > :nth-child(2)').type('Bob');//fill in empty fields surname
        
        cy.get('.form__fields > :nth-child(3) > .field__label').should('have.text','Email *');
        cy.get('.form__fields > :nth-child(3)').type('exemple@mail.com');//fill in empty fields mail
        cy.get('.form__fields > :nth-child(4) > .field__label').should('have.text','Code postal *');
        cy.get('.form__fields > :nth-child(4)').type('75000');//fill in empty fields adresss
        cy.get('.contact-form > :nth-child(3)').type('lorem ipsum dolor sit amet, consectetur, test cypress');//fill in empty fields description
        cy.get('[data-testid="checkbox-test"] > .checkbox-radio > .field__label').click(10,0);
        // [data-layer="Padding"]
        cy.get('.button').should('have.text','Envoyer').click();
        cy.request('POST', '/contact').should((response) => {
            expect(response.status).to.eq(200);
          });

        /* ==== Partners Section ==== */
		cy.get('.mb-m').should('have.text', 'Tous nos partenaires'); // Title
		cy.get(':nth-child(1) > a > .mcm-image > picture > img').should('have.attr', 'srcset', '/static/a23bb028afc39085b9153e5f10b77489/8ac63/logo-ministere.png 200w,\n/static/a23bb028afc39085b9153e5f10b77489/37d5a/logo-ministere.png 300w'); // Image 1/7
		cy.get('.partner-list > :nth-child(1) > a')
          .should('have.attr', 'target', '_blank')
          .should('have.attr', 'href')
          .and('eq', ' https://www.gouvernement.fr/ministere-de-la-transition-ecologique-charge-des-transports') 
          .then((href) => {
			  cy.request(href.trim()).its('status').should('eq', 200); 
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