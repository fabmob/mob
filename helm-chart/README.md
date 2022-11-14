# Description

Ce dossier correspond à la partie [Helm Chart](https://helm.sh/) des pipelines et constitue donc la livraison à l'équipe OPS de notre code afin de le déployer sur un environnement sécurisé de préproduction et production.

Ainsi, sont fournis aux OPS :
- la pipeline de déploiement
- un package helm par environnement
- les images buildées de la dernière version du code de certaines images

On peut donc retrouver les templates et les fichiers values servant au déploiement Helm.

Ils sont variabilisés pour correspondre aux environnements PPRD/PROD.
