#!/bin/sh

sleep 10

check_vault_status () {
   echo "************"
   echo "Vault Status"
   echo "************"
   if [ -s /vault/file/status ]; then
      rm /vault/file/status
   fi
   if [ -s /vault/file/status-error ]; then
      rm /vault/file/status-error
   fi
   vault status -format="json" > /vault/file/status 2>/vault/file/status-error
   if [ -s /vault/file/status-error ]; then
      echo "Check vault status failed"
      cat /vault/file/status-error
      echo "Retry in 15 minutes"
      sleep 15m
      start_vault
   fi
   cat /vault/file/status
}

init () {
   echo "**********"
   echo "Init Vault"
   echo "**********"
   VAULT_STATUS=$(cat /vault/file/status)
   INITIALIZED=$(echo $VAULT_STATUS | jq '.initialized')
   if [ "$INITIALIZED" = true ] ; then
      echo -e '\nVault already Initialized\n'
   else
      vault operator init > /vault/file/keys 2>/vault/file/init-error
      if [ -s /vault/file/init-error ]; then
         echo "Vault init failed"
         cat /vault/file/init-error
         rm /vault/file/init-error
         echo "Retry in 15 minutes"
         sleep 15m
         start_vault
      fi
      echo -e "\nVault Initialized\n"
   fi
}

unseal () {
   echo "************"
   echo "Unseal Vault"
   echo "************"
   VAULT_STATUS=$(cat /vault/file/status)
   SEAL_STATUS=$(echo $VAULT_STATUS | jq '.sealed')
   if [ "$SEAL_STATUS" = false ] ; then
      echo -e '\nVault already Unsealed\n'
   else
      vault operator unseal $(grep 'Key 1:' /vault/file/keys | awk '{print $NF}') 2>/vault/file/unseal-error
      vault operator unseal $(grep 'Key 2:' /vault/file/keys | awk '{print $NF}') 2>/vault/file/unseal-error
      vault operator unseal $(grep 'Key 3:' /vault/file/keys | awk '{print $NF}') 2>/vault/file/unseal-error
      if [ -s /vault/file/unseal-error ]; then
         echo "Vault unseal failed"
         cat /vault/file/unseal-error
         rm /vault/file/unseal-error
         echo "Retry in 15 minutes"
         sleep 15m
         start_vault
      fi
      echo -e '\nVault Unsealed\n'
   fi
}


root_log_in () {
   echo "***********"
   echo "Root Log In"
   echo "***********"
   export ROOT_TOKEN=$(grep 'Initial Root Token:' /vault/file/keys | awk '{print $NF}')
   vault login $ROOT_TOKEN -no-print=true > /dev/null
   if [ -z "$(grep "$ROOT_TOKEN" "/root/.vault-token")" ]; then
      echo "Login failed, retry in 15 minutes"
      sleep 15m
      start_vault
   fi
   echo -e "\nRoot Login success\n"
}

create_policy () {
   echo "*************"
   echo "Create Policy"
   echo "*************"
   vault policy write admin /vault/config/admin-policy.hcl 2>/vault/file/create-admin-policy-error
   vault policy write manager /vault/config/manager-policy.hcl 2>/vault/file/create-manager-policy-error
   if [ -s /vault/file/create-admin-policy-error ]; then
      echo "Error creating admin policy"
      cat /vault/file/create-admin-policy-error
      rm /vault/file/create-admin-policy-error
      echo "Retry in 15 minutes"
      sleep 15m
      start_vault
   fi
   if [ -s /vault/file/create-manager-policy-error ]; then
      echo "Error creating cert policy"
      cat /vault/file/create-manager-policy-error
      rm /vault/file/create-manager-policy-error
      echo "Retry in 15 minutes"
      sleep 15m
      start_vault
   fi
   echo -e "\nPolicies admin and manager created\n"
}

enable_cert () {
   echo "***********"
   echo "Enable Cert"
   echo "***********"
   vault auth enable cert 2>/vault/file/enable-cert-error
   if [ -s /vault/file/enable-cert-error ]; then
      if [ -z "$(grep '* path is already in use at cert/' /vault/file/enable-cert-error)" ]; then
         echo "Error enabling cert"
         cat /vault/file/enable-cert-error
         rm /vault/file/enable-cert-error
         echo "Retry in 15 minutes"
         sleep 15m
         start_vault
      fi
   fi
   echo -e "\nCert auth enabled\n"
}

create_cert_role_admin () {
   echo "**********************"
   echo "Create Cert Role Admin"
   echo "**********************"
   vault write auth/cert/certs/admin display_name=admin policies=admin certificate=@/etc/ssl/certs/client-ca.pem 2>/vault/file/cert-admin-role-error
   if [ -s /vault/file/cert-admin-role-error ]; then
      echo "Error creating cert role admin"
      cat /vault/file/cert-admin-role-error
      rm /vault/file/cert-admin-role-error
      echo "Retry in 15 minutes"
      sleep 15m
      start_vault
   fi
   echo -e "\nCert role admin created\n"
}

create_cert_role_manager () {
   echo "***********************"
   echo "Create Cert Role Manager"
   echo "***********************"
   vault write auth/cert/certs/manager display_name=manager policies=manager certificate=@/etc/ssl/certs/client-ca.pem 2>/vault/file/cert-role-error
   if [ -s /vault/file/cert-role-error ]; then
      echo "Error creating cert role manager"
      cat /vault/file/cert-role-error
      rm /vault/file/cert-role-error
      echo "Retry in 15 minutes"
      sleep 15m
      start_vault
   fi
   echo -e "\nCert role manager created\n"
}

create_token () {
   echo "*******************"
   echo "Create Funder Token"
   echo "*******************"
   vault token create -id $FUNDER_TOKEN -policy="admin" > /vault/file/admin-token 2>/vault/file/create-token-error
   if [ ! -s /vault/file/admin-token ]; then
      if [ -z "$(grep '* cannot create a token with a duplicate ID' /vault/file/create-token-error)" ]; then
         echo "Error creating admin token"
         cat /vault/file/create-token-error
         rm /vault/file/create-token-error
         echo "Retry in 15 minutes"
         sleep 15m
         start_vault
      fi
   fi
   echo -e "\nFunder token created\n"
}

cert_log_in () {
   echo "************"
   echo "Cert Log In"
   echo "************"
   ADMIN_CERT_ROLE='{"name": "admin"}'
   CERT_LOGIN=$(curl -s -w "\n%{http_code}" --cacert /etc/ssl/certs/vault-ca.pem --cert /etc/ssl/certs/admin-client-cert.pem --key /etc/ssl/certs/admin-client-key.pem --data "$ADMIN_CERT_ROLE" --request POST $VAULT_ADDR/v1/auth/cert/login)
   CERT_LOGIN_RESP=$(echo "$CERT_LOGIN" | head -n -1)
   STATUS_CODE=$(echo "$CERT_LOGIN" | tail -n 1)
   if [ $STATUS_CODE -ne 200 ]; then
      echo "Status Code : " $STATUS_CODE
      echo "Login failed : " $CERT_LOGIN_RESP
      echo "Retry in 15 minutes"
      sleep 15m
      start_vault
   fi
   export AUTH_TOKEN=$(echo $CERT_LOGIN_RESP | jq '.auth.client_token' | sed "s/\"//g" )
   echo -e "\nCert Login success\n"
}

setup_cors () {
   echo "**********"
   echo "Setup CORS"
   echo "**********"
   CORS_SETTINGS='{"allowed_origins": "*"}'
   POST_CORS_SETTINGS=$(curl -s -w "\n%{http_code}" --cacert /etc/ssl/certs/vault-ca.pem --request POST --data "$CORS_SETTINGS" --header "X-Vault-Token: $AUTH_TOKEN" $VAULT_ADDR/v1/sys/config/cors)
   STATUS_CODE=$(echo "$POST_CORS_SETTINGS" | tail -n 1)
   POST_CORS_RESP=$(echo "$POST_CORS_SETTINGS" | head -n -1)
   if [ $STATUS_CODE -ne 204 ]; then
      echo "Status Code : " $STATUS_CODE
      echo "Error setting CORS : " $POST_CORS_RESP
      echo "Retry in 15 minutes"
      sleep 15m
      start_vault
   fi
   echo -e "\nCORS configured\n"
}

enable_transit () {
   echo "**************"
   echo "Enable transit"
   echo "**************"
   vault secrets enable transit 2>/vault/file/enable-transit-error
   if [ -s /vault/file/enable-transit-error ]; then
      if [ -z "$(grep '* path is already in use at transit/' /vault/file/enable-transit-error)" ]; then
         echo "Error enabling transit"
         cat /vault/file/enable-transit-error
         rm /vault/file/enable-transit-error
         echo "Retry in 15 minutes"
         sleep 15m
         start_vault
      fi
   fi
   echo -e "\nTransit engine enabled\n"
}

enable_secrets () {
   echo "**************"
   echo "Enable secrets"
   echo "**************"
   vault secrets enable -path=kv kv-v2 2>/vault/file/enable-kv-secrets-error
   if [ -s /vault/file/enable-kv-secrets-error ]; then
      if [ -z "$(grep '* path is already in use at kv/' /vault/file/enable-kv-secrets-error)" ]; then
         echo "Error enabling transit"
         cat /vault/file/enable-kv-secrets-error
         rm /vault/file/enable-kv-secrets-error
         echo "Retry in 15 minutes"
         sleep 15m
         start_vault
      fi
   fi
   echo -e "\nSecret engine kv enabled\n"
}

create_key_pair () {
   echo "***************"
   echo "Create Key Pair"
   echo "***************"

   echo -e "\n********** Retrieving Funder ID List from kv secrets engine **********\n"
   FUNDER_SECRETS_RESP=$(curl -s -w "\n%{http_code}" --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" $VAULT_ADDR/v1/kv/data/$CLIENT_ID)
   STATUS_CODE=$(echo "$FUNDER_SECRETS_RESP" | tail -n 1)
   FUNDER_SECRETS=$(echo "$FUNDER_SECRETS_RESP" | head -n -1)
   FUNDER_ID_LIST=$(echo $FUNDER_SECRETS | jq '.data.data["funderIdList"]' | sed "s/\"//g")

   if [ $STATUS_CODE -eq 404 ]; then
      if [ ! -z "$FUNDER_IDS" ]; then
         echo "save funderIdList to KV Path"
         POST_FUNDER_ID_LIST_BODY=$( jq -n --arg funderIdList "$FUNDER_IDS" '{data: { funderIdList: $funderIdList }}')
         POST_FUNDER_ID_LIST_RESP=$(curl -s -w "\n%{http_code}" -X POST --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" --data "$POST_FUNDER_ID_LIST_BODY"  $VAULT_ADDR/v1/kv/data/$CLIENT_ID)
         STATUS_CODE=$(echo "$POST_FUNDER_ID_LIST_RESP" | tail -n 1)
         POST_FUNDER_ID_LIST=$(echo "$POST_FUNDER_ID_LIST_RESP" | head -n -1)
         if [ $STATUS_CODE -ne 200 ]; then
            echo "Error saving funderIdList"
            echo "Status Code : " $STATUS_CODE
            echo $POST_FUNDER_ID_LIST
            echo "Retry in 15 minutes"
            sleep 15m
            restart_vault
         fi
         FUNDER_ID_LIST=$FUNDER_IDS
      else
         if [ $STATUS_CODE -ne 200 ]; then
            echo "Status Code : " $STATUS_CODE
            echo "Error retrieving $CLIENT_ID kv path"
            echo $FUNDER_SECRETS
            echo "Retry in 15 minutes"
            sleep 15m
            restart_vault
         fi
      fi
   fi

   
   if [ $FUNDER_ID_LIST = "null" ]; then
      if [ -z "$FUNDER_IDS" ]; then
         echo "Error retrieving Funder ID List"
         echo "Retry in 15 minutes"
         sleep 15m
         restart_vault
      else
         POST_FUNDER_ID_LIST_BODY=$( jq -n --arg funderIdList "$FUNDER_IDS" '{data: { funderIdList: $funderIdList }}')
         POST_FUNDER_ID_LIST_RESP=$(curl -s -w "\n%{http_code}" -X POST --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" --data "$POST_FUNDER_ID_LIST_BODY"  $VAULT_ADDR/v1/kv/data/$CLIENT_ID)
         POST_FUNDERS_STATUS_CODE=$(echo "$POST_FUNDER_ID_LIST_RESP" | tail -n 1)
         POST_FUNDER_ID_LIST=$(echo "$POST_FUNDER_ID_LIST_RESP" | head -n -1)
         if [ $POST_FUNDERS_STATUS_CODE -ne 200 ]; then
            echo "Error saving funderIdList"
            echo "Status Code : " $POST_FUNDERS_STATUS_CODE
            echo $POST_FUNDER_ID_LIST
            echo "Retry in 15 minutes"
            sleep 15m
            restart_vault
         fi
      fi
   else
      echo "Funder ID List successfully retrieved"
      echo "Funder ID List : " $FUNDER_ID_LIST
      echo "Funder ID List Env : " $FUNDER_IDS

      if [ -z "$FUNDER_IDS" ]; then
         FUNDER_IDS=$FUNDER_ID_LIST
      else
         if [ "$FUNDER_ID_LIST" != "$FUNDER_IDS" ]; then
            echo "save funderIdList to KV Path"
            POST_FUNDER_ID_LIST_BODY=$( jq -n --arg funderIdList "$FUNDER_IDS" '{data: { funderIdList: $funderIdList }}')
            POST_FUNDER_ID_LIST_RESP=$(curl -s -w "\n%{http_code}" -X POST --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" --data "$POST_FUNDER_ID_LIST_BODY"  $VAULT_ADDR/v1/kv/data/$CLIENT_ID)
            STATUS_CODE=$(echo "$POST_FUNDER_ID_LIST_RESP" | tail -n 1)
            POST_FUNDER_ID_LIST=$(echo "$POST_FUNDER_ID_LIST_RESP" | head -n -1)
            if [ $STATUS_CODE -ne 200 ]; then
               echo "Error saving funderIdList"
               echo "Status Code : " $STATUS_CODE
               echo $POST_FUNDER_ID_LIST
               echo "Retry in 15 minutes"
               sleep 15m
               restart_vault
            fi
         fi
      fi
   fi
   FUNDER_ID_ARRAY=${FUNDER_IDS//,/ }
   
   echo -e "\n********** Generate RSA Key Pair from Vault **********\n"
   POST_VAULT_KEY_BODY='{"type": "rsa-2048", "exportable": true}'
   curl -s --cacert /etc/ssl/certs/vault-ca.pem --request POST --data "$POST_VAULT_KEY_BODY" --header "X-Vault-Token: $AUTH_TOKEN" $VAULT_ADDR/v1/transit/keys/$CLIENT_ID

   GET_PUB_KEYS_RESP=$(curl -s -w "\n%{http_code}" --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" $VAULT_ADDR/v1/transit/keys/$CLIENT_ID)
   STATUS_CODE=$(echo "$GET_PUB_KEYS_RESP" | tail -n 1)
   PUBLIC_KEYS=$(echo "$GET_PUB_KEYS_RESP" | head -n -1)
   if [ $STATUS_CODE -ne 200 ]; then
      echo "Status Code : " $STATUS_CODE
      echo "Error getting encryption key from vault : " $PUBLIC_KEYS
      echo "Retry in 15 minutes"
      sleep 15m
      restart_vault
   fi
   echo "Key Pair $CLIENT_ID successfully created in Vault"

   # Encryption Key Informations
   LOGIN_URL="$VAULT_ADDR/v1/auth/cert/login"
   GET_KEY_URL="$VAULT_ADDR/v1/transit/export/encryption-key/$CLIENT_ID/1"
   LATEST_VERSION=$(echo $PUBLIC_KEYS | jq '.data.latest_version')
   LATEST_PUBLIC_KEY_CREATION_TIME=$(echo $PUBLIC_KEYS | jq --arg latest_version "$LATEST_VERSION" '.data.keys[$latest_version].creation_time')
   CREATION_TIME_FORMATTED=$(echo ${LATEST_PUBLIC_KEY_CREATION_TIME%Z*} | sed "s/\"//g")
   PUBLIC_KEY_EXPIRATION_DATE=$(date -d "$CREATION_TIME_FORMATTED 6 months" +"%Y-%m-%dT%H:%M:%SZ" | sed "s/\"//g")
   LAST_UPDATE_DATE=$(date +"%Y-%m-%dT%H:%M:%SZ" | sed "s/\"//g")
   LATEST_PUBLIC_KEY=$(echo $PUBLIC_KEYS | jq --arg latest_version "$LATEST_VERSION" '.data.keys[$latest_version].public_key' | sed "s/\"//g")

   echo -e "\n********** Save Key Pair ID to kv secrets engine **********\n"
   FUNDER_SECRETS_RESP=$(curl -s -w "\n%{http_code}" --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" $VAULT_ADDR/v1/kv/data/key-version)
   STATUS_CODE=$(echo "$FUNDER_SECRETS_RESP" | tail -n 1)
   FUNDER_SECRETS=$(echo "$FUNDER_SECRETS_RESP" | head -n -1)
   KEY_PAIR_ID=$(echo $FUNDER_SECRETS | jq '.data.data["keyPairId"]' | sed "s/\"//g")
   if [ $STATUS_CODE -eq 404 ]; then
      if [ $LATEST_VERSION -eq 1 ]; then
         echo "key-version path not found, creating Key Pair ID"
         KEY_PAIR_ID=$(uuidgen)
         POST_KEY_PAIR_ID_BODY=$( jq -n --arg keyPairId "$KEY_PAIR_ID" --argjson version "$LATEST_VERSION" '{data: { keyPairId: $keyPairId, version: $version }}')
         POST_KEY_PAIR_ID_RESP=$(curl -s -w "\n%{http_code}" -X POST --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" --data "$POST_KEY_PAIR_ID_BODY"  $VAULT_ADDR/v1/kv/data/key-version)
         STATUS_CODE=$(echo "$POST_KEY_PAIR_ID_RESP" | tail -n 1)
         KEY_PAIR_ID_RESP=$(echo "$POST_KEY_PAIR_ID_RESP" | head -n -1)
         if [ $STATUS_CODE -ne 200 ]; then
            echo "Error saving keyPairId"
            echo "Status Code : " $STATUS_CODE
            echo $KEY_PAIR_ID_RESP
            echo "Retry in 15 minutes"
            sleep 15m
            restart_vault
         fi
         echo "Key Pair ID succesfully saved to kv secrets engine"
      else
         echo "Error retrieving keyPairId"
         echo "Status Code : " $STATUS_CODE
         echo $FUNDER_SECRETS
         echo "Retry in 15 minutes"
         sleep 15m
         restart_vault
      fi
   else
      if [ $STATUS_CODE -ne 200 ]; then
         echo "Error retrieving keyPairId"
         echo "Status Code : " $STATUS_CODE
         echo $FUNDER_SECRETS
         echo "Retry in 15 minutes"
         sleep 15m
         restart_vault
      fi
   fi
   if [ $KEY_PAIR_ID = "null" ]; then
      if [ $LATEST_VERSION -eq 1 ]; then
         echo "Key Pair ID not found, creating Key Pair ID secret"
         KEY_PAIR_ID=$(uuidgen)
         POST_KEY_PAIR_ID_BODY=$( jq -n --arg keyPairId "$KEY_PAIR_ID" --argjson version "$LATEST_VERSION" '{data: { keyPairId: $keyPairId, version: $version }}')
         POST_KEY_PAIR_ID_RESP=$(curl -s -w "\n%{http_code}" -X POST --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" --data "$POST_KEY_PAIR_ID_BODY"  $VAULT_ADDR/v1/kv/data/key-version)
         STATUS_CODE=$(echo "$POST_KEY_PAIR_ID_RESP" | tail -n 1)
         KEY_PAIR_ID_RESP=$(echo "$POST_KEY_PAIR_ID_RESP" | head -n -1)
         if [ $STATUS_CODE -ne 200 ]; then
            echo "Error saving keyPairId"
            echo "Status Code : " $STATUS_CODE
            echo $KEY_PAIR_ID_RESP
            echo "Key Pair not saved to MOB : need to retry" > /vault/file/save-key-mob-error
            echo "Retry in 15 minutes"
            sleep 15m
            restart_vault
         fi
         echo "Key Pair ID succesfully saved to kv secrets engine"
         echo "Key Pair ID : " $KEY_PAIR_ID
      else
         echo "Error retrieving keyPairId"
         echo "Status Code : " $STATUS_CODE
         echo $FUNDER_SECRETS
         echo "Key Pair not saved to MOB : need to retry" > /vault/file/save-key-mob-error
         echo "Retry in 15 minutes"
         sleep 15m
         restart_vault
      fi
   else
      echo "Key Pair ID successfully retrieved"
      echo "Key Pair ID : " $KEY_PAIR_ID
   fi

   echo -e "\n********** Send Public Key to MOB For all funders **********\n"
   for funderId in $FUNDER_ID_ARRAY; do
      GET_FUNDER_RESP=$(curl -s -w "\n%{http_code}" --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" $VAULT_ADDR/v1/kv/data/$funderId)
      GET_FUNDER_STATUS_CODE=$(echo "$GET_FUNDER_RESP" | tail -n 1)
      FUNDER_INFO=$(echo "$GET_FUNDER_RESP" | head -n -1)
      FUNDER_KEY_PAIR_ID=$(echo $FUNDER_INFO | jq '.data.data["keyPairId"]' | sed "s/\"//g")
      FUNDER_KEY_VERSION=$(echo $FUNDER_INFO | jq '.data.data["version"]' | sed "s/\"//g")
      if [ $GET_FUNDER_STATUS_CODE -eq 404 ]; then
         echo -e "\nSaving Key to MOB for funder $funderId\n"
         POST_FUNDER_INFO_BODY=$( jq -n --arg keyPairId "$KEY_PAIR_ID" --argjson version "$LATEST_VERSION" '{data: { keyPairId: $keyPairId, version: $version }}')
         POST_FUNDER_INFO_RESP=$(curl -s -w "\n%{http_code}" -X POST --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" --data "$POST_FUNDER_INFO_BODY" $VAULT_ADDR/v1/kv/data/$funderId)
         POST_FUNDER_INFO_STATUS_CODE=$(echo "$POST_FUNDER_INFO_RESP" | tail -n 1)
         FUNDER_INFO=$(echo "$POST_FUNDER_INFO_RESP" | head -n -1)
         if [ $POST_FUNDER_INFO_STATUS_CODE -ne 200 ]; then
            echo "Error saving funderInfo to kv secrets engine"
            echo "Status Code : " $POST_FUNDER_INFO_STATUS_CODE
            echo $FUNDER_INFO | tee /vault/file/save-key-mob-error
            echo "Retry in 15 minutes"
            echo -e "\n********************************************************************************************\n"
         else
            KEYCLOAK_DATA="grant_type=client_credentials&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET"
            KEYCLOAK_LOGIN_RESP=$(curl -s -w "\n%{http_code}" --request POST --data "$KEYCLOAK_DATA" $IDP_URL/auth/realms/mcm/protocol/openid-connect/token)
            STATUS_CODE=$(echo "$KEYCLOAK_LOGIN_RESP" | tail -n 1)
            KEYCLOAK_LOGIN=$(echo "$KEYCLOAK_LOGIN_RESP" | head -n -1)
            if [ $STATUS_CODE -eq 200 ]; then
               KEYCLOAK_TOKEN=$(echo $KEYCLOAK_LOGIN | jq '.access_token' | sed "s/\"//g")
               PUT_PUBLIC_KEY_BODY=$( jq -n --arg id "$KEY_PAIR_ID" --arg pubKey "$(echo -e "$LATEST_PUBLIC_KEY")" --arg getKeyURL "$GET_KEY_URL" --arg loginURL "$LOGIN_URL" --arg expDate "$PUBLIC_KEY_EXPIRATION_DATE" --arg lastUpdateDate "$LAST_UPDATE_DATE" '{id: $id, version: 1, publicKey: $pubKey, expirationDate: $expDate, privateKeyAccess: { loginURL: $loginURL, getKeyURL: $getKeyURL }, lastUpdateDate: $lastUpdateDate}' )
               PUT_PUBLIC_KEY_RESPONSE=$(curl -s -w "\n%{http_code}" --header "Authorization: Bearer $KEYCLOAK_TOKEN" --header "Content-Type: application/json" --request PUT --data "$PUT_PUBLIC_KEY_BODY" $API_URL/v1/funders/$funderId/encryption_key)
               STATUS_CODE=$(echo "$PUT_PUBLIC_KEY_RESPONSE" | tail -n 1)
               PUT_PUBLIC_KEY=$(echo "$PUT_PUBLIC_KEY_RESPONSE" | head -n -1)
               if [ $STATUS_CODE -eq 204 ]; then
                  echo -e "\n********************************** Encryption Key Details **********************************\n"
                  echo "id : " $KEY_PAIR_ID
                  echo "version : " $LATEST_VERSION
                  echo -e "publicKey : $LATEST_PUBLIC_KEY"
                  echo "expirationDate : " $PUBLIC_KEY_EXPIRATION_DATE
                  echo "lastUpdateDate : " $LAST_UPDATE_DATE
                  echo "loginURL : " $LOGIN_URL
                  echo "getKeyURL : " $GET_KEY_URL
                  echo -e "\nEncryption Key $CLIENT_ID, version $LATEST_VERSION successfully saved to MOB for funder $funderId\n" | tee /vault/file/init-success
                  echo -e "\n********************************************************************************************\n"
               else   
                  echo "Error saving encryption key to MOB"
                  echo "Status Code : " $STATUS_CODE
                  echo $PUT_PUBLIC_KEY | tee /vault/file/save-key-mob-error
                  curl -s -w "\n%{http_code}" -X DELETE --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" $VAULT_ADDR/v1/kv/data/$funderId
                  echo "Retry in 15 minutes"
                  echo -e "\n********************************************************************************************\n"
               fi
            else
               echo "Keycloak login error"
               echo "Status Code : " $STATUS_CODE
               echo "$KEYCLOAK_LOGIN" | tee /vault/file/save-key-mob-error
               curl -s -w "\n%{http_code}" -X DELETE --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" $VAULT_ADDR/v1/kv/data/$funderId
               echo "Retry in 15 minutes"
               echo -e "\n********************************************************************************************\n"
            fi
         fi
      else
         if [ $GET_FUNDER_STATUS_CODE -eq 200 ]; then
            echo -e "\nEncryption Key already sent to MOB for funder $funderId\n"
         else
            echo "Error retrieving keyPairId and version for funder $funderId"
            echo "Status Code : " $GET_FUNDER_STATUS_CODE
            echo $FUNDER_INFO | tee /vault/file/save-key-mob-error
            echo "Retry in 15 minutes"
            echo -e "\n********************************************************************************************\n"
         fi
      fi
   done
   if [ -s /vault/file/save-key-mob-error ]; then
      rm /vault/file/save-key-mob-error
      sleep 15m
      restart_vault
   fi
}

start_vault () {
   check_vault_status
   init
   unseal
   root_log_in
   create_policy
   enable_cert
   create_cert_role_admin
   create_cert_role_manager
   create_token
   cert_log_in
   setup_cors
   enable_transit
   enable_secrets
   create_key_pair
}

restart_vault () {
   check_vault_status
   init
   unseal
   cert_log_in
   create_key_pair
}

start_vault
