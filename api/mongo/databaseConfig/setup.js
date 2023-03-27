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
  db.Incentive.createIndex({incentiveType: 1}),
  db.Incentive.createIndex({funderId: 1}),
  db.Incentive.createIndex({funderName: 1}),
  db.Incentive.createIndex({territoryIds: 1}),
  db.createCollection('Subscription'),
  db.Subscription.createIndex({lastName: 1}),
  db.Subscription.createIndex({funderId: 1}),
  db.Subscription.createIndex({incentiveId: 1}),
  db.Subscription.createIndex({incentiveType: 1}),
  db.Subscription.createIndex({status: 1}),
  db.createCollection('CronJob'),
  db.CronJob.createIndex({ "type": 1 }, { unique: true }),
  db.createCollection('Territory'),
  db.Territory.createIndex({ "name": 1 }, { unique: true }),
  db.createCollection('IncentiveEligibilityChecks'),
  db.IncentiveEligibilityChecks.insert({
    name: 'Identité FranceConnect',
    label: 'FranceConnectID',
    description: "Les données d'identité doivent être fournies/certifiées par FranceConnect",
    type: 'boolean',
    motifRejet: 'CompteNonFranceConnect'
  }),
  db.IncentiveEligibilityChecks.insert({
    name: '[Pré-version] Offre à caractère exclusive, non cumulable',
    label: 'ExcludeIncentives',
    description: "1 souscription valide pour un ensemble d'aides mutuellement exclusives",
    type: 'array',
    motifRejet: 'SouscriptionValideeExistante'
  }),
  db.IncentiveEligibilityChecks.insert({
    name: 'Demande CEE au RPC',
    label: 'RPCCEERequest',
    description: "1 seule demande par dispositif CEE, enregistrée dans le Registre de Preuve de Covoiturage. Les informations techniques du point d'accès RPC doivent être ajoutées sur le financeur.",
    type: 'boolean',
    motifRejet: 'RPCCEEDemandeInvalide'
  }),
  db.createCollection('Funder'),
  db.Funder.createIndex({ "name": 1 }, { unique: true }),
  db.Funder.createIndex({ "type": 1 }),
  db.createCollection('SubscriptionTimestamp'),
  db.SubscriptionTimestamp.createIndex({ "subscription.funderId": 1 }),
];
printjson(res);
