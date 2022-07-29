## Module Website

Il s'agit du portail de la plateforme MCM.
Il fournit le contenu rédactionnel du site ainsi que les ressources statiques permettant d'initialiser l'application web monopage.

### Principes généraux et vue simplifiée

Les rédacteurs peuvent intervenir sur les pages grâce au CMS "sans tête" netlify_cms.
Ce dernier fonctionne sans base de données et stocke ses enregistrements dans GitLab.

Un site statique fortement optimisé est généré par le pipeline de build, à l'aide du SSG Gatsby et Webpack.

```plantuml
scale 1.2
together {
  artifact Website {
      folder "/admin" {
          agent NetlifyCMS
      }
  }
  queue Gatsby
}
database VersionCode  {
  file Markdown
}
Markdown ..> Gatsby: compile
Gatsby .up.> Website: génère
NetlifyCMS .right.> Markdown: produit
```

### Authentification et autorisation

```plantuml
scale 1.2
actor fonctionnels
together {
  rectangle nginx {
    artifact site_web {
        folder "/admin" {
            agent netlify_cms
        }
    }
  }
  queue gatsby
}
rectangle versioncode {
  database dépôt_git  {
    file markdown
  }
}
agent louketo_proxy
rectangle keycloak {
  database citoyens_financeurs
}
rectangle annuaire {
  database admins_fonctionnels
}
actor admin_technique
fonctionnels -> site_web: 0:login
site_web -r-> keycloak: 1:authentification
keycloak -r-> azure_ad : 2:delegation
netlify_cms -> citoyens_financeurs: 3:authentification
netlify_cms .. louketo_proxy : 4:lecture/écriture
louketo_proxy -u-> keycloak: 5:sso
louketo_proxy .d.> markdown: 6:proxy + authentication
markdown .l.> gatsby: 7:compilation
gatsby .up.> site_web: 8:publication
admin_technique -u-> keycloak: A:authentification
gitlab ---> azure_ad: delegation
note top of fonctionnels: visiteurs, citoyens, financeurs, admin fonctionnels
```
