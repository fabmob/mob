# Introduction
Ce projet permet de rendre public le processus de développement de l’application Mon Compte Mobilité (MCM). Il est par ailleurs ouvert à toute contribution pertinente visant à l’améliorer (débug, ajout de fonctionnalités, …). Dans ce contexte une partie du code sera mise à disposition sous licence open source et le dépôt de code sera rendu public et ouvert à contribution.

L'ouverture large à contribution se mettra en place progressivement.
* Jusqu'à la publication effective de l'application, tout un chacun pourra consulter le code de l'application. Durant cette phase, nous récolterons les critiques constructives qui visent à contribuer directement au projet. La planification initiale prévoit que cette phase pourrait durer jusqu'à fin 2022.
* Dans un second temps, une procédure explicite sera mise en place pour permettre à tout contributeur d'accéder à l'outil de collaboration pour ouvrir des _issues_ et proposer des _merge request_ pour les sous-projets qui exposent leur dépôt de code.

Les audits de code pour les différentes contributions, notamment pour les aspects sécurité, sont prévus de façon itérative de manière à fluidifier au maximum l’intégration de ces contributions.

# Description des sous-projets/Structure applicative de l'application MCM
* site web : le site web est dans le répertoire website/
* API : les APIs sont dans le répertoire api/.
* fournisseur d'identité : la gestion des identités se trouve dans le répertoire idp/.
* secrets : la gestion des secrets se fait dans le répertoire vault/.
* utilitaires : les utilitaires sont dans le répertoire utils/.

Documentation
* La documentation publique se trouve dans le répertoire docs/.

Formatage du code
* Le formatage se fait à l'aide de prettier (https://prettier.io/).


# Gouvernance et processus de décision
La gouvernance est structurée comme suit :
* Un _core group_ du projet MCM, réunissant les entités qui contribuent au projet ; Ce groupe délègue la maintenance du projet gitlab au quotidien au _comité des mainteneurs_ ;
* Une cellule sécurité.
* Une cellule juridique et Propriété Intellectuelle ;


Les propositions de contribution seront systématiquement soumises à audit afin d’obtenir les avis suivants (non bloquants) :
* Un avis technique ;
* Un avis PI et juridique ;
* Un avis sécurité ;
* Un avis fonctionnel.

Le _comité des mainteneurs_ se réunira de façon régulière pour décider du traitement à apporter à chaque demande de contribution de façon à assurer la vivacité du processus de développement open source. Il aura de facto vocation à catégoriser chaque demande de contribution (e.g. fonctionnalité, bug fix, ergonomie, …). Pour cela, le _comité des mainteneurs_ pourra se faire assister par des développeurs et/ou par un outil dédié.

La composition initiale de ce _comité des mainteneurs_ est constitué de la gouvernance technique et managériale qui ont assumées le développement initial. Il est susceptible d'évoluer après la publication selon les choix pour la maintenance fait par la gouvernance du projet (le _core group_).

# Gestion des contributions
Les personnes qui contribueront au code devront s'engager à le céder au mainteneur du sous-projet auquel elles auront contribué. Il sera diffusé avec la licence de ce dernier.
