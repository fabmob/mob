import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import selectEvent from 'react-select-event';
import axios from 'axios';
import { QueryClient, QueryClientProvider } from 'react-query';

import { mockUseKeycloak, mockUseKeycloakYoungUser } from '@utils/mockKeycloak';
import { useSession } from '../../../context';

import SignUpForm from '.';
import Strings from './locale/fr.json';

jest.mock('../../../context', () => {
  return {
    useSession: jest.fn(),
  };
});

jest.unmock('axios');
jest.mock('@utils/matomo', () => {
  return {
    matomoTrackEvent: () => jest.fn(),
  };
});
const setInscription = () => jest.fn();

jest.mock('use-query-params', () => {
  return {
    useQueryParam: () => {
      return ['', setInscription()];
    },
  };
});
afterEach(cleanup);

const userMock = {
  gender: 'male',
  firstName: 'Roger',
  lastName: 'Dupond',
  wrongFormatBirthdate: '2000-12-12',
  ageRequiredBirthdate: '10/11/2020',
  correctBirthdate: '17/11/2000',
  emptyBirthdate: '',
  email: 'nico@nico.fr',
  mdp: 'Nicolas32!',
  confirmMdp: 'Nicolas32!',
  city: 'Mulhouse',
  postcode: '68100',
  status: 'Étudiant',
  enterpriseId: '',
  companyNotFound: true,
  enterpriseEmail: '',
  hasNoEnterpriseEmail: true,
};

const entrepriseMock = [
  { id: '1', name: 'Total', emailFormat: ['@total.com'] },
  { id: '2', name: 'Capgemini', emailFormat: ['@capgemini.com'] },
  { id: '3', name: 'Zorro', emailFormat: ['@zorro.com'] },
  { id: '4', name: 'zorro', emailFormat: ['@zorro.com'] },
];

const dataError = {
  statusCode: 400,
  error: {
    message: 'ValidationError',
    data: {
      errors: {
        tosOne: {
          id: 'citoyens.error.tosOne.required',
          message: 'tosOne, cette information est requise',
          code: 20001,
        },
      },
    },
  },
};

const mockError422 = {
  data: {
    error: {
      details: "L'id utilisateur existe déjà",
    },
  },
  status: 422,
};

jest.mock('axios', () => {
  const mAxiosInstance = {
    post: jest
      .fn()
      .mockReturnValueOnce(
        //test 5
        Promise.resolve({
          data: userMock,
        })
      )
      .mockReturnValueOnce(
        //test 6
        Promise.resolve({ data: dataError })
      )
      .mockImplementationOnce(
        //test 7
        () => Promise.reject(mockError422)
      ),
    get: jest.fn().mockReturnValueOnce(
      //test 1
      Promise.resolve({
        data: entrepriseMock,
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

describe('<SignUpForm />', () => {
  const onSubmitCallback = jest.fn();

  test('Submit form with empty birthdate', async () => {
    useSession.mockImplementation(() => mockUseKeycloak);
    render(
      <QueryClientProvider client={queryClient}>
        <SignUpForm handleSwitchMode={onSubmitCallback} />
      </QueryClientProvider>
    );

    await fireEvent.click(screen.getByText('Envoyer'));
    await waitFor(() => {
      expect(
        screen.getAllByText(Strings['citizens.error.required'])[3]
      ).toBeTruthy();
      expect(axios.create).toHaveBeenCalledTimes(1);
      expect(onSubmitCallback).not.toHaveBeenCalled();
    });
  });

  test('Submit form well filled', async () => {
    useSession.mockImplementation(() => mockUseKeycloakYoungUser);

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <SignUpForm handleSwitchMode={onSubmitCallback} />
      </QueryClientProvider>
    );

    await fireEvent.change(screen.getByLabelText('Nom *'), {
      target: { value: userMock.lastName },
    });
    await fireEvent.change(screen.getByLabelText('Prénom *'), {
      target: { value: userMock.firstName },
    });
    await fireEvent.change(screen.getByLabelText('Email *'), {
      target: { value: userMock.email },
    });
    await fireEvent.change(screen.getByLabelText('Mot de passe *'), {
      target: { value: 'Azerty123!' },
    });
    await fireEvent.change(screen.getByLabelText('Confirmation du mot de passe *'), {
      target: { value: 'Azerty123!' },
    });

    await fireEvent.change(container.querySelector('input[type="date"]')!, {
      target: { value: '1993-06-05' },
    });
    await fireEvent.change(screen.getByLabelText('Ville *'), {
      target: { value: userMock.city },
    });
    await fireEvent.change(screen.getByLabelText('Code postal *'), {
      target: { value: userMock.postcode },
    });

    await selectEvent.select(
      screen.getByLabelText('Civilité *'),
      Strings['gender.male']
    );

    await selectEvent.select(
      screen.getByLabelText('Quel est votre statut ? *'),
      userMock.status
    );

    await fireEvent.click(screen.getByTestId('companyNotFound'));
    await fireEvent.click(
      screen.getByLabelText(`Je n'ai pas d'email professionnel`)
    );
    await fireEvent.click(screen.getByTestId('tos1'));

    await fireEvent.click(screen.getByTestId('tos2'));
    await fireEvent.click(screen.getByText('Envoyer'));
    await waitFor(() => {
      expect(axios.create).toHaveBeenCalledTimes(1);
      expect(container.querySelector('input[type="date"]')!).toHaveDisplayValue('1993-06-05')
      expect(onSubmitCallback).toHaveBeenCalledTimes(1);
    });
  });
});
