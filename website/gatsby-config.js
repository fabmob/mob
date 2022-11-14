module.exports = {
  siteMetadata: {
    title: 'Mon Compte Mobilité',
    description:
      "Mon Compte Mobilité (moB) est un service numérique qui encourage les citoyens et salariés à recourir aux mobilités douces en facilitant l'accès aux aides et services de mobilité via un moteur de recherche et de souscription.",
    siteUrl: `https://moncomptemobilite.fr/`,
  },
  plugins: [
    {
      resolve: `gatsby-plugin-netlify-cms`,
      options: {
        modulePath: `${__dirname}/src/cms/cms.js`,
      },
    },
    {
      resolve: `gatsby-plugin-breadcrumb`,
      options: {
        useAutoGen: true,
        autoGenHomeLabel: 'Accueil',
        crumbLabelUpdates: [
          {
            pathname: '/decouvrir-le-projet',
            crumbLabel: 'Découvrir le projet',
          },
          {
            pathname: '/contact',
            crumbLabel: 'Nous contacter',
          },
          {
            pathname: '/faq',
            crumbLabel: 'Foire aux questions',
          },
          {
            pathname: '/aide-page',
            crumbLabel: "Fiche d'aide",
          },
          {
            pathname: '/recherche',
            crumbLabel: 'Trouver une aide',
          },
          {
            pathname: '/mentions-legales-cgu',
            crumbLabel:
              'Mentions légales et Conditions Générales d’utilisation',
          },
          {
            pathname: '/politique-gestion-cookies',
            crumbLabel: 'Politique et gestion des cookies',
          },
          {
            pathname: '/charte-protection-donnees-personnelles',
            crumbLabel: 'Charte de Protection des Données Personnelles',
          },
          {
            pathname: '/mon-profil',
            crumbLabel: 'Mon profil',
          },
          {
            pathname: '/gerer-salaries',
            crumbLabel: 'Gérer mes salariés',
          },
          {
            pathname: '/gerer-citoyens',
            crumbLabel: 'Gérer mes citoyens',
          },
          {
            pathname: '/administrer-demandes',
            crumbLabel: 'Administrer les demandes',
          },
          {
            pathname: '/mon-dashboard',
            crumbLabel: 'Mon tableau de bord',
          },
        ],
      },
    },
    {
      resolve: 'gatsby-plugin-postcss',
      options: { postCssPlugins: [require('tailwindcss')] },
    },
    'gatsby-plugin-typescript',
    'gatsby-plugin-sass',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        path: `${__dirname}/src/pages`,
        name: 'pages',
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        path: `${__dirname}/src/assets/images`,
        name: 'images',
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        path: `${__dirname}/src/assets/svg`,
        name: 'images',
      },
    },
    'gatsby-transformer-remark',
    {
      resolve: `gatsby-plugin-env-variables`,
      options: {
        allowList: [
          'ADMIN_ACCES_ROLE',
          'PATH_API',
          'API_KEY',
          'PACKAGE_VERSION',
        ],
      },
    },
    {
      resolve: 'gatsby-plugin-purgecss', // purges all unused/unreferenced css rules
      options: {
        develop: true,
        ignore: [
          '_aides-nationales.scss',
          '_select-field.scss',
          '_text-field.scss',
          '_connexion-inscription.scss',
          '_form-section.scss',
          '_status-nav.scss',
          '_base.scss',
          '_card.scss',
          '_tabs-menu.scss',
          '_datePicker.scss',
          'node_modules/react-date-picker/dist/DatePicker.css',
          'node_modules/react-calendar/dist/Calendar.css',
        ],
        whitelist: [
          'breadcrumb__list',
          'breadcrumb__list__item',
          'breadcrumb__link__active',
          'breadcrumb__separator',
        ], // Activates purging in npm run develop
      },
    }, // must be after other CSS plugins
    'gatsby-plugin-use-query-params',
    'gatsby-plugin-image',
    'gatsby-plugin-sharp',
    'gatsby-transformer-sharp',
    {
      resolve: 'gatsby-plugin-breakpoints',
      options: {
        queries: {
          sm: '(min-width: 576px)',
          md: '(min-width: 768px)',
          l: '(min-width: 1024px)',
          xl: '(min-width: 1440px)',
          portrait: '(orientation: portrait)',
        },
      },
    },
    'gatsby-plugin-react-helmet',
  ],
};
