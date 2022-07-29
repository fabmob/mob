echo -e '>>> STEP 4 : Add, Commit and Push'
cd ../

git_config_to_commit="-c user.name=$USERNAME_TO_PUBLISH -c user.email=$EMAIL_TO_COMMIT"

git add .
git status
git $git_config_to_commit commit -a -m "${MESSAGE:-Publication} - ${CI_PIPELINE_ID}"
git push

echo -e " > Publication done"
