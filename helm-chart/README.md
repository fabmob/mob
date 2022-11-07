# Description

Dans ce dossier, correspond à la partie "helm" des pipelines et constitue donc la livraison à l'équipe Cloud de notre code afin de le déployer en PPRD & PROD.

Ainsi, nous leur fournissons la pipeline de déploiement, un package helm par environnement, les images buildées de la dernière version du code de certaines images.

On peut donc retrouver les templates et les fichiers values servant au deploiement Helm.

Ils sont variabalisés pour correspondondre soit à l'environnement PPRD soit à celui PROD.