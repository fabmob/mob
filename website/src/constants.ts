export enum Roles {
  SUPERVISORS = 'superviseurs',
  MANAGERS = 'gestionnaires',
  CITIZENS = 'citoyens',
  FUNDERS = 'financeurs',
  SUPER_MANAGERS = 'superviseurs-gestionnaires',
  CONTENT_EDITOR = 'content_editor',
}

export enum FunderType {
  ENTERPRISES = 'entreprises',
  COLLECTIVITIES = 'collectivités',
  NATIONAL = 'administrations_nationales',
}

export const PROOF_CHOICE = {
  identite: "Pièce d'Identité",
  justificatifDomicile: 'Justificatif de domicile de moins de 3 mois',
  certificatMedical: 'Certificat médical',
  rib: 'RIB',
  attestationHonneur: "Attestation sur l'Honneur",
  factureAchat: "Facture d'achat",
  certificatImmatriculation: "Certificat d'immatriculation",
  justificatifEmancipation: "Justificatif d'émancipation",
  impositionRevenu: "Dernier avis d'imposition sur le revenu",
  situationPoleEmploi: 'Dernier relevé de situation Pôle Emploi',
  certificatScolarite: 'Certificat de Scolarité',
};

export enum AffiliationStatus {
  TO_AFFILIATE = 'A_AFFILIER',
  AFFILIATED = 'AFFILIE',
  DISAFFILIATED = 'DESAFFILIE',
  UNKNOWN = 'UNKNOWN',
}

export enum UserType {
  CITIZEN = 'citizen',
  FUNDER = 'funder',
}

/**
 *
 * Regex firstName and lastName control characters
 */
export const regexSchema = new RegExp(/^[a-zÀ-ÿ-'. ]*$/, 'gi');

/**
 *
 * Regex amount control characters
 */
export const regexAmount = new RegExp(/^([1-9]\d*|0)(\.\d+)?$/, 'g');

/**
 *
 * FranceConnect URL
 */
export enum UrlFc {
  URL_FC_PROD = 'https://app.franceconnect.gouv.fr',
  URL_FC_DEV = 'https://fcp.integ01.dev-franceconnect.fr',
}

export const URL_LOGOUT_FC = '/api/v1/logout';

/**
 *
 * Videos & Images CDN IDFM
 */

export enum IdfmVideos {
  AT_PROD = 'https://static.moncomptemobilite.fr/assets/film-tuto-idfm.mp4',
  AT_PREPROD = 'https://static.preprod.moncomptemobilite.fr/assets/film-tuto-idfm.mp4',
  AT_PREVIEW = 'https://static.preview.moncomptemobilite.fr/assets/film-tuto-idfm.mp4',
}

export enum IdfmImages {
  AT_PROD = 'https://static.moncomptemobilite.fr/assets/poster-tuto-idfm.png',
  AT_PREPROD = 'https://static.preprod.moncomptemobilite.fr/assets/poster-tuto-idfm.png',
  AT_PREVIEW = 'https://static.preview.moncomptemobilite.fr/assets/poster-tuto-idfm.png',
}

/**
 *
 * Videos & Images CDN CMM
 */

export enum CmmImages {
  AT_PROD = 'https://static.moncomptemobilite.fr/assets/poster-tuto-cmm.png',
  AT_PREPROD = 'https://static.preprod.moncomptemobilite.fr/assets/poster-tuto-cmm.png',
  AT_PREVIEW = 'https://static.preview.moncomptemobilite.fr/assets/poster-tuto-cmm.png',
}

export enum CmmVideos {
  AT_PROD = 'https://static.moncomptemobilite.fr/assets/film-tuto-cmm.mp4',
  AT_PREPROD = 'https://static.preprod.moncomptemobilite.fr/assets/film-tuto-cmm.mp4',
  AT_PREVIEW = 'https://static.preview.moncomptemobilite.fr/assets/film-tuto-cmm.mp4',
}

/**
 *
 * Videos & Images CDN Home Page
 */

export enum HomeVideos {
  AT_PROD = 'https://static.moncomptemobilite.fr/assets/film-home-mob.mp4',
  AT_PREPROD = 'https://static.preprod.moncomptemobilite.fr/assets/film-home-mob.mp4',
  AT_PREVIEW = 'https://static.preview.moncomptemobilite.fr/assets/film-home-mob.mp4',
}

export enum HomeImages {
  AT_PROD = ' https://static.moncomptemobilite.fr/assets/poster-home-mob.png',
  AT_PREPROD = 'https://static.preprod.moncomptemobilite.fr/assets/poster-home-mob.png',
  AT_PREVIEW = 'https://static.preview.moncomptemobilite.fr/assets/poster-home-mob.png',
}

/**
 * Certification Source
 */
export enum CertificationSource {
  FC = 'franceconnect.gouv.fr',
  MOB = 'moncomptemobilite.fr',
}
