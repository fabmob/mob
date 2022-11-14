#!/bin/bash

# Recherche les fichiers sonarqube_issues
MODULES=""
for MODULE in api website
do
    if [ -f $MODULE/sonarqube_issues ]; then
      NB_ISSUES=`jq '.issues | length' $MODULE/sonarqube_issues`
      [ $NB_ISSUES -gt 0 -a -z $MODULE ] && export MODULES=$MODULE
      [ $NB_ISSUES -gt 0 -a ! -z $MODULE ] && export MODULES=$MODULE" "$MODULES
    fi
done

# Convertit les fichiers sonarqube_issues en sous-ensemble du modèle CodeClimate
echo "MODULES with issues="$MODULES
for MODULE in $MODULES
do
    jq --arg moduleName "$MODULE" '[ .components as $components | .issues[] | .component as $componentName | { description: (.message  + " severity:" + .severity + " type:" + .type + " rule:" + .rule + " effort:" + .effort + " debt:" + .debt), fingerprint: (.component + ":" +.rule + ":" + .hash + ":" + (.textRange.startLine|tostring) + ":" + (.textRange.endLine|tostring) + ":" + (.textRange.startOffset|tostring)+ ":" + (.textRange.endOffset|tostring)), severity: (.severity|ascii_downcase), location: { path: ($moduleName + "/" + ( $components[] | select (.key == $componentName)  | .longName ) ), lines : { begin : .line } } } ]' $MODULE/sonarqube_issues >> gl-code-quality-report-$MODULE.json
done

# Aggrège les fichiers sous-ensemble du modèle CodeClimate
jq -s '[ .[] | .[] ]' gl-code-quality-report-*.json > gl-code-quality-report-all.json

# Calcule le fingerprint
jq -c '.[]' gl-code-quality-report-all.json |
while IFS= read -r obj; do
    md5sum=$( printf '%s' "$obj" | jq '.fingerprint' | md5sum | cut -d' ' -f1)
    jq -c --arg md5 "$md5sum" '.fingerprint = $md5' <<<"$obj"
done | jq -s '.'> gl-code-quality-report.json
