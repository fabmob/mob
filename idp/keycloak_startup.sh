#! bin/sh
REPLACE='"${'
sed -i "s/##/$REPLACE/g" tmp/mcm-realm.json
