import {Citizen, EligibilityCheck, Incentive} from '../models';
import {AFFILIATION_STATUS, CITIZEN_STATUS, SUBSCRIPTION_CHECK_MODE} from '../utils';

export const createIncentive = (updatedFields: Partial<Incentive>): Incentive => {
  return new Incentive({...baseIncentive, ...updatedFields});
};

const baseIncentive = {
  territoryIds: ['test'],
  additionalInfos: 'test',
  funderName: 'Mairie',
  allocatedAmount: '200 €',
  description: 'test',
  title: 'Aide pour acheter vélo électrique',
  incentiveType: 'AideTerritoire',
  createdAt: new Date('2021-04-06T09:01:30.747Z'),
  transportList: ['velo'],
  validityDate: '2022-04-06T09:01:30.778Z',
  minAmount: 'A partir de 100 €',
  contact: 'Mr le Maire',
  validityDuration: '1 an',
  paymentMethod: 'En une seule fois',
  attachments: ['RIB'],
  id: '606c236a624cec2becdef276',
  conditions: 'Vivre à TOulouse',
  updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  isMCMStaff: true,
  subscriptionCheckMode: SUBSCRIPTION_CHECK_MODE.MANUAL,
  eligibilityChecks: [
    new EligibilityCheck({
      id: 'uuid-fc',
      value: [],
      active: true,
    }),
    new EligibilityCheck({
      id: 'uuid-exclusion',
      value: ['test'],
      active: true,
    }),
  ],
};

export const createCitizen = (updatedFields: Partial<Citizen> = {}): Citizen => {
  return new Citizen({...baseCitizen, ...updatedFields});
};

const baseCitizen = Object.assign(new Citizen(), {
  id: 'randomInputId',
  identity: {
    gender: {
      value: 1,
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    },
    firstName: {
      value: 'firstName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    },
    lastName: {
      value: 'lastName',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    },
    birthDate: {
      value: '1991-11-17',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date('2022-10-24'),
    },
  },
  lastName: 'lastName',
  firstName: 'firstName',
  personalInformation: {
    email: {
      value: 'email@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    },
  },
  city: 'test',
  status: CITIZEN_STATUS.EMPLOYEE,
  postcode: '31000',
  tos1: true,
  tos2: true,
  affiliation: {
    id: 'affId',
    citizenId: 'randomCitizenId',
    enterpriseId: 'randomInputIdEntreprise',
    enterpriseEmail: '',
    status: AFFILIATION_STATUS.TO_AFFILIATE,
  },
});
