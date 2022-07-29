echo -e '>>> STEP 3 : Clean project before commit'
cd ../

echo -e " > Remove all files contain unpublishable document pattern"
find . -name "_pvt_*" -type f -delete
find . -name ".gitlab-ci*" -type f -delete
find . -name "yarn.lock" -type f -delete
find . -name "package-lock.json" -type f -delete
find . -name ".npmrc" -type f -delete
find . -name "*docker-compose.yml" -type f -delete
find . -name "*dockerfile.yml*" -type f -delete
find . -name "sonar-project.properties" -type f -delete
find . -name ".dockerignore" -type f -delete

rm -rf ./api/README.md
rm -rf ./website/README.md
rm -rf ./analytics

find ./website -name ".env*" -type f -delete

echo -e " > Remove all folders contents unpublishable and replace content with file README_*.md if exist"
rm -rf ./idp/*
cp publication/replace_content_folder_deleted/README_idp.md ./idp/

rm -rf ./vault/*
cp publication/replace_content_folder_deleted/README_vault.md ./vault/

rm -rf ./website/scripts/*

echo -e " > Remove git config (.git)"
rm -rf ./.git

echo -e " > Copy git config (.git) of publication repository to new target_working_dir_final developpement"
cp -r ./publication/target_working_dir_initial/.git ./.git

#echo -e " > Copy README.md LICENSE and CONTRIBUTING.md"
#cp ./publication/target_working_dir_initial/README.md ./
#cp ./publication/target_working_dir_initial/LICENSE ./
#cp ./publication/target_working_dir_initial/CONTRIBUTING.md ./

echo -e " > Added unpublishable document pattern to git exclusion file (.git/info/exclude) and publication folder"
echo "_pvt_*" >> .git/info/exclude
echo "publication" >> .git/info/exclude
echo "utils" >> .git/info/exclude
echo "output" >> .git/info/exclude
