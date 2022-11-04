# Description

Le service idp se base sur la brique logicielle **[Keycloak](https://www.keycloak.org/docs/16.1/)**

Elle nous permet de gérer l'identité ainsi que de procéder au management des accès aux différentes ressources des utilisateurs.

Nous avons ainsi plusieurs types d'utilisateurs

- Citoyens
- Administrateur fonctionnel
- Utilisateurs Financeurs
- Comptes de services des clients confidentiels

(Voir relation avec les autres services)

# Installation en local

## Postgresql

`docker run -d --name postgres-mcm -p 5432:5432 -e POSTGRES_ROOT_PASSWORD=${ROOT_PASSWORD} -e POSTGRES_DB=idp_db -e POSTGRES_USER=${DB_USER} -e POSTGRES_PASSWORD=${DB_PASSWORD} -d postgres:13.6`

Exectuer une commande pour modifier le schema public

`docker exec -it postgres-mcm psql -U admin -a idp_db -c 'ALTER SCHEMA public RENAME TO idp_db;'`

## Keycloak

`docker run -d --link postgres-mcm --name keycloak -p 9000:8080 -e KEYCLOAK_USER=${USER} -e KEYCLOAK_PASSWORD=${PASSWORD} -e DB_VENDOR=postgres -e DB_ADDR=postgres-mcm -e DB_PORT=5432 -e DB_DATABASE=idp_db -e DB_SCHEMA=idp_db -e DB_USER=${DB_USER} -e DB_PASSWORD=${DB_PASSWORD} jboss/keycloak:16.1.1`

### Configuration du container KC

Ouvrir un terminal vers le répertoire parent du projet « platform » puis lister les images docker en cours

`docker ps`

Entrer la commande suivante en remplaçant <CONTAINER ID> par le container id qui apparait dans le terminal

`docker exec -it <CONTAINER ID> bash`

Executer ensuite la commande pour créer le dossier allant contenir la blacklist des passwords

`mkdir /opt/jboss/keycloak/standalone/data/password-blacklists`

Sortir du container (exit) et executer la commande suivante

`docker cp ./platform/idp/password-blacklists/blacklist.txt <CONTAINER ID>:/opt/jboss/keycloak/standalone/data/password-blacklists`

Récupérer le fichier overlays/realms/mcm-realm.json

> **Note** La liste des variables à remplacer vous est fournie ci-dessous néanmoins cela n'empêche pas l'import du realm mcm. Vous pourrez modifier ces variables via l'interface si besoin.

Importer le realm mcm via l'interface KC

## Variables

| Variables      | Description | Obligatoire |
| ----------- | ----------- | ----------- |
| IDP_API_CLIENT_SECRET      | Client secret du client confidentiel API       | Non |
| IDP_SIMULATION_MAAS_CLIENT_SECRET      | Client secret du client confidentiel simulation-maas-backend       | Non |
| MAIL_API_KEY   | Api key SMTP si auth true        | Non
| SMTP_AUTH   |    Boolean pour savoir si nécessite un user/password     | Non
| MAIL_PORT   | Port SMTP    | Non
| MAIL_HOST   | Host SMTP    | Non
| EMAIL_FROM_KC   | Email from   | Non
| MAIL_USER   | Username SMTP si auth true   | Non
| IDP_MCM_IDENTITY_PROVIDER_CLIENT_ID      | Client id identity provider Azure AD       | Non |
| IDP_MCM_IDENTITY_PROVIDER_CLIENT_SECRET   | Client secret identity provider Azure AD        | Non |
| IDP_MCM_IDENTITY_PROVIDER_CLIENT_SECRET   | Client secret identity provider Azure AD        | Non |
| FRANCE_CONNECT_IDP_PROVIDER_CLIENT_ID   | Client ID de l’identity provider de France Connect        | Non |
| FRANCE_CONNECT_IDP_PROVIDER_CLIENT_SECRET   | Client secret identity provider Azure AD        | Non

## Redirect URI

Dans les clients platform, administration et simulation-maas-client, vous trouverez des redirects URI à modifier.

> **Note** Comme mentionné, vous pouvez les modifier directement sur le realm avant import ou via l'interface KC.

Ces redirect URI sont nécessaires pour pouvoir vous connectez sur Website, Administration, Simulation-maas ou l'api.

| Variables      | Description | Obligatoire |
| ----------- | ----------- | ----------- |
| WEBSITE_FQDN      | Url du website       | Oui |
| ADMIN_FQDN      | Url de l'administration       | Oui |
| API_FQDN   | Url de l'api        | Oui
| SIMULATION_MAAS_FQDN   | Url de simulation-maas        | Oui

## France connect

Un .jar est fourni afin de pouvoir utiliser France Connect en local

Executer la commande suivante

`docker cp ./platform/idp/keycloak-franceconnect-4.1.0.jar <CONTAINER ID>:/opt/jboss/keycloak/standalone/deployments`

Vérifier que les informations de l'identity provider France connect sont bien renseignées

## URL / Port

Portail d'admin :

- URL : localhost
- Port : 9000

# Précisions pipelines

## Preview

Les realms sont automatiquement importés au déploiement.

Si une mise à jour du realm est nécessaire, vous pouvez lancer la pipeline avec l'option "MIGRATION_STRATEGY" à "yes"

Le deploiement en preview permet de déployer un second Keycloak sur une bdd H2 permettant de tester des connexions inter-IDP.

## Testing

Le fichier mcm-realm.json n'est pas importé au déploiement. Il faudra l'importer manuellement comme précisé pour l'installation locale.

# Relation avec les autres services

Comme présenté dans le schéma global de l'architecture ci-dessus (# TODO)

L'idp est en relation avec plusieurs services:

- Api
- Website
- Simulation-maas
- Administration
- Bus

Plusieurs utilisent la librairie keycloak-js afin de gérer les connexions, les accès des utilisateurs ainsi que les CRUD des utilisateurs.

# Tests Unitaires

Pas de tests unitaires nécéssaires pour ce service
