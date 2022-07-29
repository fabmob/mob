## Check arguments
[ "$#" -ne 1 ] && echo "Un argument est nécessaire [stack|dev]" && exit
[ "$1" != "stack" -a "$1" != "dev" ] && echo "L'argument doit être [stack|dev]" && exit
DIR=$(dirname "$0")
[ ! -z .git ] && export GITLAB_WORKSPACE_BRANCH=$(git branch --show-current)
## Check prerequisites
[ "$1" = "stack" -a -z "$STACK" ] && echo "STACK shall be defined within the stack mode" && exit
[ "$1" = "dev" ] && STACK=$GITLAB_BRANCH
SWARM=$(docker info | grep -i swarm | grep -i inactive)
[ ! -z "$SWARM" ] && echo "Please activate docker swarm with docker swarm init" && exit

## Initialisation
ENV_FILE=$DIR/env.file.$$
envsubst < $DIR/env.file > $ENV_FILE

FILE_NAME_1="keycloak.json"
NAME_1=${FILE_NAME_1/./-}
DEST_FILE_DIR_1="public/"

FILE_NAME_2="netlifycms-config.yml"
DEST_FILE_NAME_2="config.yml"
NAME_2=${FILE_NAME_2/./-}
DEST_FILE_DIR_2="public/admin/"

NAME=my-service

## Robustness
echo "check config $NAME_1"
CONFIG_ID=$(docker config ls | grep $NAME_1)
[ ! -z "$CONFIG_ID" ] && echo "A config named $NAME_1 already exists, please remove it with docker config rm $NAME_1" && exit
echo "check config $NAME_2"
CONFIG_ID=$(docker config ls | grep $NAME_2)
[ ! -z "$CONFIG_ID" ] && echo "A config named $NAME_2 already exists, please remove it with docker config rm $NAME_2" && exit

## Configs creation
echo "creating config $NAME_1"
CONFIG_ID=$(docker config create --template-driver=golang $NAME_1 $FILE_NAME_1)
echo "creating config $NAME_2"
CONFIG_ID=$(docker config create --template-driver=golang $NAME_2 $FILE_NAME_2)

## Service creation
echo "creating service ..."
SERVICE_ID=$(docker service create --env-file $ENV_FILE --name=$NAME --config source=$NAME_1,target=$FILE_NAME_1 --config source=$NAME_2,target=$FILE_NAME_2 nginx:alpine)
echo "service $SERVICE_ID is created"
echo "get related container..."
CTR_ID=$(docker ps -f name=$NAME --quiet)
echo "related container is $CTR_ID"

## Customize keycloak.json -> keycloak.json
mkdir -p public
docker exec $CTR_ID cat $FILE_NAME_1 > $DEST_FILE_DIR_1/$FILE_NAME_1
## Customize netlify-config.yml -> config.yml
mkdir -p public/admin
docker exec $CTR_ID cat $FILE_NAME_2 > $DEST_FILE_DIR_2/$DEST_FILE_NAME_2

## Cleaning
echo "removing service $SERVICE_ID"
docker service rm $SERVICE_ID
echo "removing config $NAME_1"
docker config rm $NAME_1
echo "removing config $NAME_2"
docker config rm $NAME_2
rm $ENV_FILE