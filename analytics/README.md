# Description

Le service analytics se base sur la brique logicielle **[Matomo](https://matomo.org/matomo-analytics-the-google-analytics-alternative-that-protects-your-data-variation/)**

Elle nous permet de collecter les données utilisateur sur certaines pages tout en étant RGPD-compliant et ainsi de remonter des métriques d'audiences à des administrateurs fonctionnels.

# Installation en local

Pas d'installation prévue en local pour ce service

## URL / Port

Pas d'installation prévue en local pour ce service

# Précisions pipelines

## Preview

Pas de précisions nécéssaires pour ce service

## Testing

Sur cet environnement, la bdd maria est hébergée sur Azure. Le paramétrage de la bdd est donc à faire en amont.

# Relation avec les autres services

Comme présenté dans le [schéma d'architecture détaillée](docs/assets/MOB-CME_Archi_technique_detaillee.png), les informations désignées pour le tracking sont envoyées à analytics en continu suite à la fréquentation et l'utilisation des services _website_ de la plateforme.

Seulement certaines actions & pages sont trackées au niveau de website et KC.

# Tests Unitaires

Pas de tests unitaires nécéssaires pour ce service
