# Description

Le service idp se base sur la brique logicielle **[Keycloak](https://www.keycloak.org/docs/16.1/)**

Elle permet de gérer les identités ainsi que de procéder au management des accès aux différentes ressources des utilisateurs.

Nous avons ainsi plusieurs types d'utilisateurs :

- Citoyens
- Administrateur fonctionnel
- Utilisateurs Financeurs
- Comptes de services des clients confidentiels

Un template MCM a aussi été créé.

# Installation en local

## Postgresql

```sh
docker run -d --name postgres-mcm -p 5432:5432 -e POSTGRES_ROOT_PASSWORD=${ROOT_PASSWORD} -e POSTGRES_DB=idp_db -e POSTGRES_USER=${DB_USER} -e POSTGRES_PASSWORD=${DB_PASSWORD} -d postgres:13.6
# Executer une commande pour modifier le schema public
docker exec -it postgres-mcm psql -U admin -a idp_db -c 'ALTER SCHEMA public RENAME TO idp_db;'
# Exectuer une commande pour changer le type du champs value dans la table user_attribute
docker exec -it postgres-mcm psql -U admin -a idp_db -c 'ALTER TABLE idp_db.user_attribute ALTER COLUMN value TYPE TEXT;'
```

## Keycloak

```sh
docker run -d --link postgres-mcm --name keycloak -p 9000:8080 -e KEYCLOAK_USER=${USER} -e KEYCLOAK_PASSWORD=${PASSWORD} -e DB_VENDOR=postgres -e DB_ADDR=postgres-mcm -e DB_PORT=5432 -e DB_DATABASE=idp_db -e DB_SCHEMA=idp_db -e DB_USER=${DB_USER} -e DB_PASSWORD=${DB_PASSWORD} -e JAVA_OPTS_APPEND="-Dkeycloak.profile.feature.scripts=enabled" jboss/keycloak:16.1.1
```

### Configuration du container KC

Ouvrir un terminal vers le répertoire parent du projet « platform » puis lister les images docker en cours

```sh
docker ps
```

Entrer la commande suivante en remplaçant <CONTAINER ID> par le container id qui apparait dans le terminal

```sh
docker exec -it <CONTAINER ID> bash
```

Executer ensuite la commande pour créer le dossier allant contenir la blacklist des passwords

```sh
mkdir /opt/jboss/keycloak/standalone/data/password-blacklists
```

Sortir du container (exit) et executer la commande suivante

```sh
docker cp ./platform/idp/password-blacklists/blacklist.txt <CONTAINER ID>:/opt/jboss/keycloak/standalone/data/password-blacklists

docker cp ./platform/idp/mcm_template <CONTAINER ID>:/opt/jboss/keycloak/themes/mcm_template
```

Récupérer le fichier overlays/realms/mcm-realm.json

> **Note** La liste des variables à remplacer est fournie ci-dessous néanmoins cela n'empêche pas l'import du realm **mcm**. Vous pourrez modifier ces variables via l'interface si besoin.

Importer le realm **mcm** via l'interface Keycloak

## Variables

| Variables                                 | Description                                                  | Obligatoire |
| ----------------------------------------- | ------------------------------------------------------------ | ----------- |
| IDP_API_CLIENT_SECRET                     | Client secret du client confidentiel API                     | Non         |
| IDP_SIMULATION_MAAS_CLIENT_SECRET         | Client secret du client confidentiel simulation-maas-backend | Non         |
| MAIL_API_KEY                              | Api key SMTP si auth true                                    | Non         |
| SMTP_AUTH                                 | Boolean pour savoir si nécessite un user/password            | Non         |
| MAIL_PORT                                 | Port SMTP                                                    | Non         |
| MAIL_HOST                                 | Host SMTP                                                    | Non         |
| EMAIL_FROM_KC                             | Email from                                                   | Non         |
| MAIL_USER                                 | Username SMTP si auth true                                   | Non         |
| IDP_MCM_IDENTITY_PROVIDER_CLIENT_ID       | Client id identity provider Azure AD                         | Non         |
| IDP_MCM_IDENTITY_PROVIDER_CLIENT_SECRET   | Client secret identity provider Azure AD                     | Non         |
| IDP_MCM_IDENTITY_PROVIDER_CLIENT_SECRET   | Client secret identity provider Azure AD                     | Non         |
| FRANCE_CONNECT_IDP_PROVIDER_CLIENT_ID     | Client ID de l’identity provider de France Connect           | Non         |
| FRANCE_CONNECT_IDP_PROVIDER_CLIENT_SECRET | Client secret identity provider Azure AD                     | Non         |

## Redirect URI

Dans les clients platform, administration et simulation-maas-client, des redirects URI sont à adapter selon l'environnement.

> **Note** Comme mentionné, elles sont modifiables directement sur le realm avant import ou via l'interface Keycloak.

Ces redirect URI sont nécessaires pour pouvoir se connecter sur [Website](website), [Administration](administration), [Simulation-maas](simulation-maas) ou l'[api](api).

| Variables            | Description             | Obligatoire |
| -------------------- | ----------------------- | ----------- |
| WEBSITE_FQDN         | Url du website          | Oui         |
| ADMIN_FQDN           | Url de l'administration | Oui         |
| API_FQDN             | Url de l'api            | Oui         |
| SIMULATION_MAAS_FQDN | Url de simulation-maas  | Oui         |

## FranceConnect

Le produit s'appuie sur la librairie [Keycloak-FranceConnect](https://github.com/InseeFr/Keycloak-FranceConnect) de l'INSEE pour simplifier l'intégration de FranceConnect.

Executer la commande suivante

```sh
docker cp ./platform/idp/keycloak-franceconnect-4.1.0.jar <CONTAINER ID>:/opt/jboss/keycloak/standalone/deployments
```

Vérifier que les informations de l'Identity Provider France connect sont bien renseignées.

Sur un environnement local ou de test, il est possible de s'appuyer sur le démonstrateur FranceConnect(https://fournisseur-de-service.dev-franceconnect.fr/).

## Javascript Providers

[Keycloak Javascript Provider](https://www.keycloak.org/docs/16.1/server_development/#_script_providers)

Pour pouvoir executer des actions supplémentaires sur les flows d'authentification KC, des javascripts providers ont été mis en place.

```sh
docker cp ./platform/idp/scripts/scripts.jar <CONTAINER ID>:/opt/jboss/keycloak/standalone/deployments/scripts.jar
```

Si une modification est faite sur ces scripts, il faudra regénerer le fichier scripts.jar

## URL / Port

Portail d'admin :

- URL : localhost
- Port : 9000

# Précisions pipelines

## Preview

Les realms sont automatiquement importés au déploiement.

Si une mise à jour du realm est nécessaire, vous pouvez lancer la pipeline avec l'option "MIGRATION_STRATEGY" à "yes"

Le deploiement en preview permet de déployer un second Keycloak sur une bdd H2 permettant de tester des connexions inter-IDP.

Un script est lancé au déploiement de la bdd pgsql permettant d'aller altérer le schema et de créer l'utilisateur de service nécessaire pour l'api. (databaseConfig/createServiceUser.sh)

Un job est lancé au déploiement de la bdd pgsql permettant d'aller altérer le type du champ value de la table user_attributes.

## Testing

Le fichier mcm-realm.json n'est pas importé au déploiement. Il faudra l'importer manuellement comme précisé pour l'installation locale.

Sur cet environnement, la bdd pgsql est externalisée. Le paramétrage de la bdd est donc à faire en amont.

# Relation avec les autres services

Comme présenté dans le schéma global de l'architecture ci-dessous

![technicalArchitecture](../docs/assets/MOB-CME_Archi_technique_detaillee.png)

L'idp est en relation avec plusieurs services:

Il est en relation avec _simulation_maas_ également.

Plusieurs de ces services utilisent la librairie [keycloak-js](https://www.npmjs.com/package/keycloak-js) afin de gérer les connexions, les accès des utilisateurs ainsi que les CRUD des utilisateurs.

# Tests Unitaires

Pas de tests unitaires nécéssaires pour ce service
