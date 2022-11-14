ARG BASE_IMAGE_SONAR
FROM ${BASE_IMAGE_SONAR}

WORKDIR /opt/mcm-verify/

# Add yarn to install sonarqube-verify module
# because npm install can not manage postinstall stage
# Add jq to tranform Sonarqube analysis report to Codeclimate subset report
# Add curl to request Sonarqube API
# Add gettext to install envsubst
RUN apk add yarn jq curl gettext openjdk8-jre

# Copy node.js code
COPY patch-package-json.js .

# Install modules
COPY package.json .
RUN yarn install

# Set a link to avoid npm plugin sonarqube-verify to download sonar-scanner
# whereas it is provided in the docker image
#RUN ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/local/bin
RUN cat /opt/sonar-scanner/bin/sonar-scanner
RUN mkdir -p /tmp/.sonar/native-sonar-scanner/sonar-scanner-4.5.0.2216-linux/bin/
RUN ln -s /opt/sonar-scanner/bin/sonar-scanner /tmp/.sonar/native-sonar-scanner/sonar-scanner-4.5.0.2216-linux/bin/sonar-scanner

# Add scripts to verify
COPY verify.sh .
RUN chmod u+x verify.sh

COPY convert_sonarqube_issues.sh .
RUN chmod u+x convert_sonarqube_issues.sh
