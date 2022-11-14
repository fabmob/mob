/* eslint-disable */
const username = _getEnv('MONGO_INITDB_NON_ROOT_USERNAME');
const password = _getEnv('MONGO_INITDB_NON_ROOT_PASSWORD');
const dbname = _getEnv('MONGO_INITDB_DATABASE');

db.createUser(
    {
        user: username,
        pwd: password,
        roles: [{ role: "readWrite", db: dbname }]
    }
);