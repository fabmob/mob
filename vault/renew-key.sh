#!/bin/sh

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
      renew_key
   fi
   export AUTH_TOKEN=$(echo $CERT_LOGIN_RESP | jq '.auth.client_token' | sed "s/\"//g" )
   vault login $AUTH_TOKEN > /dev/null
   echo -e "\nCert Login success\n"
}

renew_key () {
    echo -e "\n**********"
    echo "Renew Key"
    echo -e "**********\n"

    cert_log_in

    echo -e "\n********** Retrieving Encryption Key **********\n"
    VAULT_KEYS_RESP=$(curl --cacert /etc/ssl/certs/vault-ca.pem -s -w "\n%{http_code}" --header "X-Vault-Token: $AUTH_TOKEN" $VAULT_ADDR/v1/transit/keys/$CLIENT_ID)
    STATUS_CODE=$(echo "$VAULT_KEYS_RESP" | tail -n 1)
    VAULT_KEYS=$(echo "$VAULT_KEYS_RESP" | head -n -1)
    if [ $STATUS_CODE -eq 200 ]; then
        GET_KEY_VERSION_RESP=$(curl -s -w "\n%{http_code}" --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" $VAULT_ADDR/v1/kv/data/key-version)
        GET_KEY_VERSION_STATUS_CODE=$(echo "$GET_KEY_VERSION_RESP" | tail -n 1)
        KEY_PAIR_INFO=$(echo "$GET_KEY_VERSION_RESP" | head -n -1)
        KEY_PAIR_ID=$(echo $KEY_PAIR_INFO | jq '.data.data["keyPairId"]' | sed "s/\"//g")
        KEY_VERSION=$(echo $KEY_PAIR_INFO | jq '.data.data["version"]' | sed "s/\"//g")
        if [ $GET_KEY_VERSION_STATUS_CODE -eq 200 ]; then
            echo -e "\nEncryption Key retrieved\n"
            echo " Key Pair ID : " $KEY_PAIR_ID
            echo " Key Version : " $KEY_VERSION
        else
            echo -e "\nKey Pair ID not yet created, wait for init script to complete or restart vault-init\n"
            echo "Retry in 15 minutes"
            sleep 15m
            renew_key
        fi
    else
        echo "Status Code : " $STATUS_CODE
        echo "Error retrieving Encryption Key : " $VAULT_KEYS
        echo "Retry in 15 minutes"
        sleep 15m
        renew_key
    fi

    AVAILABLE_KEYS="${AVAILABLE_KEYS:=2}"
    LATEST_VERSION=$(echo $VAULT_KEYS | jq '.data.latest_version')
    MIN_AVAILABLE_VERSION=$(echo $VAULT_KEYS | jq '.data.min_available_version')
    LATEST_PUBLIC_KEY=$(echo $VAULT_KEYS | jq --arg lastver "$LATEST_VERSION" '.data.keys[$lastver].public_key')

    LATEST_PUBLIC_KEY_CREATION_TIME=$(echo $VAULT_KEYS | jq --arg lastver "$LATEST_VERSION" '.data.keys[$lastver].creation_time')
    CREATION_TIME_FORMATTED=$(echo ${LATEST_PUBLIC_KEY_CREATION_TIME%Z*} | sed "s/\"//g")
    PUBLIC_KEY_EXPIRATION_DATE=$(date -d "$CREATION_TIME_FORMATTED 6 months" +"%Y-%m-%dT%H:%M:%SZ" | sed "s/\"//g")
    CURRENT_DATE=$(date +"%Y-%m-%d %H:%M:%S")
    CURRENT_DATE_SECONDS=$(date +"%s")
    LAST_UPDATE_DATE=$(date +"%Y-%m-%dT%H:%M:%SZ" | sed "s/\"//g")
    TWO_WEEKS_BEFORE_EXPIRATION_DATE=$(date -d "$CREATION_TIME_FORMATTED 168 days" +"%Y-%m-%d %H:%M:%S")
    TWO_WEEKS_BEFORE_EXPIRATION_DATE_SECONDS=$(date -d "$TWO_WEEKS_BEFORE_EXPIRATION_DATE" +"%s")

    if [ -z "$FUNDER_IDS" ]; then
        echo -e "\n********** Retrieving Funder ID List from kv secrets engine **********\n"
        FUNDER_SECRETS_RESP=$(curl -s -w "\n%{http_code}" --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" $VAULT_ADDR/v1/kv/data/$CLIENT_ID)
        STATUS_CODE=$(echo "$FUNDER_SECRETS_RESP" | tail -n 1)
        FUNDER_SECRETS=$(echo "$FUNDER_SECRETS_RESP" | head -n -1)
        if [ $STATUS_CODE -ne 200 ]; then
            echo "Status Code : " $STATUS_CODE
            echo "Error retrieving funder secrets"
            echo $FUNDER_SECRETS
            echo "Retry in 15 minutes"
            sleep 15m
            renew_key
        fi
        FUNDER_IDS=$(echo $FUNDER_SECRETS | jq '.data.data["funderIdList"]' | sed "s/\"//g")
        if [ $FUNDER_IDS = "null" ]; then
            echo "Error retrieving Funder ID List"
            echo "Retry in 15 minutes"
            sleep 15m
            renew_key
        fi
        echo "Funder ID List successfully retrieved"
        echo "Funder ID List : " $FUNDER_IDS
    fi

    LOGIN_URL="$VAULT_ADDR/v1/auth/cert/login"
    CURRENT_VERSION=$LATEST_VERSION

    if [ $CURRENT_DATE_SECONDS -gt $TWO_WEEKS_BEFORE_EXPIRATION_DATE_SECONDS ]; then
        echo "Encryption Key Expired"
        echo -e "\n********** Sending new version of Encryption Key to MOB **********\n"
        CURRENT_VERSION="$(($LATEST_VERSION + 1))"
        MIN_VERSION="$(($CURRENT_VERSION - $AVAILABLE_KEYS + 1))"
        if [ $MIN_VERSION -gt 1 ]; then
            vault write -f transit/keys/$CLIENT_ID/config min_decryption_version=$MIN_VERSION min_encryption_version=$MIN_VERSION
            vault write -f transit/keys/$CLIENT_ID/trim min_available_version=$MIN_VERSION
        else
            vault write -f transit/keys/$CLIENT_ID/config min_decryption_version=1 min_encryption_version=1
            vault write -f transit/keys/$CLIENT_ID/trim min_available_version=1
        fi
        vault write -f transit/keys/$CLIENT_ID/rotate

        PUBLIC_KEYS=$(curl -s --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" $VAULT_ADDR/v1/transit/keys/$CLIENT_ID)

        LATEST_PUBLIC_KEY_CREATION_TIME=$(echo $PUBLIC_KEYS | jq --arg lastver "$CURRENT_VERSION" '.data.keys[$lastver].creation_time')
        CREATION_TIME_FORMATTED=$(echo ${LATEST_PUBLIC_KEY_CREATION_TIME%Z*} | sed "s/\"//g")
        PUBLIC_KEY_EXPIRATION_DATE=$(date -d "$CREATION_TIME_FORMATTED 6 months" +"%Y-%m-%dT%H:%M:%SZ" | sed "s/\"//g")

        LATEST_PUBLIC_KEY=$(echo $PUBLIC_KEYS | jq --arg lastver "$CURRENT_VERSION" '.data.keys[$lastver].public_key' | sed "s/\"//g")

        echo -e "\n********** Save Key Pair ID to kv secrets engine **********\n"
        KEY_PAIR_ID=$(uuidgen)
        POST_KEY_PAIR_ID_BODY=$( jq -n --arg keyPairId "$KEY_PAIR_ID" --argjson version "$CURRENT_VERSION" '{data: { keyPairId: $keyPairId, version: $version }}')
        POST_KEY_PAIR_ID_RESP=$(curl -s -w "\n%{http_code}" -X POST --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" --data "$POST_KEY_PAIR_ID_BODY"  $VAULT_ADDR/v1/kv/data/key-version)
        STATUS_CODE=$(echo "$POST_KEY_PAIR_ID_RESP" | tail -n 1)
        KEY_PAIR_ID_RESP=$(echo "$POST_KEY_PAIR_ID_RESP" | head -n -1)
        if [ $STATUS_CODE -ne 200 ]; then
            echo "Error saving keyPairId"
            echo "Status Code : " $STATUS_CODE
            echo $KEY_PAIR_ID_RESP
            echo "Retry in 15 minutes"
            echo -e "\n********************************************************************************************\n"
        else
            echo "Key Pair ID succesfully saved to kv secrets engine"
        fi
    else
        echo "Encryption Key is still valid"
        echo "Encryption Key will be rotated 2 weeks before the expiration date"
        echo "Rotation date" $TWO_WEEKS_BEFORE_EXPIRATION_DATE
    fi
    GET_KEY_URL="$VAULT_ADDR/v1/transit/export/encryption-key/$CLIENT_ID/$CURRENT_VERSION"

    echo -e "\n********** Send Public Key to MOB For all funders **********\n"
    FUNDER_ID_ARRAY=${FUNDER_IDS//,/ }
    for funderId in $FUNDER_ID_ARRAY; do
        echo -e "\nSaving Key to MOB for funder $funderId\n"
        
        GET_FUNDER_RESP=$(curl -s -w "\n%{http_code}" --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" $VAULT_ADDR/v1/kv/data/$funderId)
        GET_FUNDER_STATUS_CODE=$(echo "$GET_FUNDER_RESP" | tail -n 1)
        FUNDER_INFO=$(echo "$GET_FUNDER_RESP" | head -n -1)
        FUNDER_KEY_PAIR_ID=$(echo $FUNDER_INFO | jq '.data.data["keyPairId"]' | sed "s/\"//g")
        FUNDER_KEY_VERSION=$(echo $FUNDER_INFO | jq '.data.data["version"]' | sed "s/\"//g")
        if [ $GET_FUNDER_STATUS_CODE -eq 404 ]; then
            echo -e "\nSaving Key to MOB for funder $funderId\n"
            POST_FUNDER_INFO_BODY=$( jq -n --arg keyPairId "$KEY_PAIR_ID" --argjson version "$CURRENT_VERSION" '{data: { keyPairId: $keyPairId, version: $version }}')
            POST_FUNDER_INFO_RESP=$(curl -s -w "\n%{http_code}" -X POST --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" --data "$POST_FUNDER_INFO_BODY" $VAULT_ADDR/v1/kv/data/$funderId)
            POST_FUNDER_INFO_STATUS_CODE=$(echo "$POST_FUNDER_INFO_RESP" | tail -n 1)
            FUNDER_INFO=$(echo "$POST_FUNDER_INFO_RESP" | head -n -1)
            if [ $POST_FUNDER_INFO_STATUS_CODE -ne 200 ]; then
                echo "Error saving funderInfo to kv secrets engine"
                echo "Status Code : " $POST_FUNDER_INFO_STATUS_CODE
                echo $FUNDER_INFO | tee -a /vault/file/update-key-mob-error
                echo "Retry in 15 minutes"
                echo -e "\n********************************************************************************************\n"
            else
                KEYCLOAK_DATA="grant_type=client_credentials&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET"
                KEYCLOAK_LOGIN_RESP=$(curl -s -w "\n%{http_code}" --request POST --data "$KEYCLOAK_DATA" $IDP_URL/auth/realms/mcm/protocol/openid-connect/token)
                STATUS_CODE=$(echo "$KEYCLOAK_LOGIN_RESP" | tail -n 1)
                KEYCLOAK_LOGIN=$(echo "$KEYCLOAK_LOGIN_RESP" | head -n -1)
                if [ $STATUS_CODE -eq 200 ]; then
                    KEYCLOAK_TOKEN=$(echo $KEYCLOAK_LOGIN | jq '.access_token' | sed "s/\"//g")
                    PUT_PUBLIC_KEY_BODY=$( jq -n --arg id "$KEY_PAIR_ID" --argjson version "$CURRENT_VERSION" --arg pubKey "$(echo -e "$LATEST_PUBLIC_KEY")" --arg getKeyURL "$GET_KEY_URL" --arg loginURL "$LOGIN_URL" --arg expDate "$PUBLIC_KEY_EXPIRATION_DATE" --arg lastUpdateDate "$LAST_UPDATE_DATE" '{id: $id, version: $version, publicKey: $pubKey, expirationDate: $expDate, privateKeyAccess: { loginURL: $loginURL, getKeyURL: $getKeyURL }, lastUpdateDate: $lastUpdateDate}' )
                    PUT_PUBLIC_KEY_RESPONSE=$(curl -s -w "\n%{http_code}" --header "Authorization: Bearer $KEYCLOAK_TOKEN" --header "Content-Type: application/json" --request PUT --data "$PUT_PUBLIC_KEY_BODY" $API_URL/v1/funders/$funderId/encryption_key)
                    STATUS_CODE=$(echo "$PUT_PUBLIC_KEY_RESPONSE" | tail -n 1)
                    PUT_PUBLIC_KEY=$(echo "$PUT_PUBLIC_KEY_RESPONSE" | head -n -1)
                    if [ $STATUS_CODE -eq 204 ]; then
                        echo -e "\n********************************** Encryption Key Details **********************************\n"
                        echo "id : " $KEY_PAIR_ID
                        echo "version : " $CURRENT_VERSION
                        echo -e "publicKey : $LATEST_PUBLIC_KEY"
                        echo "expirationDate : " $PUBLIC_KEY_EXPIRATION_DATE
                        echo "lastUpdateDate : " $LAST_UPDATE_DATE
                        echo "loginURL : " $LOGIN_URL
                        echo "getKeyURL : " $GET_KEY_URL
                        echo -e "\nEncryption Key $CLIENT_ID, version $CURRENT_VERSION successfully saved to MOB for funder $funderId\n" | tee -a /vault/file/init-success
                        echo -e "\n********************************************************************************************\n"
                    else   
                        echo "Error saving encryption key to MOB"
                        echo "Status Code : " $STATUS_CODE
                        echo $PUT_PUBLIC_KEY | tee -a /vault/file/update-key-mob-error
                        curl -s -w "\n%{http_code}" -X DELETE --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" $VAULT_ADDR/v1/kv/data/$funderId
                        echo "Retry in 15 minutes"
                        echo -e "\n********************************************************************************************\n"
                    fi
                else
                    echo "Keycloak login error"
                    echo "Status Code : " $STATUS_CODE
                    echo "$KEYCLOAK_LOGIN" | tee -a /vault/file/update-key-mob-error
                    curl -s -w "\n%{http_code}" -X DELETE --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" $VAULT_ADDR/v1/kv/data/$funderId
                    echo "Retry in 15 minutes"
                    echo -e "\n********************************************************************************************\n"
                fi
            fi
        else
            if [ $GET_FUNDER_STATUS_CODE -eq 200 ]; then
                echo "FUNDER_KEY_PAIR_ID : " $FUNDER_KEY_PAIR_ID
                echo "KEY_PAIR_ID : " $KEY_PAIR_ID
                if [ "$FUNDER_KEY_PAIR_ID" = "$KEY_PAIR_ID" ]; then
                    echo -e "\nEncryption Key already sent to MOB for funder $funderId\n"
                else
                    echo -e "\nSave Encryption Key to MOB for funder $funderId\n"
                    POST_FUNDER_INFO_BODY=$( jq -n --arg keyPairId "$KEY_PAIR_ID" --argjson version "$CURRENT_VERSION" '{data: { keyPairId: $keyPairId, version: $version }}')
                    POST_FUNDER_INFO_RESP=$(curl -s -w "\n%{http_code}" -X POST --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" --data "$POST_FUNDER_INFO_BODY" $VAULT_ADDR/v1/kv/data/$funderId)
                    POST_FUNDER_INFO_STATUS_CODE=$(echo "$POST_FUNDER_INFO_RESP" | tail -n 1)
                    FUNDER_INFO=$(echo "$POST_FUNDER_INFO_RESP" | head -n -1)
                    if [ $POST_FUNDER_INFO_STATUS_CODE -ne 200 ]; then
                        echo "Error saving funderInfo to kv secrets engine"
                        echo "Status Code : " $POST_FUNDER_INFO_STATUS_CODE
                        echo $FUNDER_INFO | tee -a /vault/file/update-key-mob-error
                        echo "Retry in 15 minutes"
                        echo -e "\n********************************************************************************************\n"
                    else
                        KEYCLOAK_DATA="grant_type=client_credentials&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET"
                        KEYCLOAK_LOGIN_RESP=$(curl -s -w "\n%{http_code}" --request POST --data "$KEYCLOAK_DATA" $IDP_URL/auth/realms/mcm/protocol/openid-connect/token)
                        STATUS_CODE=$(echo "$KEYCLOAK_LOGIN_RESP" | tail -n 1)
                        KEYCLOAK_LOGIN=$(echo "$KEYCLOAK_LOGIN_RESP" | head -n -1)
                        if [ $STATUS_CODE -eq 200 ]; then
                            KEYCLOAK_TOKEN=$(echo $KEYCLOAK_LOGIN | jq '.access_token' | sed "s/\"//g")
                            PUT_PUBLIC_KEY_BODY=$( jq -n --arg id "$KEY_PAIR_ID" --argjson version "$CURRENT_VERSION" --arg pubKey "$(echo -e "$LATEST_PUBLIC_KEY")" --arg getKeyURL "$GET_KEY_URL" --arg loginURL "$LOGIN_URL" --arg expDate "$PUBLIC_KEY_EXPIRATION_DATE" --arg lastUpdateDate "$LAST_UPDATE_DATE" '{id: $id, version: $version, publicKey: $pubKey, expirationDate: $expDate, privateKeyAccess: { loginURL: $loginURL, getKeyURL: $getKeyURL }, lastUpdateDate: $lastUpdateDate}' )
                            PUT_PUBLIC_KEY_RESPONSE=$(curl -s -w "\n%{http_code}" --header "Authorization: Bearer $KEYCLOAK_TOKEN" --header "Content-Type: application/json" --request PUT --data "$PUT_PUBLIC_KEY_BODY" $API_URL/v1/funders/$funderId/encryption_key)
                            STATUS_CODE=$(echo "$PUT_PUBLIC_KEY_RESPONSE" | tail -n 1)
                            PUT_PUBLIC_KEY=$(echo "$PUT_PUBLIC_KEY_RESPONSE" | head -n -1)
                            if [ $STATUS_CODE -eq 204 ]; then
                                echo -e "\n********************************** Encryption Key Details **********************************\n"
                                echo "id : " $KEY_PAIR_ID
                                echo "version : " $CURRENT_VERSION
                                echo -e "publicKey : $LATEST_PUBLIC_KEY"
                                echo "expirationDate : " $PUBLIC_KEY_EXPIRATION_DATE
                                echo "lastUpdateDate : " $LAST_UPDATE_DATE
                                echo "loginURL : " $LOGIN_URL
                                echo "getKeyURL : " $GET_KEY_URL
                                echo -e "\nEncryption Key $CLIENT_ID, version $CURRENT_VERSION successfully saved to MOB for funder $funderId\n" | tee -a /vault/file/init-success
                                echo -e "\n********************************************************************************************\n"
                            else   
                                echo "Error saving encryption key to MOB"
                                echo "Status Code : " $STATUS_CODE
                                echo $PUT_PUBLIC_KEY | tee -a /vault/file/update-key-mob-error
                                curl -s -w "\n%{http_code}" -X DELETE --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" $VAULT_ADDR/v1/kv/data/$funderId
                                echo "Retry in 15 minutes"
                                echo -e "\n********************************************************************************************\n"
                            fi
                        else
                            echo "Keycloak login error"
                            echo "Status Code : " $STATUS_CODE
                            echo "$KEYCLOAK_LOGIN" | tee -a /vault/file/update-key-mob-error
                            curl -s -w "\n%{http_code}" -X DELETE --cacert /etc/ssl/certs/vault-ca.pem --header "X-Vault-Token: $AUTH_TOKEN" $VAULT_ADDR/v1/kv/data/$funderId
                            echo "Retry in 15 minutes"
                            echo -e "\n********************************************************************************************\n"
                        fi
                    fi
                fi
            else
                echo "Error retrieving keyPairId and version for funder $funderId"
                echo "Status Code : " $GET_FUNDER_STATUS_CODE
                echo $FUNDER_INFO | tee -a /vault/file/update-key-mob-error
                echo "Retry in 15 minutes"
                echo -e "\n********************************************************************************************\n"
            fi
        fi
    done
    if [ -s /vault/file/update-key-mob-error ]; then
        cat /vault/file/update-key-mob-error
        rm /vault/file/update-key-mob-error
        sleep 15m
        renew_key
    fi
}

renew_key