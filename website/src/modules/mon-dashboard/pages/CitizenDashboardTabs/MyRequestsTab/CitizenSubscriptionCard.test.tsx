import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react';
import { mockUseKeycloak } from '@utils/mockKeycloak';

import CitizenSubscriptionCard from './CitizenSubscriptionCard';
import {
  INCENTIVE_TYPE,
  PAYMENT_VALUE,
  REASON_REJECT_VALUE,
  STATUS,
} from 'src/utils/demandes';
import { UserContext } from '../../../../../context';
import { AFFILIATION_STATUS } from 'src/utils/citoyens';

const mockSubscriptionToProcess = {
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
};
const mockValidatedSubscription = {
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
  updatedAt: '2021-05-06',
  funderName: 'Mulhouse',
  incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
  subscriptionValidation: {
    mode: PAYMENT_VALUE.NONE,
    comments: 'Remboursement déjà réalisé',
  },
};

const mockError404 = {
  data: {
    error: {
      details: 'Incentive not found',
    },
  },
  status: 422,
};

const mockRejectedSubscription = {
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
  updatedAt: '2021-08-07',
  funderName: 'Capgemini',
  funderId: 'enterpriseId',
  incentiveType: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
  subscriptionRejection: {
    type: REASON_REJECT_VALUE.OTHER,
    other: 'Informations erronées',
  },
};

const mockValidatedSubscriptionMultiplePayment = {
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
    mode: PAYMENT_VALUE.MULTIPLE,
    amount: 4,
    lastPayment: '2022-10-06',
    frequency: 'mensuelle',
    comments: 'Remboursement déjà réalisé',
  },
};

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
    affiliationStatus: 'A_AFFILIER',
  },
};

jest.mock('@components/Image/Image.tsx');
jest.mock('@react-keycloak/web', () => {
  return {
    useKeycloak: () => mockUseKeycloak,
  };
});

const windowOpen = jest.spyOn(window, 'open');
windowOpen.mockImplementation(() => null);
jest.unmock('axios');

jest.mock('axios', () => {
  const mAxiosInstance = {
    get: jest
      .fn()
      .mockResolvedValueOnce(Promise.resolve({ data: {} }))
      .mockResolvedValueOnce(Promise.resolve({ data: {} }))
      .mockImplementationOnce(() => Promise.reject(mockError404)),

    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };
  return {
    create: jest.fn(() => mAxiosInstance),
  };
});

afterEach(cleanup);

describe('<CitizenSubscriptionCard />', () => {
  test('renders Subscription To Process', async () => {
    const { getByText } = render(
      <UserContext.Provider value={{ citizen: userMock, authenticated: true }}>
        <CitizenSubscriptionCard subscription={mockSubscriptionToProcess} />
      </UserContext.Provider>
    );

    expect(getByText('aide 10')).toBeInTheDocument();
    expect(getByText('Financeur : Capgemini')).toBeInTheDocument();
    expect(getByText('A traiter par le gestionnaire')).toBeInTheDocument();
    expect(getByText('Demandée le 02/02/2021')).toBeInTheDocument();
  });
  test('renders Subscription Validated', async () => {
    const { getByText, findAllByRole, findAllByText, findByText } = render(
      <UserContext.Provider value={{ citizen: userMock, authenticated: true }}>
        <CitizenSubscriptionCard subscription={mockValidatedSubscription} />
      </UserContext.Provider>
    );

    expect(getByText('aide 6')).toBeInTheDocument();
    expect(getByText('Financeur : Mulhouse')).toBeInTheDocument();
    expect(getByText('Validée')).toBeInTheDocument();
    expect(getByText('Le 06/05/2021')).toBeInTheDocument();
    const renewBtn = await findAllByRole('button', {
      name: 'Renouveler la demande',
    });
    const showCommentBtn = await findAllByText('Commentaires');
    fireEvent.click(showCommentBtn[0]);
    expect(await findByText('Remboursement déjà réalisé')).toBeInTheDocument();
    expect(renewBtn).toHaveLength(1);
    act(() => {
      fireEvent.click(renewBtn[0]);
    });
    await waitFor(() => {
      expect(windowOpen).toHaveBeenCalled();
    });
  });

  test('renders Subscription Rejected and show error toast not allowed', async () => {
    const { getByText, findAllByRole } = render(
      <UserContext.Provider value={{ citizen: userMock, authenticated: true }}>
        <CitizenSubscriptionCard subscription={mockRejectedSubscription} />
      </UserContext.Provider>
    );

    expect(getByText('aide 9')).toBeInTheDocument();
    expect(getByText('Financeur : Capgemini')).toBeInTheDocument();
    expect(getByText('Rejetée')).toBeInTheDocument();
    expect(getByText('Le 07/08/2021')).toBeInTheDocument();
    expect(getByText('Autre - Informations erronées')).toBeInTheDocument();
    const renewBtn = await findAllByRole('button', {
      name: 'Renouveler la demande',
    });
    expect(renewBtn).toHaveLength(1);
    fireEvent.click(renewBtn[0]);
    expect(windowOpen).toHaveBeenCalledTimes(1);
  });

  test('renders Subscription Validated with multiple payment', async () => {
    const { getByText, findAllByRole } = render(
      <UserContext.Provider value={{ citizen: userMock, authenticated: true }}>
        <CitizenSubscriptionCard
          subscription={mockValidatedSubscriptionMultiplePayment}
        />
      </UserContext.Provider>
    );

    expect(getByText('aide 5')).toBeInTheDocument();
    expect(getByText('Financeur : Mulhouse')).toBeInTheDocument();
    expect(getByText('Validée')).toBeInTheDocument();
    expect(getByText('Le 02/02/2021')).toBeInTheDocument();
    expect(getByText(`4€/mois jusqu'au 06/10/2022`)).toBeInTheDocument();
    const renewBtn = await findAllByRole('button', {
      name: 'Renouveler la demande',
    });
    expect(renewBtn).toHaveLength(1);
    act(() => {
      fireEvent.click(renewBtn[0]);
    });
    await waitFor(() => {
      expect(windowOpen).toHaveBeenCalledTimes(2);
    });
  });
  test('renders Subscription Rejected and show error toast incentive not found', async () => {
    const { getByText, findAllByRole } = render(
      <UserContext.Provider value={{ citizen: userMock, authenticated: true }}>
        <CitizenSubscriptionCard subscription={mockRejectedSubscription} />
      </UserContext.Provider>
    );

    expect(getByText('aide 9')).toBeInTheDocument();
    expect(getByText('Financeur : Capgemini')).toBeInTheDocument();
    expect(getByText('Rejetée')).toBeInTheDocument();
    expect(getByText('Le 07/08/2021')).toBeInTheDocument();
    expect(getByText('Autre - Informations erronées')).toBeInTheDocument();
    const renewBtn = await findAllByRole('button', {
      name: 'Renouveler la demande',
    });
    expect(renewBtn).toHaveLength(1);
    fireEvent.click(renewBtn[0]);
    expect(windowOpen).toHaveBeenCalledTimes(2);
  });
});
