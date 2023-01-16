import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import selectEvent from 'react-select-event';
import { QueryClient, QueryClientProvider } from 'react-query';

import {
  INCENTIVE_TYPE,
  PAYMENT_VALUE,
  REASON_REJECT_VALUE,
  STATUS,
} from '@utils/demandes';
import { mockUseKeycloak } from '@utils/mockKeycloak';

import MyRequestsTab from './MyRequestsTab';

const noSubscriptionsToProcessMessage = `Vous n'avez aucune demande en cours de traitement. Pour réaliser une nouvelle demande, rendez-vous sur votre catalogue des aides`;
const noSubscriptionsProcessedMessage = `Vous n'avez pas de demande validée ou rejetée pour le moment`;

const mockSubscriptionsToProcess = [
  {
    id: '1',
    incentiveId: '1',
    incentiveTitle: 'aide 1',
    incentiveTransportList: ['velo'],
    citizenId: '1',
    lastName: 'lastName 1',
    firstName: 'firstName 1',
    email: 'user@example.com',
    consent: true,
    status: STATUS.TO_PROCESS,
    attachments: [
      {
        originalName: 'mob.PNG',
        uploadDate: new Date('2022-03-14T16:11:45.370+00:00'),
        proofType: 'CI',
        mimeType: 'image/png',
      },
    ],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Mulhouse',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
  },
  {
    id: '10',
    incentiveId: '10',
    incentiveTitle: 'aide 10',
    incentiveTransportList: ['voiture'],
    citizenId: '10',
    lastName: 'lastName 10',
    firstName: 'firstName 10',
    email: 'user10@example.com',
    consent: true,
    status: STATUS.TO_PROCESS,
    attachments: [
      {
        originalName: 'mob.PNG',
        uploadDate: new Date('2022-03-14T16:11:45.370+00:00'),
        proofType: 'CI',
        mimeType: 'image/png',
      },
    ],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Capgemini',
    incentiveType: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
  },
  {
    id: '11',
    incentiveId: '11',
    incentiveTitle: 'aide 11',
    incentiveTransportList: ['voiture'],
    citizenId: '11',
    lastName: 'lastName 11',
    firstName: 'firstName 11',
    email: 'user11@example.com',
    consent: true,
    status: STATUS.TO_PROCESS,
    attachments: [
      {
        originalName: 'mob.PNG',
        uploadDate: new Date('2022-03-14T16:11:45.370+00:00'),
        proofType: 'CI',
        mimeType: 'image/png',
      },
    ],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Mulhouse',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
  },
];
const mockSubscriptionsProcessed = [
  {
    id: '2',
    incentiveId: '2',
    incentiveTitle: 'aide 2',
    incentiveTransportList: ['voiture'],
    citizenId: '2',
    lastName: 'lastName 2',
    firstName: 'firstName 2',
    email: 'user2@example.com',
    consent: true,
    status: STATUS.REJECTED,
    attachments: [
      {
        originalName: 'mob.PNG',
        uploadDate: new Date('2022-03-14T16:11:45.370+00:00'),
        proofType: 'CI',
        mimeType: 'image/png',
      },
    ],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Mulhouse',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    subscriptionRejection: {
      type: REASON_REJECT_VALUE.MISSING_PROOF,
      comments: 'Il manque un justif',
    },
  },
  {
    id: '3',
    incentiveId: '3',
    incentiveTitle: 'aide 3',
    incentiveTransportList: ['velo'],
    citizenId: '3',
    lastName: 'lastName 3',
    firstName: 'firstName 3',
    email: 'user3@example.com',
    consent: true,
    status: STATUS.VALIDATED,
    attachments: [
      {
        originalName: 'mob.PNG',
        uploadDate: new Date('2022-03-14T16:11:45.370+00:00'),
        proofType: 'CI',
        mimeType: 'image/png',
      },
    ],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Mulhouse',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    subscriptionValidation: {
      mode: PAYMENT_VALUE.NONE,
      comments: 'Remboursement déjà réalisé',
    },
  },
  {
    id: '4',
    incentiveId: '4',
    incentiveTitle: 'aide 4',
    incentiveTransportList: ['voiture'],
    citizenId: '4',
    lastName: 'lastName 4',
    firstName: 'firstName 4',
    email: '4@example.com',
    consent: true,
    status: STATUS.VALIDATED,
    attachments: [
      {
        originalName: 'mob.PNG',
        uploadDate: new Date('2022-03-14T16:11:45.370+00:00'),
        proofType: 'CI',
        mimeType: 'image/png',
      },
    ],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Mulhouse',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    subscriptionValidation: {
      mode: PAYMENT_VALUE.NONE,
    },
  },
  {
    id: '5',
    incentiveId: '5',
    incentiveTitle: 'aide 5',
    incentiveTransportList: ['velo'],
    citizenId: '5',
    lastName: 'lastName 5',
    firstName: 'firstName 5',
    email: 'user5@example.com',
    consent: true,
    status: STATUS.VALIDATED,
    attachments: [
      {
        originalName: 'mob.PNG',
        uploadDate: new Date('2022-03-14T16:11:45.370+00:00'),
        proofType: 'CI',
        mimeType: 'image/png',
      },
    ],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Mulhouse',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    subscriptionValidation: {
      mode: PAYMENT_VALUE.NONE,
      comments: 'Remboursement déjà réalisé',
    },
  },
  {
    id: '6',
    incentiveId: '6',
    incentiveTitle: 'aide 6',
    incentiveTransportList: ['voiture'],
    citizenId: '6',
    lastName: 'lastName 6',
    firstName: 'firstName 6',
    email: 'user6@example.com',
    consent: true,
    status: STATUS.VALIDATED,
    attachments: [
      {
        originalName: 'mob.PNG',
        uploadDate: new Date('2022-03-14T16:11:45.370+00:00'),
        proofType: 'CI',
        mimeType: 'image/png',
      },
    ],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    incentiveType: INCENTIVE_TYPE.NATIONAL_INCENTIVE,
    subscriptionValidation: {
      mode: PAYMENT_VALUE.NONE,
      comments: 'Remboursement déjà réalisé',
    },
  },
  {
    id: '7',
    incentiveId: '7',
    incentiveTitle: 'aide 7',
    incentiveTransportList: ['velo'],
    citizenId: '7',
    lastName: 'lastName 7',
    firstName: 'firstName 7',
    email: 'user7@example.com',
    consent: true,
    status: STATUS.REJECTED,
    attachments: [
      {
        originalName: 'mob.PNG',
        uploadDate: new Date('2022-03-14T16:11:45.370+00:00'),
        proofType: 'CI',
        mimeType: 'image/png',
      },
    ],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    incentiveType: INCENTIVE_TYPE.NATIONAL_INCENTIVE,
    subscriptionRejection: {
      type: REASON_REJECT_VALUE.MISSING_PROOF,
    },
  },
  {
    id: '8',
    incentiveId: '8',
    incentiveTitle: 'aide 8',
    incentiveTransportList: ['voiture'],
    citizenId: '8',
    lastName: 'lastName 8',
    firstName: 'firstName 8',
    email: 'user8@example.com',
    consent: true,
    status: STATUS.REJECTED,
    attachments: [
      {
        originalName: 'mob.PNG',
        uploadDate: new Date('2022-03-14T16:11:45.370+00:00'),
        proofType: 'CI',
        mimeType: 'image/png',
      },
    ],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    incentiveType: INCENTIVE_TYPE.NATIONAL_INCENTIVE,
    subscriptionRejection: {
      type: REASON_REJECT_VALUE.OTHER,
      other: 'Informations erronées',
      comments: 'Merci de renouveler votre demande',
    },
  },
  {
    id: '9',
    incentiveId: '9',
    incentiveTitle: 'aide 9',
    incentiveTransportList: ['velo'],
    citizenId: '9',
    lastName: 'lastName 9',
    firstName: 'firstName 9',
    email: 'user9@example.com',
    consent: true,
    status: STATUS.REJECTED,
    attachments: [
      {
        originalName: 'mob.PNG',
        uploadDate: new Date('2022-03-14T16:11:45.370+00:00'),
        proofType: 'CI',
        mimeType: 'image/png',
      },
    ],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Capgemini',
    incentiveType: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
    subscriptionRejection: {
      type: REASON_REJECT_VALUE.OTHER,
      other: 'Informations erronées',
    },
  },
];

const userMock = {
  firstName: 'Roger',
  lastName: 'Dupond',
  birthdate: '1991-11-17T00:00:00.000+00:00',
  email: 'roger@mail.fr',
  mdp: 'Nicolas32!',
  city: 'Paris',
  postcode: '75001',
  status: 'salarie',
  statusPhrase: 'Salarié',
  affiliation: {
    enterpriseId: '12345',
    enterpriseEmail: 'roger@capgemini.com',
    status: 'A_AFFILIER',
  },
};

const context = {
  citizen: {
    firstName: 'Roger',
    lastName: 'Dupond',
    birthdate: '1991-11-17T00:00:00.000+00:00',
    email: 'roger@mail.fr',
    mdp: 'Nicolas32!',
    city: 'Paris',
    postcode: '75001',
    status: 'salarie',
    statusPhrase: 'Salarié',
    affiliation: {
      enterpriseId: '12345',
      enterpriseEmail: 'roger@capgemini.com',
      status: 'A_AFFILIER',
    },
  },
  authenticated: true,
};

jest.mock('@components/Image/Image.tsx');

jest.mock('../../../../../context', () => ({
  useSession: () => mockUseKeycloak,
  useUser: () => context,
}));

jest.unmock('axios');

jest.mock('axios', () => {
  const mAxiosInstance = {
    get: jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: { subscriptions: [] },
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: { subscriptions: [] },
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: { subscriptions: mockSubscriptionsToProcess },
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: { subscriptions: mockSubscriptionsProcessed },
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: { subscriptions: mockSubscriptionsToProcess },
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: { subscriptions: mockSubscriptionsProcessed },
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: { subscriptions: mockSubscriptionsToProcess },
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: { subscriptions: mockSubscriptionsProcessed },
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: { subscriptions: [] },
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: { subscriptions: [] },
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: { subscriptions: [] },
        })
      ),

    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };
  return {
    create: jest.fn(() => mAxiosInstance),
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

afterEach(cleanup);

describe('<MyRequestsTab />', () => {
  test('render MyRequestTab with no subscriptions', async () => {
    const { findByText, queryAllByText } = render(
      <QueryClientProvider client={queryClient}>
        <MyRequestsTab />
      </QueryClientProvider>
    );

    expect(await findByText('Mes demandes en cours')).toBeInTheDocument();
    expect(await findByText('Historique de mes demandes')).toBeInTheDocument();
    expect(
      await findByText(noSubscriptionsToProcessMessage)
    ).toBeInTheDocument();
    expect(
      await findByText(noSubscriptionsProcessedMessage)
    ).toBeInTheDocument();
    expect(queryAllByText('Afficher plus de résultats')).toHaveLength(0);
  });
  test('render MyRequestTab with subscriptions', async () => {
    const { findByText, queryByText, findAllByText } = render(
      <QueryClientProvider client={queryClient}>
        <MyRequestsTab />
      </QueryClientProvider>
    );

    expect(await findByText('Mes demandes en cours')).toBeInTheDocument();
    expect(await findByText('Historique de mes demandes')).toBeInTheDocument();
    expect(
      queryByText(noSubscriptionsToProcessMessage)
    ).not.toBeInTheDocument();
    expect(
      queryByText(noSubscriptionsProcessedMessage)
    ).not.toBeInTheDocument();
    expect(await findAllByText('Afficher plus de résultats')).toHaveLength(1);
  });

  test('render MyRequestTab with subscriptions and render more items', async () => {
    const {
      findByText,
      queryByText,
      findAllByText,
      queryAllByText,
      findAllByRole,
    } = render(
      <QueryClientProvider client={queryClient}>
        <MyRequestsTab />
      </QueryClientProvider>
    );

    expect(await findByText('Mes demandes en cours')).toBeInTheDocument();
    expect(await findByText('Historique de mes demandes')).toBeInTheDocument();
    expect(
      queryByText(noSubscriptionsToProcessMessage)
    ).not.toBeInTheDocument();
    expect(
      queryByText(noSubscriptionsProcessedMessage)
    ).not.toBeInTheDocument();
    expect(await findAllByText('Afficher plus de résultats')).toHaveLength(1);
    const renderMoreItemsBtn = await findAllByRole('button', {
      name: /Afficher plus de résultats/i,
    });
    fireEvent.click(renderMoreItemsBtn[0]);
    expect(queryAllByText('Afficher plus de résultats')).toHaveLength(0);
  });

  test('render MyRequestTab with subscriptions and apply filters', async () => {
    const { findByText, queryByText, findAllByText, getByText } = render(
      <QueryClientProvider client={queryClient}>
        <MyRequestsTab />
      </QueryClientProvider>
    );

    expect(await findByText('Mes demandes en cours')).toBeInTheDocument();
    expect(await findByText('Historique de mes demandes')).toBeInTheDocument();
    expect(
      queryByText(noSubscriptionsToProcessMessage)
    ).not.toBeInTheDocument();
    expect(
      queryByText(noSubscriptionsProcessedMessage)
    ).not.toBeInTheDocument();
    expect(await findAllByText('Afficher plus de résultats')).toHaveLength(1);

    await selectEvent.select(getByText('Année'), ['2020']);
    await selectEvent.select(getByText('Statut de la demande'), ['Validée']);
    await selectEvent.select(getByText('Type de financeur'), ['Entreprise']);
  });
});
