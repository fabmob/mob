storage "file" {
  path    = "/vault/file/data"
}
 
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_cert_file = "/etc/ssl/certs/vault-cert.pem"
  tls_key_file  = "/etc/ssl/certs/vault-key.pem"
  tls_client_ca_file = "/etc/ssl/certs/vault-ca.pem"
}
 
ui = true