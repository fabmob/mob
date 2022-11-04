# Description

Le service s3 se base sur la brique logicielle **[MinIO](https://min.io/)**

Elle est compliant s3 et nous permet de stocker les fichiers que nous pouvons recevoir.

Nous utilisons les fontions S3 AWS pour créer des buckets, uploader, downloader des fichiers ...

Les documents stockés sont encryptés en amont grâce au service vault.

L'architecture des buckets est la suivante :

![s3BucketArchitecture](docs/assets/s3BucketArchitecture.png)

(Voir relation avec les autres services)

# Installation en local

`docker run --name minio -p 9001:9000 minio/minio:RELEASE.2021-06-17T00-10-46Z server /data`

⚠ la version minio de l'image de minio n'est pas iso environnement preview & testing

Son installation en local n'est pas requise mais permet de faciliter le parcours fonctionnel pour quelqu'un ne connaissant pas toutes les fonctionnalités de notre produit.

Si vous ne l'installez pas, une erreur sera remontée lorsque vous essayerez d'uploader/downloader des justificatifs via l'api.

L'ajout du compte de service n'est pas nécessaire en local, mais obligatoire sur les environnements distants.

En local, c'est le compte d'admin qui peut être utilisé par l'api.

## Variables

| Variables      | Description | Obligatoire |
| ----------- | ----------- | ----------- |
| S3_SERVICE_USER      | Username pour le compte de service       | Oui |
| S3_SERVICE_PASSWORD   | Password pour le compte de service          | Oui |
| S3_SUPPORT_USER   | Username pour le compte de support       | Non |
| S3_SUPPORT_PASSWORD  | Password pour le compte de support        | Non |

- Compte de service : ReadWrite
- Compte de support : Diagnostics


## URL / Port
- URL : localhost
- Port : 9001

# Précisions pipelines

## Preview

Un job s3mc est lancé au déploiement pour créer les comptes de service et de support.

## Testing

L'ajout des comptes de service et de support est à faire manuellement via l'interface avec les droits mentionnés dans l'installation locale.

Le deploiement de s3 est de type statefulSet.


# Relation avec les autres services

Comme présenté dans le schéma global de l'architecture ci-dessus (# TODO)

L'api effectue une requête HEAD HTTP vers s3 pour vérifier l'existence du bucket (voir achitecture bucket mentionnée au début du fichier).

L'api effectue une requête POST HTTP vers s3 pour créer le bucket s'il n'est pas déjà existant.

L'api effectue une requête POST HTTP vers s3 pour uploader les fichiers dans le bucket associé.

L'api effectue une requête GET HTTP vers s3 pour récupérer les fichiers afin qu'ils soient visualisable via Website.

**Bilan des relations:**

- Requête HTTP de l'api vers s3 pour vérifier existence du bucket
- Requête HTTP de l'api vers s3 pour créer le bucket associé s'il n'existe pas
- Requête HTTP de l'api vers s3 pour enregistrer le fichier
- Requête HTTP de l'api vers s3 pour télécharger le fichier

# Tests Unitaires

Pas de tests unitaires nécéssaires pour ce service

