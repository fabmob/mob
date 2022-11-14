/* 
 * CREATE MONGODB SERVICE USER WITH ACCESS READ/WRITE ON DEDICATED DB
 * REPLACE VARIABLES WITH ONE FROM GITLAB CI
 */

const username = _getEnv('ENV_MONGO_SERVICE_USER');
const password = _getEnv('ENV_MONGO_SERVICE_PASSWORD');
const dbname = _getEnv('ENV_MONGO_DB_NAME');

db.createUser(
    {
        user: username,
        pwd: password,
        roles: [{ role: "readWrite", db: dbname }]
    }
);