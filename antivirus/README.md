# Description

Le service antivirus se base sur la brique logicielle **[Clamav](https://www.clamav.net/)**

Elle nous permet de scanner les fichiers que nous pouvons recevoir et ainsi de ne pas autoriser l'upload de fichiers vérolés dans notre service de stockage.

Nous utilisons la fonctionnalité INSTREAM de Clamav pour scanner les fichiers.

(Voir relation avec les autres services)

# Installation en local

`docker run -d --name clamav -p 3310:3310 clamav/clamav:stable`

##  URL / Port
- URL : localhost
- Port : 3310


# Précisions pipelines

## Preview

Pas de précisions nécéssaires pour ce service


## Testing

Pas de précisions nécéssaires pour ce service


# Relation avec les autres services

Comme présenté dans le schéma global de l'architecture ci-dessus (# TODO)

L'api effectue une requête TCP vers l'antivirus pour chaque fichier uploadé pour les souscriptions.

L'api effectue une requête TCP via une fonction de scanStream permettant d'analyser le stream binaire des fichiers envoyés. Ainsi, ils ne sont pas stockés (vérolé ou non) dans l'antivirus.

L'antivirus renvoie alors une réponse à l'api en précisant si le fichier est vérolé ou non.

**Bilan des relations:**

- Requête TCP de l'api vers l'antivirus


# Tests Unitaires

Pas de tests unitaires nécéssaires pour ce service

