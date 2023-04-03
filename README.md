# Rappel du contexte
Le programme Mon Compte Mobilité, porté par Capgemini Invent et la Fabrique des Mobilité, est une plateforme de services neutre qui facilite les relations entre citoyens, employeurs, collectivités et opérateurs de mobilité autour d’un compte personnel de mobilité et d'une passerelle (i.e. Gateway) d'échanges de services standardisés à destination des MaaS. Son ambition est d’accélérer les mutations des mobilités pour réduire massivement l’autosolisme et encourager l’utilisation des mobilités douces.
Ce programme répond parfaitement à une des propositions de la convention citoyenne : mettre en place un portail unique permettant de savoir à tout moment, rapidement et simplement, quels sont les moyens et dispositifs existants sur un territoire pour se déplacer.

Le projet Mon Compte Mobilité est lauréat de l’appel à projet pour des programmes de Certificats d’économie d’énergie par l’arrêté du 27 février 2020, et publié au journal officiel le 8 mars 2020.

Mon Compte Mobilité (ou **moB**) est un compte unique pour chaque utilisateur qui permet :
-	A chaque citoyen de visualiser les dispositifs d’incitation nationaux, de sa collectivité ou son employeur pour en bénéficier comme il le souhaite auprès des différentes offres de mobilité et de gérer son consentement à la portabilité de ses données personnelles
-	A chaque entreprise de paramétrer et mettre en œuvre la politique de mobilité qu’elle souhaite pour ses collaborateurs
-	A chaque AOM (Autorité Organisatrice de la Mobilité) de créer et piloter ses politiques d’incitation pour encourager l’utilisation de modes de mobilité plus durables sur son territoire
-	A chaque opérateur de mobilité (MSP, Mobility Service Provider) de mettre en visibilité ses offres et de faciliter l’utilisation des incitatifs sur celles-ci, et de contribuer à la politique incitative de mobilité durable des territoires

Le développement de la plateforme est incrémental, et expérimenté sur 3 territoires pilotes en 2022 et jusqu'à fin mars 2023, en partenariat avec plusieurs Autorités Organisatrices de la Mobilité, employeurs et acteurs de la mobilité.

A noter que moB n’est pas un MaaS au sens où il ne permet pas d’opérer le paiement d’un service et n’a pas de vocation commerciale, mais il s’interface avec ceux-ci ou avec les opérateurs de mobilité des territoires.

# Processus de création de la plateforme Mon Compte Mobilité
- Dans un mode agile, les développeurs membres de l’équipe projet Mon Compte Mobilité ont travaillé à l’implémentation des premières briques fonctionnelles du site web responsive et de son infrastructure, dans l’optique de proposer une plateforme déployable opérationnellement, dans le cadre d’un calendrier fixé par le programme CEE Mon Compte Mobilité.
- La publication des codes sources et de la documentation se poursuivra pendant toute la durée du projet. L’évolution du code prévoit l’analyse et l’intégration éventuelle des améliorations qui seront soumises par la communauté des développeurs.
- Les mises à jour de l’application seront disponibles au fur et à mesure du déroulé des sprints de l'équipe de développement.

# Principe général de publication
Pour permettre aux différentes communautés de développeurs et de spécialistes d’expertiser la façon dont cette plateforme est programmée, le code source est publié sur [https://github.com/fabmob/mob](https://github.com/fabmob/mob), géré par l'organisation de la Fabrique des Mobilités, co-porteur du programme. Le code source présenté est le résultat d’un processus de développement collaboratif impliquant de nombreuses personnes et organisations au sein de l’équipe projet Mon Compte Mobilité.
Ce processus de développement collaboratif va s’ouvrir progressivement pour permettre de proposer des évolutions à la plateforme, de signaler des bugs, de proposer des changements pour la documentation et de suivre la prise en compte ou non de ces propositions. Pour ce faire, le choix de la plateforme GitHub a été retenu.
Les contributions attendues par la communauté des développeurs permettront de faire évoluer des briques logicielles pour, au final, étendre les fonctionnalités et améliorer la qualité de l’application. Pour contribuer, merci de prendre connaissance du fichier [CONTRIBUTING.md](https://github.com/fabmob/mob). La plateforme GitHub n’a pas vocation à héberger les débats d’ordre plus général, politique ou sociétal. La politique de publication du code source développé dans le cadre du projet repose sur 2 catégories :
- Une partie (restreinte) qui n’est pas publiée car correspondant à des tests ou à des parties critiques pour la sécurité de l’infrastructure ;
- Une partie qui relève à strictement parler de l’open source, avec des appels à contribution qui sont attendus : cela concerne le cœur de l’application.

# Phases de publication en Open Source
L’équipe projet Mon Compte Mobilité publiera le code source par le biais de pull requests, à la fin des sprints de développement Agile. Ce phasage ne remet pas en question les principes fondamentaux de publication ouverte du code mais permet une meilleure gestion et s'adapte au fonctionnement actuel du projet.
## Phase 1 : transparence
Désormais visible, le code peut être revu par tous ceux qui le souhaitent. En le rendant public, l’équipe projet Mon Compte Mobilité respecte son engagement de transparence.
Les personnes externes à l’équipe projet Mon Compte Mobilité peuvent, à ce stade, donner un avis, faire remonter des suggestions ou des commentaires.
Toutes les contributions seront lues attentivement afin de pouvoir retenir celles qui seront jugées pertinentes voire qui seront susceptibles de jouer un rôle critique à ce stade du développement du code.
## Phase 2 : contribution
La phase de contribution permettra à la communauté de contribuer au logiciel tout en respectant les mécanismes de régulation qui seront mis en place (essentiellement via de la revue de code et une acceptation ou un rejet par un comité de validation).
A ce stade, le travail de la communauté des développeurs, qu’ils soient internes ou externes au projet, sera précieux. Un temps d’intégration avec des process transparents sera précisé sous la responsabilité d’un comité de validation.
# Description des sous-projets
Le projet principal est découpé en plusieurs sous-projets dont l’articulation globale est détaillée dans le document [README.md](https://github.com/fabmob/mob#readme).
# Contribution au projet
Pour contribuer au projet, merci de prendre connaissance du fichier [CONTRIBUTING.md](https://github.com/fabmob/mob).
# Licence
Merci de vous référer au fichier dédié : [LICENSE.txt](https://github.com/fabmob/mob#license)
# Liens
- Le site web avec la présentation du projet Mon Compte Mobilité : [https://moncomptemobilite.fr/](https://moncomptemobilite.fr/)
- La page [LinkedIn](https://www.linkedin.com/showcase/mon-compte-mobilit%C3%A9/)


# Périmètre de la publication
La présente publication sera complétée le 18 novembre 2022. Seront alors publiées les fonctionnalités de Mon Compte Mobilité ayant pour vocation de

Permettre à l’Utilisateur non-authentifié :
-	D’accéder au catalogue d’aides publiques proposées par les Territoires partenaires
-	D’accéder au catalogue d’aides publiques nationales

Permettre à l’Utilisateur authentifié :
-	D’accéder au catalogue d’aides publiques proposées par les Territoires partenaires
-	D’accéder au catalogue d’aides publiques nationales
-	De s’affilier à son entreprise afin d’accéder au catalogue d’aides privées proposées par son employeur
-	De lier son compte à des Applications mobiles ou Site Web de Territoires partenaires
-	De soumettre une demande d’aide (publique ou privée) à la mobilité en fournissant les justificatifs demandés ou communiqués via une application ou site internet d’un partenaire
-	D’être notifié du traitement de ses demandes directement par e-mail ou depuis son Tableau de Bord

Permettre aux Entreprises / Territoires partenaires :
-	De consulter et traiter les demandes d’aides des Utilisateurs
-	De valider les demandes d’affiliations des Utilisateurs
-	De s’interfacer avec leur Système d'Information Ressources Humaines pour traiter les demandes d’aides des Utilisateurs dans leur outil existant
-	D’accéder à leur Tableau de Bord et donc à un certain nombre d’indicateurs de suivi de pilotage de la politique de mobilité

# Roadmap produit
Sera déterminée et partagée prochainement.
