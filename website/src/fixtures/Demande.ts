import { Subscription } from '@utils/demandes';

// We need fixtures to simulate Axios Responses so we cannot request to the API every time our test runs (for the case of performance)

export const demandesWithData: Subscription = {
  incentiveId: '123456',
  incentiveTitle: 'string',
  citizenId: 'dcbdbab0-5c67-4e4e-967f-0f65403704dc',
  lastName: 'Housni',
  firstName: 'Walid',
  email: 'user@example.com',
  status: 'A_TRAITER',
  attachments: [{}],
  createdAt: '2021-08-03T14:50:32.437Z',
  updatedAt: '2021-08-03T14:51:50.016Z',
  additionalProp1: {},
};

export const emptyDemandes: Subscription = {
  incentiveId: '',
  incentiveTitle: '',
  citizenId: '',
  lastName: '',
  firstName: '',
  email: '',
  status: '',
  attachments: [{}],
  createdAt: new Date(),
  updatedAt: new Date(),
  additionalProp1: {},
};
