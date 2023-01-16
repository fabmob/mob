/** COMMONS */

export enum HTTP_METHOD {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

/** EVENT EMITTER */
export enum EVENT_MESSAGE {
  READY = 'READY',
  UPDATE = 'UPDATE',
  ACK = 'ACKNOWLEDGE',
  CONSUME = 'CONSUME',
}

/** IDP */
export enum GROUPS {
  citizens = 'citoyens',
  funders = 'financeurs',
  admins = 'admins',
  collectivities = 'collectivités',
  enterprises = 'entreprises',
}

export enum FUNDER_TYPE {
  enterprise = 'entreprise',
  collectivity = 'collectivit\u00E9',
}

export enum Roles {
  CONTENT_EDITOR = 'content_editor', // admin_fonctionnel
  FUNDERS = 'financeurs',
  MANAGERS = 'gestionnaires',
  SUPERVISORS = 'superviseurs',
  MAAS = 'maas',
  MAAS_BACKEND = 'service_maas',
  SIRH_BACKEND = 'service_sirh',
  PLATFORM = 'platform', // used to determine user from website
  API_KEY = 'api-key',
  CITIZENS = 'citoyens',
  VAULT_BACKEND = 'service_vault',
}

export enum IDP_EMAIL_TEMPLATE {
  FUNDER = 'financeur',
  CITIZEN = 'citoyen',
}

/** INCENTIVES */
export enum INCENTIVE_TYPE {
  NATIONAL_INCENTIVE = 'AideNationale',
  TERRITORY_INCENTIVE = 'AideTerritoire',
  EMPLOYER_INCENTIVE = 'AideEmployeur',
}

export enum TRANSPORTS {
  PUBLIC_TRANSPORT = 'transportsCommun',
  BIKE = 'velo',
  CAR = 'voiture',
  SHARE_SERVICE = 'libreService',
  ELECTRIC = 'electrique',
  CAR_SHARING = 'autopartage',
  CARPOOLING = 'covoiturage',
}

export enum SUBSCRIPTION_CHECK_MODE {
  MANUAL = 'MANUEL',
  AUTOMATIC = 'AUTOMATIQUE',
}

export enum ELIGIBILITY_CHECKS_LABEL {
  FRANCE_CONNECT = 'FranceConnectID',
  EXCLUSION = 'ExcludeIncentives',
  RPC_CEE_REQUEST = 'RPCCEERequest',
}

/** CONTACT */
export enum USERTYPE {
  CITIZEN = 'citoyen',
  EMPLOYER = 'employeur',
  COLLECTIVITY = 'collectivite',
  MOBILITY_OPERATOR = 'operateurMobilite',
}

/** CITIZENS */
export enum AFFILIATION_STATUS {
  TO_AFFILIATE = 'A_AFFILIER',
  AFFILIATED = 'AFFILIE',
  DISAFFILIATED = 'DESAFFILIE',
  UNKNOWN = 'UNKNOWN',
}

export enum CITIZEN_STATUS {
  EMPLOYEE = 'salarie',
  STUDENT = 'etudiant',
  INDEPENDANT_LIBERAL = 'independantLiberal',
  RETIRED = 'retraite',
  UNEMPLOYED = 'sansEmploi',
}

export enum GENDER {
  MALE = 'male',
  FEMALE = 'female',
}

/** SUBSCRIPTIONS */

export enum SUBSCRIPTION_STATUS {
  ERROR = 'ERREUR',
  TO_PROCESS = 'A_TRAITER',
  VALIDATED = 'VALIDEE',
  REJECTED = 'REJETEE',
  DRAFT = 'BROUILLON',
}
export enum HRIS_SUBSCRIPTION_ERROR {
  ERROR = 'ERREUR',
}

export enum REJECTION_REASON {
  CONDITION = 'ConditionsNonRespectees',
  MISSING_PROOF = 'JustificatifManquant',
  INVALID_PROOF = 'JustificatifInvalide',
  NOT_FRANCECONNECT = 'CompteNonFranceConnect',
  INVALID_RPC_CEE_REQUEST = 'RPCCEEDemandeInvalide',
  VALID_SUBSCRIPTION_EXISTS = 'SouscriptionValideeExistante',
  OTHER = 'Autre',
}

export enum PAYMENT_MODE {
  NONE = 'aucun',
  UNIQUE = 'unique',
  MULTIPLE = 'multiple',
}

export enum PAYMENT_FREQ {
  MONTHLY = 'mensuelle',
  QUARTERLY = 'trimestrielle',
}

export enum USER_STATUS {
  salarie = 'Salarié',
  etudiant = 'Étudiant',
  independantLiberal = 'Indépendant / Profession libérale',
  retraite = 'Retraité',
  sansEmploi = 'Sans emploi',
}

export enum GET_INCENTIVES_INFORMATION_MESSAGES {
  // eslint-disable-next-line
  CITIZEN_AFFILIATED_WITHOUT_INCENTIVES = "Le Citoyen est bien affilié à son employeur, mais il ne dispose pas d'aides.",
  CITIZEN_NOT_AFFILIATED = "Le Citoyen n'est pas affilié à son employeur.",
}

export enum AUTH_STRATEGY {
  KEYCLOAK = 'keycloak',
  API_KEY = 'api-key',
}

export enum REASON_REJECT_TEXT {
  CONDITION = "Conditions d'éligibilité non respectées",
  MISSING_PROOF = 'Justificatif manquant',
  INVALID_PROOF = 'Justificatif invalide ou non lisible',
  NOT_FRANCECONNECT = 'Compte du conducteur non FranceConnecté',
  INVALID_RPC_CEE_REQUEST = 'Demande RPC CEE rejetée',
  VALID_SUBSCRIPTION_EXISTS = `Autre Demande d'aide déjà accordée`,
}

export enum SEND_MODE {
  VALIDATION = 'validée',
  REJECTION = 'refusée',
}

/** RABBITMQ */
export enum UPDATE_MODE {
  ADD = 'ADD',
  DELETE = 'DELETE',
}

export enum CONSUMER_ERROR {
  DATE_ERROR = 'The date of the last payment must be greater than two months from the validation date',
  ERROR_MESSAGE = "Votre employeur n'a pas pu traiter votre demande",
}

export enum CRON_TYPES {
  DELETE_SUBSCRIPTION = 'Delete_subscription',
}

export enum GENDER_TYPE {
  UNKNOWN = 0,
  MALE = 1,
  FEMALE = 2,
  NOT_APPLICABLE = 9,
}

export enum SCOPES {
  FUNDERS_CLIENTS = 'funders-clients',
}

export enum SOURCES {
  FRANCE_CONNECT = 'franceconnect.gouv.fr',
  MOB = 'moncomptemobilite.fr',
}
