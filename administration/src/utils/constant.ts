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

export const NATIONAL_INCENTIVE = 'AideNationale';
export const TERRITORY_INCENTIVE = 'AideTerritoire';
export const EMPLOYER_INCENTIVE = 'AideEmployeur';

export const INCENTIVE_TYPE_CHOICE = [
  { id: NATIONAL_INCENTIVE, name: 'Aide nationale' },
  { id: TERRITORY_INCENTIVE, name: 'Aide de mon territoire' },
  { id: EMPLOYER_INCENTIVE, name: 'Aide de mon employeur' },
];

export const MAPPING_FUNDER_TYPE = {
  [NATIONAL_INCENTIVE]: 'nationale',
  [TERRITORY_INCENTIVE]: 'collectivité',
  [EMPLOYER_INCENTIVE]: 'entreprise',
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
