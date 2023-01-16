export interface Citizen {
  id: string;
  firstName: string;
  lastName: string;
  personalInformation: {
    email: CmsType;
  };
  birthdate: string;
  city: string;
  postcode: number;
  status: string;
  tos1: boolean;
  tos2: boolean;
  affiliation: Affiliation;
}
export interface CitizenUpdate {
  city: string;
  postcode: string;
  status: string;
  affiliation: Affiliation;
}

export interface Affiliation {
  id: string;
  citizenId: string;
  enterpriseId: string;
  enterpriseEmail: string;
  status: AFFILIATION_STATUS;
}

export enum AFFILIATION_STATUS {
  TO_AFFILIATE = 'A_AFFILIER',
  AFFILIATED = 'AFFILIE',
  DISAFFILIATED = 'DESAFFILIE',
  UNKNOWN = 'UNKNOWN',
}

// Added this for furhter use
export enum CITIZEN_STATUS {
  EMPLOYEE = 'salarie',
  STUDENT = 'etudiant',
  INDEPENDANT_LIBERAL = 'independantLiberal',
  RETIRED = 'retraite',
  UNEMPLOYED = 'sansEmploi',
}

export interface ClientOfConsent {
  clientId?: string;
  name?: string;
}

export interface Consent {
  name: string;
  clientId: string;
}

export interface CmsType {
  value: number | string;
  source?: string;
  certificationDate?: Date;
}
