#!/bin/sh

if [ "$#" -ne 1 ]
then
  echo "Usage: Must supply a release version"
  echo "Example : 1.0.0"
else
    RELEASE_VERSION=$1

    zip mcm-vault-v$RELEASE_VERSION.zip admin-policy.hcl config.hcl createCertificates.sh Dockerfile init-vault.sh manager-policy.hcl renew-key.sh vault-crontab vault-docker-compose.yml
fi

