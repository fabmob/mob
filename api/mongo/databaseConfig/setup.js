/* eslint-disable */
const res = [
  db.createCollection('Incentive'),
  db.Incentive.createIndex(
    {
      '$**': 'text',
    },
    {
      unique: false,
      name: 'fullText',
      default_language: 'french',
    },
  ),
  db.Incentive.createIndex({funderId: 1}),
  db.createCollection('Subscription'),
  db.Subscription.createIndex({lastName: 1}),
  db.Subscription.createIndex({funderId: 1}),
  db.Subscription.createIndex({incentiveId: 1}),
  db.Subscription.createIndex({incentiveType: 1}),
  db.Subscription.createIndex({status: 1}),
  db.createCollection('Citizen'),
  db.Citizen.createIndex({'identity.lastName.value': 1}),
  db.createCollection('CronJob'),
  db.CronJob.createIndex({ "type": 1 }, { unique: true }),
  db.Territory.createIndex({ "name": 1 }, { unique: true })
];
printjson(res);
