## Module analytics

Il s'agit des assets pour mesurer l'audience de la plateforme MCM à destination des administrateurs fonctionnels.

### Choix d'architecture détaillée
La brique Redis n'a pas été mise en place car la fréquentation prévue du site ne le nécessite pas.
Une alternative médiane pourrait être d'utiliser Azure Database for MariaDB.

### Vue simplifiée

```plantuml
scale 1.2
actor admin_fonctionnel
actor visitor
rectangle Azure {
    database MariaDB
    rectangle Matomo {
        agent apache
        agent php
        agent mysql_client
    }
}
rectangle WebUI
visitor -> WebUI
admin_fonctionnel -r-> Matomo
WebUI -> Matomo
Matomo -> MariaDB
```

