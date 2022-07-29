## Microservice fournisseur d'identité

L'Identity Provider choisi pour gérer les utilisateurs et assurer l'interfaçage avec les systèmes tiers est Keycloak.

```plantuml
scale 1.1
artifact gitlab_ci_yml
artifact docker_compose_yml
artifact dockerfile_yml
artifact keycloak_template
agent realm_export_sh
artifact realm_json
gitlab_ci_yml -r-> docker_compose_yml: déploie
docker_compose_yml -r-> dockerfile_yml: construit
dockerfile_yml -r-> keycloak_template: inclut
docker_compose_yml -d-> realm_json: importe
realm_export_sh -r-> realm_json: produit
```
