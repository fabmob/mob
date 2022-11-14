# Description

Dans ce dossier, plusieurs fichiers CI sont présents. Il regroupe les parties communes à tous les déploiements, basés sur la solution [GitLab](https://about.gitlab.com/).

Le _.gitlab-ci.yml_ à la racine décrit les étapes communes à la pipeline des environnements ainsi que les rules pour les déclencher.

Chaque service contient un fichier _.gitlab-ci.yml_ à leur racine ainsi qu'un dossier _.gitlab-ci_ pour décrire les jobs spécifiques associés aux environnements.

Les configurations des services selon les environnements peuvent différer.

Dans le dossier _overlays/config_ se trouvent des fichiers de configuration nécessaires au déploiement du service pour les environnements distants.

## Preview

La pipeline de preview est déclenchée pour chaque branche du projet.

Les déploiements de la pipeline de preview sont fait avec la commande `kubectl` via le fichier _kompose.yml_ et des _overlays_ qui accompagnent chaque service.

Dans le dossier _overlays_ se trouvent des configurations d'objets Kubernetes à appliquer dans le déploiement et non descriptibles dans le _kompose.yml_.

Certains services ne sont configurés que sur la branche principale et les autres branches de déploiement s'appuient dessus (s3/antivirus/vault/analytics)

## Testing

La pipeline de testing est déclenchée à la création d'un branche de Release Candidate (rc-vX-X-X).

Elle se rapproche au maximum du déploiement fait pour les environnements de PPRD et PROD.

Les déploiements de la pipeline de testing sont fait grâce à [Helm](https://helm.sh/) via des fichiers _Chart.yaml_ & ${MODULE_NAME}-testing-values.yaml qui accompagnent chaque service.

# Helm

La pipeline "helm" est déclenchée à la création d'une Release sur le tag assiocié à la release candidate.

Celle-ci permet de livrer le code à l'équipe OPS en charge des déploiements PPRD et PROD.

Ainsi, nous leur fournissons la pipeline de déploiement, un package helm par environnement, les images buildées de la dernière version du code de certaines images.

# Variables

Certaines variables comme les FQDN ou les images docker sont spécifiées dans les fichiers _gilab-ci.yml_ de ce dossier.


## Variables CI Communes preview & testing

| Variables                                     | Description | Service ou Utilisation |
| --------------------------------------------- | ----------- | ---------------------- |
| ADMIN_FONCTIONNEL_PASSWORD                  | Password de l'admin fonctionnel | JDD (test)
| ANALYTICS_MCM_WEBSITE_ID                   | Id analytics de website | WEBSITE
| BASE_DOMAIN                                  | Base domaine url | CICD
| BUS_CONSUMER_QUEUE                          | Nom de la queue pour le consumer | BUS & API
| BUS_MCM_HEADERS                             | Header d'échange de publication | BUS & API
| BUS_MCM_MESSAGE_TYPE                       | Message type d'échange de la publication | BUS & API
| CITOYEN_PASSWORD                             | Password citoyen | CYPRESS
| DEFAULT_CITIZEN_PASSWORD                    | Password citoyen | JDD (test)
| DEFAULT_FUNDER_PASSWORD                     | Password financeur | JDD (test)
| FORTIFY_API_ACCESS_KEY                     | Access key analyse SAST | SAST (commons)
| FORTIFY_API_KEY                             | Api key analyse SAST | SAST (commons)
| FORTIFY_API_URL                             | URL analyse SAST | SAST (commons)
| FORTIFY_APPLICATION_NAME                    | Application name SAST | SAST (commons)
| FORTIFY_PORTAL_URL                          | Url du portail SAST | SAST (commons)
| FORTIFY_TENANT_CODE                         | Tenant code SAST | SAST (commons)
| FORTIFY_TENANT_ID                           | Tenant id SAST | SAST (commons)
| FRANCE_CONNECT_IDP_PROVIDER_CLIENT_SECRET    | Client ID de l’identity provider de France Connect | IDP
| FRANCE_CONNECT_IDP_PROVIDER_CLIENT_ID    | Client ID de l’identity provider de France Connect | IDP
| IDP_MCM_IDENTITY_PROVIDER_CLIENT_ID      | Client id identity provider Azure AD | IDP
| IDP_MCM_IDENTITY_PROVIDER_CLIENT_SECRET  | Client secret identity provider Azure AD | IDP
| MAILHOG_EMAIL_FROM                          | Email from | API
| MAILHOG_EMAIL_FROM_KC                      | Email from | IDP
| NEXUS_DOCKER_REPOSITORY_URL                | Url nexus docker repository | CICD
| NEXUS_ROOT_PASSWORD                         | Password root nexus | CICD
| NEXUS_ROOT_USER                             | User root nexus | CICD
| PACKAGE_VERSION                             | Release version | CICD
| PACKAGE_VERSION_SAVE                             | Release version pour rollback | CICD
| PUBLICATION_EMAIL                            |
| PUBLICATION_URL                              |
| SONAR_TOKEN                                  | Token sonar | CICD
| SONAR_URL                                    | Url sonar | CICD

## Preview

Des variables peuvent être spécifiées lors du lancement d'une pipeline

| Variables      | Value | Description |
| ----------- | ----------- | ----------- |
| SKIP_TEST      | yes | Permet de skipper les TU de la pipeline pour API & Website      |
| MIGRATION_STRATEGY   | yes | Permet de reimporter le realm mcm pour l'IDP          |
| CLEAN_DATA   | yes | Permet de rendre disponible seulement les jobs de JDD et clean data pour l'api et l'IDP      |

| Variables                                     | Description | Service ou Utilisation |
| --------------------------------------------- | ----------- | ---------------------- |
| AFFILIATION_JWS_KEY                         | Clé jws utilisée pour signer le token d'affiliation citoyen à une entreprise | API
| ANALYTICS_DB_DEV_PASSWORD                  | Password de la bdd | ANALYTICS
| ANALYTICS_DB_DEV_USER                      | User bdd | ANALYTICS
| ANALYTICS_DB_ROOT_PASSWORD                 | Password root de la bdd | ANALYTICS
| ANALYTICS_SUPER_EMAIL                       | Adresse mail de connexion portail | ANALYTICS
| ANALYTICS_SUPER_PASSWORD                    | Password de connexion portail | ANALYTICS
| ANALYTICS_SUPER_USER                        | Username de connexion portail | ANALYTICS
| API_KEY                                      | Api Key en header des requêtes pour l'api | API & WEBSITE
| BUS_ADMIN_PASSWORD                          | Password pour la connexion au portail | BUS
| BUS_ADMIN_USER                              | Username pour la connexion au portail | BUS
| BUS_MCM_CONSUME_PASSWORD                   | Password pour la réception des messages | BUS & API
| BUS_MCM_CONSUME_USER                       | Username pour la réception des messages | BUS & API
| IDP_ADMIN_PASSWORD                          | Password pour la connexion au portail | IDP
| IDP_ADMIN_USER                              | Username pour la connexion au portail | IDP
| IDP_API_CLIENT_SECRET                      | Secret key du client API | IDP & API
| IDP_SIMULATION_MAAS_CLIENT_SECRET         | Secret key du client SIMULATION-MAAS-BACKEND | IDP
| MONGO_DB_NAME                               | Nom de la bdd mongo | API
| MONGO_ROOT_PASSWORD                         | Password root de la bdd mongo | API
| MONGO_ROOT_USER                             | User root de la bdd mongo | API
| MONGO_SERVICE_PASSWORD                      | Password service bdd mongo | API
| MONGO_SERVICE_USER                          | User service bdd mongo | API
| NETLIFYCMS_APP_ID                           | ID netlify gitlab | WEBSITE
| PGSQL_FLEX_SSL_CERT                        | Certificat ssl flex pour pgsql | API
| PGSQL_NAME                                   | Nom de la bdd | API & IDP
| PGSQL_SERVICE_PASSWORD                      | Password de service pgsql (readaccess) | API
| PGSQL_SERVICE_USER                          | Username de service pgsql (readaccess) | API
| S3_ROOT_PASSWORD                            | Password root | S3
| S3_ROOT_USER                                | User root | S3
| S3_SERVICE_PASSWORD                         | Password compte de service | S3
| S3_SERVICE_USER                             | User compte de service | S3
| S3_SUPPORT_PASSWORD                         | Password compte de support | S3
| S3_SUPPORT_USER                             | User compte de support | S3
| VAULT_FUNDER_TOKEN                          | Token financeur vault | VAULT

## Testing

| Variables                                     | Description | Service ou Utilisation |
| --------------------------------------------- | ----------- | ---------------------- |
| TESTING_AFFILIATION_JWS_KEY                         | Clé jws utilisée pour signer le token d'affiliation citoyen à une entreprise | API
| TESTING_ANALYTICS_DB_DEV_PASSWORD                  | Password de la bdd | ANALYTICS
| TESTING_ANALYTICS_DB_DEV_USER                      | User bdd | ANALYTICS
| TESTING_ANALYTICS_SUPER_EMAIL                       | Adresse mail de connexion portail | ANALYTICS
| TESTING_ANALYTICS_SUPER_PASSWORD                    | Password de connexion portail | ANALYTICS
| TESTING_ANALYTICS_SUPER_USER                        | Username de connexion portail | ANALYTICS
| TESTING_API_KEY                                      | Api Key en header des requêtes pour l'api | API & WEBSITE
| TESTING_BUS_ADMIN_PASSWORD                          | Password pour la connexion au portail | BUS
| TESTING_BUS_ADMIN_USER                              | Username pour la connexion au portail | BUS
| TESTING_BUS_MCM_CONSUME_PASSWORD                   | Password pour la réception des messages | BUS & API
| TESTING_BUS_MCM_CONSUME_USER                       | Username pour la réception des messages | BUS & API
| TESTING_IDP_API_CLIENT_SECRET                      | Secret key du client API | IDP & API
| TESTING_IDP_SIMULATION_MAAS_CLIENT_SECRET         | Secret key du client SIMULATION-MAAS-BACKEND | IDP
| TESTING_MARIADB_SERVICE_NAME  | Host de la bdd maria | ANALYTICS
| TESTING_MONGO_DB_NAME                               | Nom de la bdd mongo | API
| TESTING_MONGO_HOST                          | Host mongo | API
| TESTING_MONGO_SERVICE_PASSWORD                      | Password service bdd mongo | API
| TESTING_MONGO_SERVICE_PORT                 | Port host mongo | API
| TESTING_MONGO_SERVICE_USER                          | User service bdd mongo | API
| TESTING_MONGO_URL                           | Url srv complète de connexion mongo | API
| TESTING_PGSQL_ADMIN_PASSWORD                           | Password de connexion portail | IDP
| TESTING_PGSQL_ADMIN_USER                           | Username de connexion portail | IDP
| TESTING_PGSQL_DEV_PASSWORD                           | Password dev user bdd pgsql | IDP
| TESTING_PGSQL_DEV_USER                           |  Username dev user bdd pgsql | IDP
| TESTING_PGSQL_FLEX_ADDRESS                           | Adresse bdd pgsql flex serveur  | IDP
| TESTING_PGSQL_NAME                                   | Nom de la bdd pgsql | API & IDP
| TESTING_PGSQL_PORT                                   | Port de la bdd pgsql | API
| TESTING_PGSQL_SERVICE_PASSWORD                      | Password de service bdd pgsql (readaccess) | API
| TESTING_PGSQL_SERVICE_USER                          | Username de service bdd pgsql (readaccess) | API
| TESTING_PGSQL_VENDOR                          | Type de la bdd | IDP
| TESTING_S3_ROOT_PASSWORD                            | Password root | S3
| TESTING_S3_ROOT_USER                                | User root | S3
| TESTING_S3_SERVICE_PASSWORD                         | Password compte de service | S3
| TESTING_S3_SERVICE_USER                             | User compte de service | S3
| TESTING_S3_SUPPORT_PASSWORD                         | Password compte de support | S3
| TESTING_S3_SUPPORT_USER                             | User compte de support | S3
