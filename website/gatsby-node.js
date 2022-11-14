// eslint-disable-next-line no-global-assign,@typescript-eslint/no-var-requires
const { createFilePath } = require('gatsby-source-filesystem');

const requireEsm = require('esm')(module);

// Fix to bypass gatsby-source-filesystem error
// TODO Must do : Full ts supported since gatsby 4.9 
// https://www.gatsbyjs.com/docs/how-to/custom-configuration/typescript/#initializing-a-new-project-with-typescript
module.exports = {
  ...requireEsm('./gatsby-node.esm.js'),
  onCreateNode: ({ node, actions, getNode }) => {
    const { createNodeField } = actions;

    if (node.internal.type === 'MarkdownRemark') {
      const value = createFilePath({ node, getNode });
      createNodeField({
        name: 'slug',
        node,
        value,
      });
    }
  }
}