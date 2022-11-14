echo " > cd out of module publicaion"

cd ..

echo -e " > Remove all files contain unpublishable document pattern"
find . -name "package-lock.json" -type f -delete
find . -name "yarn.lock" -type f -delete
find . -name ".npmrc" -type f -delete
find . -name ".env*" -type f -delete
find . -name "*.pem" -type f -delete
find . -name "*.pfx" -type f -delete

echo -e " > Remove git config (.git)"
rm -rf ./.git

echo -e " > Add good version to package.json"
apk add jq

for d in */ ;
do
    cd $d
    echo "\n*** $d ***\n"
    if test -f "package.json";
    then
      echo "Set package version : $PACKAGE_VERSION"
      tmp=$(mktemp)
      jq --arg a "$PACKAGE_VERSION" '.version = $a' package.json > "$tmp" && mv "$tmp" package.json
    fi
    cd ..
done

