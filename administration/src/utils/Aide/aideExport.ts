/* eslint-disable */
export interface Incentive {
  id: string;
  title: string;
  description: string;
  territoryName: string;
  territoryIds:string[];
  incentiveType: string;
  funderName: string;
  conditions: string;
  paymentMethod: string;
  allocatedAmount: string;
  minAmount: string;
  additionalInfos: string;
  contact: string;
  validityDuration: string;
  validityDate: Date;
  isMCMStaff: boolean;
  transportList: string[];
  createdAt: Date;
  updatedAt: Date;
  subscriptionLink: string;
  name: string;
  attachments?: string[];
}

export interface IncentiveExport {
  Nom_Aide: string;
  Proposition_de_valeur: string;
  Nom_du_territoire: string;
  Type_de_financeur: string;
  Nom_du_financeur: string;
  Condition_obtention: string;
  Modalite_de_versement: string;
  Montant: string;
  Montant_minimum: string;
  Bon_a_savoir: string;
  Contact: string;
  Duree_de_validite: string;
  Date_de_fin_de_validite: Date;
  Souscription_via_mcm: boolean;
  Mode_de_transport: string[];
  Date_de_creation: Date;
  Date_de_modification: Date;
  Lien_Souscription: string;
  Justificatif?: string[];
}
