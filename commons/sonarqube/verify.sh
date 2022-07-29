#!/bin/bash
export SONAR_LOGIN=${SONAR_TOKEN}

# Determine absolute path of the current script and CD to this location
SCRIPT_PATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

# Determine project location
if [ "$CI" == "true" ]
then
  LOCATION=cicd
else
  LOCATION=local
fi

# Determine project path and key
export PROJECT_PATH=${CI_PROJECT_DIR}/${MODULE_PATH}
export PROJECT_KEY=${MODULE_NAME}_${GITLAB_BRANCH}_${LOCATION}

# Get the sonar-project.properties on the project module
SONAR_EXCLUSIONS=$(cat ${PROJECT_PATH}/sonar-project.properties | grep sonar.exclusions | sed 's/^.*=//' )
SONAR_CPD_EXCLUSIONS=$(cat ${PROJECT_PATH}/sonar-project.properties | grep sonar.cpd.exclusions | sed 's/^.*=//' )

# Generate sonar-project.properties file inside project home directory
(cat - << EOF
sonar.projectName=${MODULE_NAME}
sonar.projectBaseDir=${PROJECT_PATH}
sonar.sources=${SONAR_SOURCES}
sonar.sourceEncoding=UTF-8
sonar.working.directory=${PROJECT_PATH}/.scannerwork
sonar.exclusions=${SONAR_EXCLUSIONS}
sonar.cpd.exclusions=${SONAR_CPD_EXCLUSIONS}
sonar.javascript.lcov.reportPaths=coverage/lcov.info
EOF
) | envsubst > ${PROJECT_PATH}/sonar-project.properties

# Log content of file for debugging purposes
echo "[beginning of sonar-project.properties file]"
cat ${PROJECT_PATH}/sonar-project.properties
echo "[end of sonar-project.properties file]"

# Avoid exiting when a failed quality gate is returned through 'yarn verify'
# then, to be able to get Sonarqube Quality Gate report
cd ${SCRIPT_PATH} ; yarn verify

# Get the ok/nok status returned by Sonarqube Quality Gate
RETURN=`echo $?`

# Move to the scanned project directory
cd ${PROJECT_PATH}

# Get the project key to request Sonarqube API
PROJECT_KEY=`head -1 ${PROJECT_PATH}/.scannerwork/report-task.txt | awk -F= '{print $2}'`
ls ${PROJECT_PATH}/.scannerwork

# API Sonarqube Issues pagination + curl look not to work well,
# indeed when p=nb (page number) or ps=size (page size) is added as a new parameter then
# curl is not responding at all
# so the first 100 issues will be displayed
echo "Project key: ${PROJECT_KEY}"
echo "curl -u SONAR_TOKEN: ${SONAR_URL}/api/issues/search?componentKeys=${PROJECT_KEY}"
curl -u ${SONAR_TOKEN}: ${SONAR_URL}/api/issues/search?componentKeys=${PROJECT_KEY} > ${PROJECT_PATH}/sonarqube_issues

# API Sonarqube Quality Gate
echo "curl -u SONAR_TOKEN: ${SONAR_URL}/api/qualitygates/project_status?projectKey=${PROJECT_KEY}"
curl -u ${SONAR_TOKEN}: ${SONAR_URL}/api/qualitygates/project_status?projectKey=${PROJECT_KEY} > ${PROJECT_PATH}/sonarqube_quality_gate_report
cat ${PROJECT_PATH}/sonarqube_quality_gate_report

exit $RETURN
