# Description

Le service mailhog se base sur la brique logicielle **[Mailhog](https://github.com/mailhog/MailHog/)**

Elle nous permet de centraliser et de tester l'envoi des mails en local, et sur des environnements de test ne faisant pas appel à un service externe d'envoi de mails. C'est pourquoi ce service n'est pas mentionné dans le [schéma d'architecture détaillée](docs/assets/MOB-CME_Archi_technique_detaillee.png).

Son installation en local n'est pas requise mais permet de faciliter le parcours fonctionnel pour quelqu'un ne connaissant pas toutes les fonctionnalités du produit.

# Installation en local

```sh
docker run -d --name mailhog -p 8025:8025 -p 1025:1025 mailhog/mailhog
```

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

L'[api](api) et l'[idp](idp) sont les deux services pouvant envoyer des mails aux utilisateurs.

**Bilan des relations:**

- Requête SMTP de _api_ vers _mailhog_
- Requête SMTP de _idp_ vers _mailhog_


# Tests Unitaires

Pas de tests unitaires nécéssaires pour ce service

