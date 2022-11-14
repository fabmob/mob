ARG BASE_IMAGE_VAULT
FROM ${BASE_IMAGE_VAULT}

ARG VAULT_CERT
ARG VAULT_KEY
ARG VAULT_ROOT_CA
ARG ADMIN_CERT
ARG ADMIN_CERT_KEY
ARG CLIENT_CA

RUN apk add --update coreutils apk-cron curl jq util-linux && rm -rf /var/cache/apk/*

COPY ./init-vault.sh /usr/local/bin/init-vault.sh
COPY ./renew-key.sh /usr/local/bin/renew-key.sh
COPY ./config.hcl /vault/config/config.hcl
COPY ./manager-policy.hcl /vault/config/manager-policy.hcl
COPY ./admin-policy.hcl /vault/config/admin-policy.hcl

COPY ${VAULT_CERT} /etc/ssl/certs/vault-cert.pem
COPY ${VAULT_KEY} /etc/ssl/certs/vault-key.pem
COPY ${VAULT_ROOT_CA} /etc/ssl/certs/vault-ca.pem

COPY ${CLIENT_CA} /etc/ssl/certs/client-ca.pem
COPY ${ADMIN_CERT} /etc/ssl/certs/admin-client-cert.pem
COPY ${ADMIN_CERT_KEY} /etc/ssl/certs/admin-client-key.pem

COPY vault-crontab /etc/cron.d/vault-crontab

ENV VAULT_CACERT=/etc/ssl/certs/vault-ca.pem

RUN chmod 777 -R /vault/config
RUN chmod 644 /etc/ssl/certs/vault-ca.pem
RUN chmod 644 /etc/ssl/certs/vault-cert.pem
RUN chmod 644 /etc/ssl/certs/vault-key.pem
RUN chmod 644 /etc/ssl/certs/client-ca.pem
RUN chmod 644 /etc/ssl/certs/admin-client-cert.pem
RUN chmod 644 /etc/ssl/certs/admin-client-key.pem
RUN chmod +x /usr/local/bin/init-vault.sh
RUN chmod +x /usr/local/bin/renew-key.sh
RUN chmod 0644 /etc/cron.d/vault-crontab && crontab /etc/cron.d/vault-crontab

EXPOSE 8200