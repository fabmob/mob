# Script must be launched from root directory

node scripts/replace.js $1 "%GITLAB_APP_ID%" "${NETLIFYCMS_APP_ID}"
node scripts/replace.js $1 "%GITLAB_API_URL%" "${CI_API_V4_URL}"
node scripts/replace.js $1 "%GITLAB_URL%" "${CI_API_V4_URL}/../../"
node scripts/replace.js $1 "%GITLAB_BRANCH%" "${CI_COMMIT_REF_NAME}"
node scripts/replace.js $1 "%MCM_GITLAB_DEPLOY_NPM_TOKEN%" "${MCM_GITLAB_DEPLOY_NPM_TOKEN}"
node scripts/replace.js $1 "%NEXUS_NPM_PROXY_TOKEN%" "${NEXUS_NPM_PROXY_TOKEN}"
node scripts/replace.js $1 "%CI_PROJECT_ID%" "${CI_PROJECT_ID}"
