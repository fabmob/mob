#!/usr/bin/python3
from sh import mongodump
import os

# Dump database collections into directory
def dump_database():

    print('MONGO dump started')
    
    host = os.environ.get('TESTING_MONGO_HOST')
    user = os.environ.get('TESTING_MONGO_SERVICE_USER')
    passwd = os.environ.get('TESTING_MONGO_SERVICE_PASSWORD')
    db = os.environ.get('TESTING_MONGO_DB_NAME')

    mongodump(
        ('--uri=mongodb+srv://%s:%s@%s/%s?retryWrites=true&w=majority' % (user, passwd, host, db)))

    print('MONGO dump finished')

if __name__ == '__main__':
    dump_database()