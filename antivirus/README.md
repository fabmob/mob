# Description

Le service antivirus se base sur la brique logicielle **[Clamav](https://www.clamav.net/)**

Elle permet de scanner les fichiers que moB peut recevoir lors de la souscription à une aide et ainsi de ne pas autoriser l'upload de fichiers vérolés dans le service de stockage.

C'est la fonctionnalité INSTREAM de Clamav qui est utilisée pour scanner les fichiers.

# Installation en local
```sh
docker run -d --name clamav -p 3310:3310 clamav/clamav:stable
```
##  URL / Port
- URL : localhost
- Port : 3310

# Précisions pipelines

## Preview

Pas de précisions nécéssaires pour ce service

## Testing

Pas de précisions nécéssaires pour ce service

# Relation avec les autres services

Comme présenté dans le [schéma d'architecture détaillée](docs/assets/MOB-CME_Archi_technique_detaillee.png), l'api effectue une requête TCP vers l'antivirus pour chaque fichier uploadé pour les souscriptions.

L'api effectue une requête TCP via une fonction de scanStream permettant d'analyser le stream binaire des fichiers envoyés. Ainsi, ils ne sont pas stockés (vérolé ou non) dans l'antivirus.

L'antivirus renvoie alors une réponse à l'api en précisant si le fichier est vérolé ou non.

**Bilan des relations:**

- Requête TCP de l'api vers l'antivirus

# Tests Unitaires

Pas de tests unitaires nécéssaires pour ce service
