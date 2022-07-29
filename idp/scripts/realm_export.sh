export STACK_NAME=$1
export REALM_NAME=$2
export OUTPUT_FNAME=$3
echo "Exporting realm ${REALM_NAME} for stack ${STACK_NAME} into ${OUTPUT_FNAME}"
CURR_PID=$$
TMP_FNAME=${CURR_PID}-export.json

CTR_ID=$(docker ps --format "{{.ID}}" --filter "label=com.docker.swarm.service.name=${STACK_NAME}_idp")
docker exec -it -e TMP_FNAME=${TMP_FNAME} ${CTR_ID} bash -c '/db-export.sh /tmp/${TMP_FNAME}'
docker cp "${CTR_ID}:/tmp/${TMP_FNAME}" "/tmp/${TMP_FNAME}"
docker exec -it ${CTR_ID} rm "/tmp/${TMP_FNAME}"
python ./.realm-filter.py "/tmp/${TMP_FNAME}" "${REALM_NAME}" "${OUTPUT_FNAME}"
rm "/tmp/${TMP_FNAME}" || true
