
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    ALTER SCHEMA public RENAME TO idp_db;
    CREATE USER $POSTGRES_SERVICE_USER WITH PASSWORD '$POSTGRES_SERVICE_PASSWORD';
    GRANT CONNECT ON DATABASE idp_db TO $POSTGRES_SERVICE_USER;
    GRANT USAGE ON SCHEMA idp_db TO $POSTGRES_SERVICE_USER;
    GRANT SELECT ON ALL TABLES IN SCHEMA idp_db TO $POSTGRES_SERVICE_USER;
    GRANT SELECT ON ALL SEQUENCES IN SCHEMA idp_db TO $POSTGRES_SERVICE_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA idp_db GRANT SELECT ON TABLES TO $POSTGRES_SERVICE_USER;
EOSQL

