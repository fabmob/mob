export interface SpecificFields {
  title: string;
  inputFormat: string;
  choiceList?: object;
}
export interface Incentive {
  id: string;
  title: string;
  description: string;
  territoryName: string;
  funderName: string;
  incentiveType: 'AideNationale' | 'AideTerritoire' | 'AideEmployeur';
  conditions: string;
  paymentMethod: string;
  allocatedAmount: string;
  minAmount: string;
  additionalInfos: string;
  contact: string;
  validityDuration: string;
  validityDate: string;
  transportList: string[];
  createdAt: string;
  updatedAt: string;
  subscriptionLink: string;
  specificFields: SpecificFields[];
  funderId: string;
  attachments?: string[];
}

interface TransportMapping {
  transportsCommun: string;
  velo: string;
  voiture: string;
  libreService: string;
  electrique: string;
  autopartage: string;
  covoiturage: string;
}

export const transportMapping: TransportMapping = {
  transportsCommun: 'Transports en commun',
  velo: 'Vélo',
  voiture: 'Voiture',
  libreService: '2 ou 3 roues en libre-service',
  electrique: '2 ou 3 roues électrique',
  autopartage: 'Autopartage',
  covoiturage: 'Covoiturage',
};

export const aidesMapping = {
  AideNationale: 'Aide nationale',
  AideTerritoire: 'Aide de mon territoire',
  AideEmployeur: 'Aide de mon employeur',
};
