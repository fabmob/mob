> **Note** : La publication du code source fait apparaitre des écrans et des textes. Ces écrans et ces textes vont évoluer au cours des jours qui viennent, en amont de tout déploiement éventuel, du fait :
> des retours des tests,
> de la prise en compte de l'ensemble des exigences en matière d'accessibilité,
> de la précision des éléments légaux,
> de tout autre élément susceptible de conduire à des modifications

# Rappel du contexte
Le programme Mon Compte Mobilité, porté par Capgemini Invent et la Fabrique des Mobilité, est une plateforme de services neutre qui facilite les relations entre citoyens, employeurs, collectivités et opérateurs de mobilité autour d’un compte personnel de mobilité. Son ambition est d’accélérer les mutations des mobilités pour réduire massivement l’autosolisme et encourager l’utilisation des mobilités douces.
Ce programme répond parfaitement à une des propositions de la convention citoyenne : mettre en place un portail unique permettant de savoir à tout moment, rapidement et simplement, quels sont les moyens et dispositifs existants sur un territoire pour se déplacer.

Le projet Mon Compte Mobilité est lauréat de l’appel à projet pour des programmes de Certificats d’économie d’énergie par l’arrêté du 27 février 2020, et publié au journal officiel le 8 mars 2020.

Mon Compte Mobilité est un compte unique pour chaque utilisateur qui permet :
- A chaque citoyen de visualiser les dispositifs d’incitation de sa collectivité ou son employeur pour en bénéficier comme il le souhaite auprès des différentes offres de mobilité et de gérer son consentement à la portabilité de ses données personnelles
- A chaque entreprise de paramétrer et mettre en œuvre la politique de mobilité qu’elle souhaite pour ses collaborateurs
- A chaque Autorité Organisatrice de la Mobilité de créer et piloter ses politiques d’incitation pour encourager l’utilisation de modes de mobilité plus durables sur son territoire
- A chaque opérateur de mobilité de mettre en visibilité ses offres et de faciliter l’utilisation des incitatifs sur celles-ci, et de contribuer à la politique incitative de mobilité durable des territoires

Le développement du service sera incrémental, et expérimenté sur 3 territoires pilotes en 2021 et jusqu’à fin 2022, en partenariat avec plusieurs Autorités Organisatrices de la Mobilité, employeurs et acteurs de la mobilité.

A noter que Mon Compte Mobilité n’est pas un Maas au sens où il ne permet pas d’opérer le paiement d’un service et n’a pas de vocation commerciale, mais il s’interface avec ceux-ci ou avec les opérateurs de mobilité des territoires.

# Processus de création de la plateforme Mon Compte Mobilité
- Dans un mode agile, les développeurs membres de l’équipe-projet Mon Compte Mobilité ont travaillé à l’implémentation des premières briques fonctionnelles du site web responsive et de son infrastructure, dans l’optique de proposer une plateforme déployable opérationnellement, dans le cadre d’un calendrier fixé par le programme CEE Mon Compte Mobilité.
- La publication des codes sources et de la documentation de Mon Compte Mobilité démarre en _mai 2021_ et se poursuivre pendant la durée du projet. L’évolution du code prévoit l’analyse et l’intégration éventuelle des améliorations qui seront soumises par la communauté des développeurs.
- Les mises à jour de l’application seront disponibles au fur et à mesure.
# Principe général de publication
Pour permettre aux différentes communautés de développeurs et de spécialistes d’expertiser la façon dont cette plateforme est programmée, le code source est publié sur [https://gitlab.com/MonCompteMobilite/mon-compte-mobilite](https://gitlab.com/MonCompteMobilite/mon-compte-mobilite). Le code source présenté est le résultat d’un processus de développement collaboratif impliquant de nombreuses personnes et organisations au sein de l’équipe-projet Mon Compte Mobilité.
Ce processus de développement collaboratif va s’ouvrir progressivement pour permettre de proposer des évolutions à la plateforme, de signaler des bugs, de proposer des changements pour la documentation et de suivre la prise en compte ou non de ces propositions. Pour ce faire, le choix de la plateforme Gitlab a été retenu.
Les contributions attendues par la communauté des développeurs permettront de faire évoluer des briques logicielles pour, au final, améliorer la qualité de l’application. Pour contribuer, merci de prendre connaissance du fichier [CONTRIBUTING.md](https://gitlab.com/MonCompteMobilite/mon-compte-mobilite). La plateforme Gitlab n’a pas vocation à héberger les débats d’ordre plus général, politique ou sociétal. La politique de publication du code source développé dans le cadre du projet repose sur X catégories :
- Une partie (restreinte) qui n’est pas publiée car correspondant à des tests ou à des parties critiques pour la sécurité de l’infrastructure ;
- Une partie qui relève à strictement parler de l’open source, avec des appels à contribution qui sont attendus : cela concerne le cœur de l’application.
# Phases de publication en Open Source
L’équipe-projet Mon Compte Mobilité a décidé de publier le code par phase d’environ 2 mois. Ce phasage ne remet pas en question les principes fondamentaux de publication ouverte du code mais permet une meilleure gestion de la montée en charge pour une mise à disposition éventuelle d’une plateforme opérationnelle à l’été 2021.
# # Phase 1 : transparence
Une première partie des briques logicielles est publiée en _mai 2021_. Désormais visible, le code peut être revu par tous ceux qui le souhaitent. En le rendant public, l’équipe-projet Mon Compte Mobilité respecte son engagement de transparence.
Les personnes externes à l’équipe-projet Mon Compte Mobilité peuvent, à ce stade, donner un avis, faire remonter des suggestions ou des commentaires.
Toutes les contributions seront lues attentivement afin de pouvoir retenir celles qui seront jugées pertinentes voire qui seront susceptibles de jouer un rôle critique à ce stade du développement du code.
# # Phase 2 : contribution
La phase de contribution permettra à la communauté de contribuer au logiciel tout en respectant les mécanismes de régulation qui seront mis en place (essentiellement via de la revue de code et une acceptation ou un rejet par un comité de validation).
A ce stade, le travail de la communauté des développeurs, qu’ils soient internes ou externes au projet, sera précieux. Un temps d’intégration avec des process transparents sera précisé sous la responsabilité d’un comité de validation.
# Description des sous-projets et de la façon dont ils interagissent
Le projet principal est découpé en plusieurs sous-projets dont l’articulation globale est détaillée dans le document [comment contribuer](https://gitlab.com/MonCompteMobilite/mon-compte-mobilite).
# Contribution au projet
Pour contribuer au projet, merci de prendre connaissance du fichier [comment contribuer]( https://gitlab.com/MonCompteMobilite/mon-compte-mobilite).
# Licence
Merci de vous référer au fichier dédié : [LICENSE](https://gitlab.com/MonCompteMobilite/mon-compte-mobilite)
# Liens
- La présentation globale du projet Mon Compte Mobilité sur : [https://moncomptemobilite.fr/](https://moncomptemobilite.fr/)
- Les membres de l’équipe-projet Mon Compte Mobilité : [https://moncomptemobilite.fr/](https://moncomptemobilite.fr/)
- Le document [comment contribuer](https://moncomptemobilite.fr/)
- La [liste des sous-projets déjà publiés](https://gitlab.com/MonCompteMobilite/mon-compte-mobilite)
# Périmètre de la première publication
Cette première publication (PMV0) contient les fonctionnalités suivantes :
Version non connectée de la plateforme :
- Présentation du service pour les 4 cibles principales (citoyen, entreprise, collectivité, opérateur de mobilité)
- Présentation du projet
- Demande de contact via un formulaire
- Recherche d’aides à la mobilité
- Fiche d’aides à la mobilité
- Informations légales liées à la plateforme (politique de cookies, politique de protection des données, conditions générales d’utilisation)
APIs de recherche d’aide à la mobilité

# Roadmap de la 1ère version du produit

Etape 2
- APIsation de la recherche d’aides de la Collectivité
- Création de compte Citoyen + Financeur
- Règles RGPD

Etape 3
- APIsation de la souscription d’aides de la collectivité
- APIsation du suivi des demandes citoyens
- Tableau de bord – Validation des demandes d’aides de la collectivité
- Gestion abonnés notifications
- Affiliation Employeur / Citoyen
- APIsation recherche d’aide Employeur
- APIsation souscription aide Employeur

Etape 4 : Tableau de bord – KPIs de la Collectivité
- Tableau de bord – KPIs Employeur
- Tableau de bord – KPIs Employeur (RSE)
- Gestion des communautés de salariés

Etape 5 : FAQ Financeurs

Etape 6 : Tableau de bord – KPIs des Citoyens

Etape 7 : Mise en place des contrastes sur la plateforme (RGAA)


