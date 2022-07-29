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
