const path = require('path');

module.exports = {
  setupFilesAfterEnv: [
    path.resolve(__dirname, './jest-configs/setup-test-env.js'),
  ],
  transform: {
    '^.+\\.(tsx?|jsx?)$': `<rootDir>/jest-configs/jest-preprocess.js`,
    '\\.svg': '<rootDir>/jest-configs/__mocks__/svgTransform.jsx',
  },
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: {
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '@helpers/(.*)': '<rootDir>/src/helpers/$1',
    '@pages/(.*)': '<rootDir>/src/pages/$1',
    '@templates/(.*)': '<rootDir>/src/templates/$1',
    '@utils/(.*)': '<rootDir>/src/utils/$1',
    '@api/(.*)': '<rootDir>/src/apiMob/$1',
    '@fixtures/(.*)': '<rootDir>/src/fixtures/$1',
    '@cms/(.*)': '<rootDir>/src/cms/$1',
    '@modules/(.*)': '<rootDir>/src/modules/$1',
    '@assets/(.*)': '<rootDir>/src/assets/$1',
    '@constants': '<rootDir>/src/constants',
    '@environment': '<rootDir>/src/environment',
    '^gatsby-core-utils/(.*)$': `gatsby-core-utils/dist/$1`,
    '^gatsby-page-utils/(.*)$': `gatsby-page-utils/dist/$1`,
    '\\.svg': `<rootDir>/jest-configs/__mocks__/svgTransform.jsx`,
    '.+\\.(png|jpg)$': 'identity-obj-proxy',
    'src/(.*)': '<rootDir>/src/$1',
    'typeface-*': 'identity-obj-proxy',
    '.+\\.(css|styl|less|sass|scss)$': `identity-obj-proxy`,
    '.+\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': `<rootDir>/__mocks__/file-mocks.js`,
    // Jest workaround for latest version of axios
    '^axios$': require.resolve('axios')
  },
  testPathIgnorePatterns: [
    `node_modules`,
    `\\.cache`,
    `<rootDir>.*/public`,
    '<rootDir>/src/helpers/tests/',
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/src/helpers/tests/',
    '<rootDir>/src/utils/https.ts',
    '<rootDir>/src/utils/mockKeycloak.ts',
    '<rootDir>/src/modules/routes/mockKeycloak.ts',
    '<rootDir>/src/constants.ts',
    '<rootDir>/src/context/index.ts',
    '<rootDir>/src/utils/demandes.ts',
    '<rootDir>/src/utils/citoyens.ts',
    '<rootDir>/src/utils/matomo.ts',
    '<rootDir>/src/modules/inscription/components/index.ts',
  ],
  transformIgnorePatterns: [`node_modules/(?!(gatsby)/)`, `\\.svg`],
  modulePathIgnorePatterns: ['<rootDir>/src/helpers/tests/'],
  globals: {
    __PATH_PREFIX__: ``,
  },
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  collectCoverage: false,
  coverageReporters: ['lcov', 'text', 'html'],
};
