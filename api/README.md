## Module api

Il s'agit des api de la plateforme MCM. Il fournit les services métier.

### Principe général et vue simplifiée

Les storage ne sont accessibles qu'à travers Loopback (node.js).

```plantuml
scale 1.2
artifact Loopback {
}
database MongoDb  {
}
node Keycloak {
}
node Sendgrid {
}
actor contact
Loopback --> MongoDb: CRUD citoyens/aides
Loopback --> Keycloak: CRUD users/collectivite/entreprise
Loopback -right-> MongoDb: indexation/recherche des aides
Loopback -left-> Sendgrid: services/contact.service.ts
Sendgrid --> contact: protocole smtp
```

### Authentification

L'authentification entre Loopback et MongoDb est une authentification par login et mot de passe.

L'authentification entre Loopback et Keycloak est une authentification par clientId et mot de passe.

L'authentification entre Loopback et SendGrid se fait par une clé API.
