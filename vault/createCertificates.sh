#!/bin/sh

if [ "$#" -ne 1 ]
then
  echo "Usage: Must supply a domain"
  exit 1
fi

DOMAIN=$1

mkdir $DOMAIN
cd $DOMAIN

### Certificate Authority

## Certificate Authority - Generating the Private Key and Root Certificate
echo -e "\n***** Generate Root CA Private Key *****\n"
openssl genrsa -des3 -out rootCA.key 2048
echo -e "\n***** Generate Root CA Certificate *****\n"
echo -e "\nDo not use the server domain as Common Name or it will not work\n"
openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 1825 -out rootCA.pem


## Certificate Authority - Installing Root Certificate 
# echo "Install Root CA in CA Store"
# cp rootCA.pem /usr/local/share/ca-certificates/rootCA.crt
# sudo update-ca-certificates


### CA Signed Certificates for Your Sites

## Creating the Private Key for your site

echo -e "\n***** Generate Server CA Private Key *****\n"
openssl genrsa -out $DOMAIN.key 2048
## Creating a Certificate Signing Request 
echo -e "\n***** Generate Server CA CSR *****\n"
openssl req -new -key $DOMAIN.key -out $DOMAIN.csr

# 
cat > $DOMAIN.ext << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names
[alt_names]
DNS.1 = $DOMAIN
EOF

## Creating the Certificate from Certificate Signing Request, CA Private Key, CA Root Certificate and config file
echo -e "\n***** Generate Server Certificate for $DOMAIN *****\n"
openssl x509 -req -in $DOMAIN.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out $DOMAIN.crt -days 825 -sha256 -extfile $DOMAIN.ext
echo -e "\n***** Convert Server Certificate to p12 format *****\n"
openssl pkcs12 -export -clcerts -in $DOMAIN.crt -inkey $DOMAIN.key -out $DOMAIN.p12

echo -e "\n***** Generate Admin Client Certificate Private Key *****\n"
openssl req -newkey rsa:2048 -days 1000 -nodes -keyout admin-client-key.pem > admin-client-req.pem
echo -e "\n***** Generate Admin Client Certificate signed by Root CA *****\n"
openssl x509 -req -in admin-client-req.pem -days 1000 -CA rootCA.pem -CAkey rootCA.key > admin-client-cert.pem
echo -e "\n***** Convert Admin Client Certificate to PKCS #12 format *****\n"
openssl pkcs12 -export -in admin-client-cert.pem -inkey admin-client-key.pem -out admin-client-cert.pfx

echo -e "\n***** Generate Manager Client Certificate Private Key *****\n"
openssl req -newkey rsa:2048 -days 1000 -nodes -keyout manager-client-key.pem > manager-client-req.pem
echo -e "\n***** Generate Manager Client Certificate signed by Root CA *****\n"
openssl x509 -req -in manager-client-req.pem -days 1000 -CA rootCA.pem -CAkey rootCA.key > manager-client-cert.pem
echo -e "\n***** Generate Manager Client Certificate to PKCS #12 format *****\n"
openssl pkcs12 -export -in manager-client-cert.pem -inkey manager-client-key.pem -out manager-client-cert.pfx