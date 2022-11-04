# Description

Le service mailhog se base sur la brique logicielle **[Mailhog](https://github.com/mailhog/MailHog/)**

Elle nous permet de centraliser et de tester l'envoie des mails en local, preview & testing.

Son installation en local n'est pas requise mais permet de faciliter le parcours fonctionnel pour quelqu'un ne connaissant pas toutes les fonctionnalités de notre produit.

(Voir relation avec les autres services)

# Installation en local

`docker run -d --name mailhog -p 8025:8025 -p 1025:1025 mailhog/mailhog`

**Si vous souhaitez intégrer mailhog en local, il est nécessaire de créer un network local docker entre toutes les briques et mailhog.**

## URL / Port

Interface :
- URL : localhost
- Port : 8025

SMTP :
- URL : localhost
- Port : 1025


# Précisions pipelines

## Preview

Pas de précisions nécéssaires pour ce service

## Testing

Pas de précisions nécéssaires pour ce service


# Relation avec les autres services

Comme présenté dans le schéma global de l'architecture ci-dessus (# TODO)

L'api et l'idp sont les deux services pouvant envoyer des mails aux utilisateurs.

**Bilan des relations:**

- Requête SMTP de l'api vers mailhog
- Requête SMTP de l'IDP vers mailhog


# Tests Unitaires

Pas de tests unitaires nécéssaires pour ce service

