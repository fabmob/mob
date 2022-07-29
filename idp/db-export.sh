export OUTPUT_FNAME=$1
cd /opt/jboss/keycloak/
./bin/standalone.sh -Dkeycloak.migration.action=export -Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=${OUTPUT_FNAME} -Dkeycloak.migration.usersExportStrategy=REALM_FILE -Djboss.socket.binding.port-offset=100 &
PID=$!
sleep 30
kill -INT ${PID}