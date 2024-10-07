# Afapast

A voucher distribution tool, reading mob subscription API and sending emails with vouchers.

Also an API in itself to manage tracked incentives and vouchers.

## Install dependencies

By default, dependencies were installed when this application was generated.
Whenever dependencies in `package.json` are changed, run the following command:

```sh
npm install
```


## Run the application

Migrate the db if it's the first time
```sh
yarn migrate
```

```sh
yarn start
```

Open http://127.0.0.1:3002 in your browser.

## Env variables

| Variables                | Description                                                  | Mandatory   | Default value if unspecified |
| ------------------------ | ------------------------------------------------------------ | ----------- | ---------------------------- |
| HOST                     | Service host                                                 | No          | '127.0.0.1' |
| PORT                     | Service port                                                 | No          | 3002 |
| API_KEY                  | Api Key authorizing queries to this project API              | No, but recommended | 'apikey' |
| EMAIL_FROM               | email used as a sender, only used with NODE_ENV='production' | Only in production | |
| EMAIL_HOST               | smtp host, only used with NODE_ENV='production'              | Only in production | |
| EMAIL_PORT               | smtp port, only used with NODE_ENV='production'              | Only in production | |
| MOB_TOKEN_URL            | oidc token url for mob                                       | No          | 'http://localhost:9000/auth/realms/mcm/protocol/openid-connect/token' |
| MOB_CLIENT_ID            | oidc client id to fetch a token                              | No          | 'simulation-maas-backend' |
| MOB_CLIENT_SECRET        | oidc client secret to fetch a token                          | No          | '4x1zfk4p4d7ZdLPAsaWBhd5mu86n5ZWN' |
| MOB_API_SUBSCRIPTION_URL | subscription url                                             | No          | 'http://localhost:3000/v1/subscriptions' |
