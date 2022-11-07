# Description

Le service vault se base sur la brique logicielle **[Vault](https://github.com/hashicorp/vault)**

Ce service est destiné aux financeurs partenaires qui souhaitent proposer des aides sur la plateforme MOB et qui ne possèdent pas leur propre solution de chiffrement de données.

Il doit être installé dans le SI du financeur et va l'utiliser pour envoyer à MOB une clé publique permettant de chiffrer les justificatifs envoyés par un citoyen lors de la souscription à une aide de ce financeur. Le gestionnaire va ensuite déchiffrer ces justificatifs lors du traitement de la demande à l'aide de la clé privée stockée de manière sécurisée dans le Vault.

Son installation en local permet simuler les actions d'un financeur et de tester le chiffrement et le déchiffrement de justificatifs.


# Installation en local

## Nom de domaine et certificat

Pour lancer le vault en local en https, il faut utiliser un nom de domaine fictif à attribuer au vault et lui associer un certificat.

### Ajout d'un nom de domaine fictif associé à l'adresse IP de la machine ou localhost dans le fichier hosts

Sur Windows : **C:\Windows\System32\drivers\etc\hosts**

Sur Linux : **/etc/hosts**

Exemple :

`127.0.0.1 vault.example.com` ou `172.27.66.82 vault.example.com`

Si vous utilisez WSL : il faut attribuer associer l'adresse IP de WSL dans les fichiers hosts de Windows **ET** de Linux

### Création de certificats

`. ./createCertificates.sh vault.example.com`

Ajouter le certificat ***manager-client-cert.pfx*** dans les ***Certificats personnels*** de l'utilisateur

Ajouter le certificat ***rootCA.pem*** dans les ***Autorités de certification racines de confiance***

## Variables 

| Variables      | Description | Obligatoire |
| ----------- | ----------- | ----------- |
| CLIENT_ID      | Client ID du client Keycloak créé pour le financeur      | Oui |
| CLIENT_SECRET      | Client Secret du client Keycloak créé pour le financeur      | Oui |
| FUNDER_IDS   | Liste des identifiants financeurs à autoriser          | Oui |
| API_URL   | URL du service api       | Oui |
| IDP_URL   | URL du service idp       | Oui |
| AVAILABLE_KEYS  | Nombre de clés à conserver dans le vault        | Non |
| FUNDER_TOKEN      | Token permettant de se connecter à l'UI du Vault       | Oui |
| VAULT_ADDR      | URL du Vault sans slash. (ex : **https://vault.example.com:8200** et pas **https://vault.example.com/** )     | Oui |
| VAULT_API_ADDR      | URL de l’API du Vault (même URL que VAULT_ADDR)       | Oui |
| VAULT_CERT      | Chemin vers l’emplacement du certificat serveur sur la machine où est lancé le Vault, à utiliser pour le TLS dans le Vault. (ex : **./certs/simulation-vault.preview.moncomptemobilite.fr.crt**)        | Oui |
| VAULT_KEY      | Chemin vers l’emplacement de la clé privée du certificat serveur sur la machine où est lancé le Vault. (ex : **./certs/simulation-vault.preview.moncomptemobilite.fr.key**)        | Oui |
| VAULT_ROOT_CA      | Chemin vers l’emplacement du certificat de l’autorité de certification sur la machine où est lancé le Vault, utilisé pour vérifier le certificat du serveur SSL du Vault. (ex : **./certs/rootCA.pem**)      | Oui |
| ADMIN_CERT      | Chemin vers l’emplacement du certificat client sur la machine où est lancé le Vault, utilisé pour s’authentifier en tant qu’administrateur. (ex : **./certs/ admin-client-cert.pem**)       | Oui |
| ADMIN_CERT_KEY      | Chemin vers la clé privée du certificat client administrateur sur la machine où est lancé le Vault. (ex : **./certs/admin-client-key.pem**)       | Oui |
| CLIENT_CA      | Chemin vers l’emplacement du certificat de l’autorité de certification sur la machine où est lancé le Vault, utilisé pour vérifier les certificats clients utilisés pour l’authentification par certificat.(ex : **./certs/client-ca.pem**). Peut être le même que VAULT_ROOT_CA mais pas nécessairement.       | Oui |

## Démarrage

`docker network create dev_web-nw`

`docker volume create vault-data`

`docker compose -f vault-docker-compose.yml up`

## URL / Port

Interface :
- URL : https://vault.example.com:8200
- Port : 8200

# Précisions pipelines

## Preview

Un seul vault utilisé (sur la branche master) pour l'ensemble des branches de dev.

## Testing

Pas de précisions nécéssaires pour ce service


# Relation avec les autres services

L'api et l'idp sont les deux services appelés par le vault pour envoyer des clés publiques.
Le service website appelle le vault pour récupérer les clés privées associées et déchiffrer les justificatifs

# Tests Unitaires

Pas de tests unitaires nécéssaires pour ce service
