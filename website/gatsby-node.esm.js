import path from 'path';
import webpack from 'webpack';

exports.createPages = async ({ actions, graphql }) => {
  const { createPage } = actions;

  return graphql(`
    {
      allMarkdownRemark {
        edges {
          node {
            id
            fields {
              slug
            }
            frontmatter {
              title
              templateKey
            }
          }
        }
      }
    }
  `).then((result) => {
    if (result.errors) {
      result.errors.forEach((e) => console.error(e.toString()));
      return Promise.reject(result.errors);
    }

    const posts = result.data.allMarkdownRemark.edges;

    posts.forEach((edge) => {
      if (edge.node.frontmatter.templateKey !== 'signup-settings') {
        const { id } = edge.node;
        createPage({
          path: edge.node.fields.slug,
          component: path.resolve(
            `src/templates/${String(edge.node.frontmatter.templateKey)}.tsx`
          ),
          // additional data can be passed via context
          context: {
            id,
          },
        });
      }
    });
  });
};

exports.onCreatePage = async ({ page, actions }) => {
  const { createPage } = actions;

  if (page.path.match(/^\/inscription\/inscription/)) {
    createPage({
      path: `/inscription`,
      matchPath: `/inscription/*`,
      component: path.resolve(`src/pages/inscription/inscription.tsx`),
    });
  }
  if (page.path.match(/^\/app\/administrer-demandes/)) {
    createPage({
      path: `/administrer-demandes`,
      matchPath: `/administrer-demandes/*`,
      component: path.resolve(`src/pages/app/administrer-demandes.tsx`),
    });
  }
  if (page.path.match(/^\/app\/gerer-salaries/)) {
    createPage({
      path: `/gerer-salaries`,
      matchPath: `/gerer-salaries/*`,
      component: path.resolve(`src/pages/app/gerer-salaries.tsx`),
    });
  }
  if (page.path.match(/^\/app\/gerer-citoyens/)) {
    createPage({
      path: `/gerer-citoyens`,
      matchPath: `/gerer-citoyens/*`,
      component: path.resolve(`src/pages/app/gerer-citoyens.tsx`),
    });
  }
  if (page.path.match(/^\/app\/subscriptions/)) {
    createPage({
      path: `/subscriptions/new`,
      matchPath: `/subscriptions/new`,
      component: path.resolve(`src/pages/app/subscriptions.tsx`),
    });
  }
};

exports.onCreateWebpackConfig = ({ actions, loaders }) => {
  actions.setWebpackConfig({
    resolve: {
      alias: {
        // Absolute imports instead of @/components it will be 'components/example'
        // PS we can put other aliases in here though
        '@components': path.resolve(__dirname, 'src/components'),
        '@customHooks': path.resolve(__dirname, 'src/customHooks'),
        '@helpers': path.resolve(__dirname, 'src/helpers'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@templates': path.resolve(__dirname, 'src/templates'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@api': path.resolve(__dirname, 'src/apiMob'),
        '@fixtures': path.resolve(__dirname, 'src/fixtures'),
        '@cms': path.resolve(__dirname, 'src/cms'),
        '@modules': path.resolve(__dirname, 'src/modules'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@constants': path.resolve(__dirname, 'src/constants'),
        '@environment': path.resolve(__dirname, 'src/environment'),
      },
    fallback: {
      crypto: false,
      buffer: require.resolve('buffer/'),
      assert: require.resolve('assert'),
      stream: false,
      constants: false,
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^netlify-identity-widget$/,
    }),
  ],
  });
};
