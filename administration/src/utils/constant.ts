/* eslint-disable */

export const API_VERSION = 'v1';

export async function URL_API() {
  const response = await (await fetch('/keycloak.json')).json();
  let API_FQDN = response.apiConfig;
  return API_FQDN + API_VERSION;
}

export const TRANSPORT_CHOICE = [
  { id: 'transportsCommun', name: 'Transports en commun' },
  { id: 'velo', name: 'Vélo' },
  { id: 'voiture', name: 'Voiture' },
  { id: 'libreService', name: '2 ou 3 roues en libre-service' },
  { id: 'electrique', name: '2 ou 3 roues électrique' },
  { id: 'autopartage', name: 'Autopartage' },
  { id: 'covoiturage', name: 'Covoiturage' },
];

export enum INCENTIVE_TYPE {
  NATIONAL_INCENTIVE = 'AideNationale',
  TERRITORY_INCENTIVE = 'AideTerritoire',
  EMPLOYER_INCENTIVE = 'AideEmployeur'
}

export const INCENTIVE_TYPE_CHOICE = [
  { id: INCENTIVE_TYPE.NATIONAL_INCENTIVE, name: 'Aide nationale' },
  { id: INCENTIVE_TYPE.TERRITORY_INCENTIVE, name: 'Aide de mon territoire' },
  { id: INCENTIVE_TYPE.EMPLOYER_INCENTIVE, name: 'Aide de mon employeur' },
];

export const MAPPING_FUNDER_TYPE = {
  [INCENTIVE_TYPE.NATIONAL_INCENTIVE]: 'nationale',
  [INCENTIVE_TYPE.TERRITORY_INCENTIVE]: 'collectivité',
  [INCENTIVE_TYPE.EMPLOYER_INCENTIVE]: 'entreprise',
};

export const PROOF_CHOICE = [
  { id: 'identite', name: "Pièce d'Identité" },
  {
    id: 'justificatifDomicile',
    name: 'Justificatif de domicile de moins de 3 mois',
  },
  { id: 'certificatMedical', name: 'Certificat médical' },
  { id: 'rib', name: 'RIB' },
  { id: 'attestationHonneur', name: "Attestation sur l'Honneur" },
  { id: 'factureAchat', name: "Facture d'achat" },
  { id: 'certificatImmatriculation', name: "Certificat d'immatriculation" },
  { id: 'justificatifEmancipation', name: "Justificatif d'émancipation" },
  { id: 'impositionRevenu', name: "Dernier avis d'imposition sur le revenu" },
  {
    id: 'situationPoleEmploi',
    name: 'Dernier relevé de situation Pôle Emploi',
  },
  { id: 'certificatScolarite', name: 'Certificat de Scolarité' },
];

export const INPUT_FORMAT_CHOICE = [
  { id: 'Texte', name: 'Texte' },
  { id: 'Date', name: 'Date' },
  { id: 'Numerique', name: 'Numérique' },
  { id: 'listeChoix', name: 'Sélection parmi une liste de choix' },
];

export const errorFetching = {
  messageApi: 'Failed to fetch',
  messageToDisplay:
    "Il semble qu'il y ait un problème, votre requête n'a pas pu aboutir. Merci de réessayer ultérieurement.",
};

export const ROLES = {
  gestionnaires: 'gestionnaires',
  superviseurs: 'superviseurs',
};

export const SUBSCRIPTION_CHECK_MODE = [
  { id: 'MANUEL', name: 'Manuel' },
  { id: 'AUTOMATIQUE', name: 'Automatique' },
];

/** TERRITORIES */
export enum TERRITORY_SCALE {
  MUNICIPALITY = 'Commune',
  AGGLOMERATION = 'Agglomération',
  COUNTY = 'Département',
  REGION = 'Région',
  NATIONAL = 'Nationale'
};

export const TERRITORY_SCALE_CHOICE = [
  { id: TERRITORY_SCALE.MUNICIPALITY, name: TERRITORY_SCALE.MUNICIPALITY },
  { id: TERRITORY_SCALE.AGGLOMERATION, name: TERRITORY_SCALE.AGGLOMERATION },
  { id: TERRITORY_SCALE.COUNTY, name: TERRITORY_SCALE.COUNTY },
  { id: TERRITORY_SCALE.REGION, name: TERRITORY_SCALE.REGION },
  { id: TERRITORY_SCALE.NATIONAL, name: TERRITORY_SCALE.NATIONAL },
];

export const TERRITORY_SCALE_INSEE_VALIDATION = {
  [TERRITORY_SCALE.MUNICIPALITY]: {
    minItems: 1,
    maxItems: 1,
    inseeValueLength: [5]
  },
  [TERRITORY_SCALE.AGGLOMERATION]: {
    minItems: 2,
    maxItems: undefined,
    inseeValueLength: [5]
  },
  [TERRITORY_SCALE.COUNTY]: {
    minItems: 1,
    maxItems: 1,
    inseeValueLength: [2, 3],
  },
  [TERRITORY_SCALE.REGION]: {
    minItems: 1,
    maxItems: 1,
    inseeValueLength: [2],
  },
  [TERRITORY_SCALE.NATIONAL]: {
    minItems: 0,
    maxItems: 0,
    inseeValueLength: [0],
  }
};

/** FUNDERS */
export enum FUNDER_TYPE {
  COLLECTIVITY = 'Collectivité',
  ENTERPRISE = 'Entreprise',
  NATIONAL = 'Administration nationale'
};

export const FUNDER_TYPE_CHOICE = [
  { id: FUNDER_TYPE.NATIONAL, name: FUNDER_TYPE.NATIONAL },
  { id: FUNDER_TYPE.COLLECTIVITY, name: FUNDER_TYPE.COLLECTIVITY },
  { id: FUNDER_TYPE.ENTERPRISE, name: FUNDER_TYPE.ENTERPRISE },
];

export interface IFunders {
  id: string;
  name: string;
  type: string;
  citizensCount?: number;
  mobilityBudget?: number;
  enterpriseDetails: {
    emailDomainNames?: string[];
    hasManualAffiliation?: boolean;
  }
}


