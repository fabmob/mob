# Description

Le service website se base sur le framework **[GATSBY](https://www.gatsbyjs.com/)** basé sur react js

Il s'agit du portail de la plateforme [MCM](https://moncomptemobilite.fr/).
Il fournit le contenu rédactionnel du site ainsi que les ressources statiques permettant d'initialiser l'application web monopage.

Il est directement connecté avec l'[api](/api/README.md) moB qui fournit le catalogue d'aides à la mobilité, mais aussi des [fonctionnalités](/CHANGELOG.md) :

- Inscription
- Recherche d'aide
- Souscriptions à une aide
- Gestion des demandes des citoyens
- ...

## Principes généraux et vue simplifiée

Les rédacteurs peuvent intervenir sur les pages grâce au CMS Headless [netlify_cms](https://www.netlifycms.org/).
Ce dernier fonctionne sans base de données et stocke ses enregistrements dans GitLab.

Un site statique fortement optimisé est généré par le pipeline de build, à l'aide du SSG (Static Site Generator) Gatsby et Webpack.

# Configurer Netlify

- Changer le nom du fichier _config.yml.with-variables_ en _config.yml_
- Lancer `npx netlify-cms-proxy-server`
- Aller sur l'url http://localhost:8000/admin/

# Installation en local

## Variables

| Variables                         | Description                            | Obligatoire |
| --------------------------------- | -------------------------------------- | ----------- |
| API_KEY    | Api Key en header des requêtes pour l'api        | Oui         |
| LANDSCAPE  | Nom de l'environnement (preview, testing ..)     | Non         |
| IDP_FQDN | Url de l'idp  | Non         |
| DEFAULT_LIMIT                  | Limit par défaut possible pour la pagination                                 | Oui         |

## Lancement de l'application

### Prérequis

Avoir la version 14.17.6 de [NodeJS](https://nodejs.org/)

## Sous Linux

### Passer en root

```sh
sudo -s
```

### Installer nvm qui permet de switcher de version de npm au besoin

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
exit
```

### Repasser en compte sans privilèges (non-root)

```sh
nvm --version
```

### Installer la v14 de node, la 16 n’étant pas compatible

```sh
nvm install v14.17.6
```

### Sélectionner la version installée comme celle qu’on souhaite utiliser

```sh
nvm use v14.17.6
```

### Redémarrer Ubuntu (fermer et rouvrir Ubuntu)

```sh
npm install -g gatsby-cli
```

### Installation lib libpng-dev

```sh
sudo apt-get update -y
sudo apt-get install -y libpng-dev
```

### Ajouter dans website/static un fichier keycloak.json

```json
{
  "url": "http://localhost:9000/auth",
  "realm": "<your realm idp name>",
  "clientId": "<your clientId idp>",
  "enable-cors": true
}
```

### Ajouter dans website/static un fichier analytics.json

```json
{
  "url": "http://localhost:8084"
}
```

### Exécuter la commande pour installer les packages

```sh
yarn install
```

### Exécuter la commande pour lancer l’application

```sh
gatsby develop
```


## URL / Port

- URL : localhost
- Port : 8000

# Précisions pipelines

L'image de l'api est basée sur celle de nginx.

La variable PACKAGE_VERSION (voir commons) permet de repérer la dernière version publiée.

## Preview

Pas de précisions nécéssaires pour ce service


## Testing

Pas de précisions nécéssaires pour ce service

# Relation avec les autres services

Website communique avec l'[api](/api/README.md) pour envoyer ou récupérer des informations.

Website communique avec l'[idp](/idp/README.md) pour la gestion des autorisations, connexions, rafraichissement des tokens ...

Website envoie des données vers l'[analytics](/analytics/README.md) permettant de tracker certains KPI tout en respectant les règles RGPD.

**Bilan des relations:**

- Requête HTTP de _website_ vers _api_
- Redirections entre de _website_ et _idp_
- Requête HTTP de _website_ vers _analytics_

# Tests Unitaires

```sh
yarn test
```
