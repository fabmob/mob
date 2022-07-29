const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = {
  // "proxy" ne fonctionne pas:
  developMiddleware: (app) => {
    process.env.MCM_WEBSITE_URL
      ? app.use(
          '/api/**',
          createProxyMiddleware({
            target: process.env.MCM_WEBSITE_URL,
            changeOrigin: true,
            logLevel: 'debug',
            debug: true,
          })
        )
      : null;
  },
  siteMetadata: {
    title: 'Gatsby + Netlify CMS Starter',
    description:
      'This repo contains an example business website that is built with Gatsby, and Netlify CMS.It follows the JAMstack architecture by using Git as a single source of truth, and Netlify for continuous deployment, and CDN distribution.',
  },
  plugins: [
    {
      resolve: `gatsby-plugin-netlify-cms`,
      modulePath: `${__dirname}/src/cms/cms.js`,
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
            pathname: '/aide-page',
            crumbLabel: "Fiche d'aide",
          },
          {
            pathname: '/recherche',
            crumbLabel: 'Rechercher une aide',
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
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-sass',
    {
      // keep as first gatsby-source-filesystem plugin for gatsby image support
      resolve: 'gatsby-source-filesystem',
      options: {
        path: `${__dirname}/static/uploads`,
        name: 'uploads',
      },
    },
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
    'gatsby-transformer-sharp',
    'gatsby-plugin-sharp',
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        plugins: [
          {
            resolve: 'gatsby-remark-relative-images',
            options: {
              name: 'uploads',
            },
          },
          {
            resolve: 'gatsby-remark-images',
            options: {
              // It's important to specify the maxWidth (in pixels) of
              // the content container as this plugin uses this as the
              // base for generating different widths of each image.
              maxWidth: 2048,
            },
          },
          {
            resolve: 'gatsby-remark-copy-linked-files',
            options: {
              destinationDir: 'static',
            },
          },
        ],
      },
    },
    {
      resolve: `gatsby-plugin-env-variables`,
      options: {
        allowList: ['ADMIN_ACCES_ROLE', 'PATH_API', 'API_KEY'],
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
        ],
        whitelist: [
          'breadcrumb__list',
          'breadcrumb__list__item',
          'breadcrumb__link__active',
          'breadcrumb__separator',
        ], // Activates purging in npm run develop
      },
    }, // must be after other CSS plugins
    {
      resolve: 'gatsby-plugin-matomo',
      options: {
        siteId: process.env.MATOMO_ID,
        matomoUrl: `https://${process.env.MATOMO_FQDN}`,
        siteUrl: process.env.MCM_WEBSITE_URL,
        // All the optional settings
        requireConsent: false,
        dev: false,
      },
    },
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
  ],
};
