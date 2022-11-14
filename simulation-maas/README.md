# Description

Le service simulation-mass se base sur du [vanilla-js](http://vanilla-js.com/)

Ce service permet de tester les liaisons de comptes des MaaS avec le système moB.
Ainsi, son interface est basique et simpliste en terme d'UX.

# Installation en local

Modifier les fichiers présents dans le dossier static avec les variables mentionnées ci-dessous

## Variables

| Variables                         | Description                                | Obligatoire                  |
| --------------------------------- | ------------------------------------------ | ---------------------------- |
| IDP_FQDN                          | Url de l'IDP                               | Oui                          |
| API_FQDN                          | Url de l'api                               | Oui                          |
| IDP_MCM_REALM                     | Nom du realm mcm                           | Oui                          |
| IDP_MCM_SIMULATION_MAAS_CLIENT_ID | Client id du client public simulation-maas | Oui                          |
| MCM_IDP_CLIENTID_MAAS_CME         | Client id du client public simulation-maas | Oui (si test France Connect) |

## URL / Port

Portail d'admin :

- URL : localhost
- Port : 8080

## Démarrage

```sh
npm install && npm run start
```

# Précisions pipelines

## Preview

Pas de précisions nécéssaires pour ce service

## Testing

Pas de précisions nécéssaires pour ce service

# Relation avec les autres services

Via simulation-maas, un citoyen peut effectuer une liaison de compte sur un client public. Ceci est fait pour simuler la liaison de compte d'un MaaS avec l'[idp](idp) moB.
Via simulation-maas, un citoyen peut être redirigé sur le début d'une souscription à une aide en envoyant des metadata concernant un justificatif d'achat issu d'une plateforme tierce.

# Tests Unitaires

Pas de tests unitaires nécéssaires pour ce service
