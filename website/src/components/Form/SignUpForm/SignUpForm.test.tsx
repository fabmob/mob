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

import SignUpForm from '.';
import Strings from './locale/fr.json';

jest.unmock('axios');

afterEach(cleanup);

const userMock = {
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

const bigMock = [
  { label: 'Nom *', value: userMock.firstName },
  { label: 'Prénom *', value: userMock.lastName },
  { label: 'Email *', value: userMock.email },
  { label: 'Mot de passe *', value: userMock.mdp },
  { label: 'Confirmation du mot de passe *', value: userMock.confirmMdp },
  { label: 'Ville *', value: userMock.city },
  { label: 'Code postal *', value: userMock.postcode },
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

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SignUpForm handleSwitchMode={onSubmitCallback} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    return renderComponent();
  });
  // fill the form
  const testForm = async (mock: any) => {
    mock.map(async (item: { label: string; value: string }) => {
      if (item.label) {
        await fireEvent.change(screen.getByLabelText(item.label), {
          target: { value: item.value },
        });
      }
    });

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
    // submit
    await fireEvent.click(screen.getByText('Envoyer'));
  };

  test('if status = salarie then there are 4 fields more', async () => {
    await selectEvent.select(
      screen.getByLabelText('Quel est votre statut ? *'),
      'Salarié'
    );

    expect(screen.getByText('Renseignez votre entreprise')).toBeInTheDocument();
    expect(
      screen.getByText(
        "Je ne trouve pas mon entreprise / Je n'ai pas d'entreprise"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('Adresse email professionnelle')
    ).toBeInTheDocument();
    expect(
      screen.getByText("Je n'ai pas d'email professionnel")
    ).toBeInTheDocument();
    expect(axios.create).toHaveBeenCalledTimes(1);
  });

  test('Submit form with wrong format of the birthdate', async () => {
    bigMock.push({
      label: 'Date de naissance *',
      value: userMock.wrongFormatBirthdate,
    });

    await testForm(bigMock);
    await waitFor(() => {
      expect(
        screen.getByText(Strings['citizens.error.birthdate.format'])
      ).toBeTruthy();
      expect(axios.create).toHaveBeenCalledTimes(1);
      expect(onSubmitCallback).not.toHaveBeenCalled();
    });
  });

  test('Submit form with empty birthdate', async () => {
    bigMock.push({
      label: 'Date de naissance *',
      value: userMock.emptyBirthdate,
    });

    await testForm(bigMock);
    await waitFor(() => {
      expect(
        screen.getByText(Strings['citizens.error.birthdate.required'])
      ).toBeTruthy();
      expect(axios.create).toHaveBeenCalledTimes(1);
      expect(onSubmitCallback).not.toHaveBeenCalled();
    });
  });

  test('Submit form with wrong age', async () => {
    bigMock.push({
      label: 'Date de naissance *',
      value: userMock.ageRequiredBirthdate,
    });

    await testForm(bigMock);

    await waitFor(() => {
      expect(
        screen.getByText(Strings['citizens.error.birthdate.age'])
      ).toBeTruthy();
      expect(axios.create).toHaveBeenCalledTimes(1);
      expect(onSubmitCallback).not.toHaveBeenCalled();
    });
  });

  test('Submit form well filled', async () => {
    bigMock.push({
      label: 'Date de naissance *',
      value: userMock.correctBirthdate,
    });

    await testForm(bigMock);
    await waitFor(() => {
      expect(axios.create).toHaveBeenCalledTimes(1);
      expect(onSubmitCallback).toHaveBeenCalledTimes(1);
    });
  });

  test('Submit form with return error', async () => {
    bigMock.push({
      label: 'Date de naissance *',
      value: userMock.correctBirthdate,
    });

    await testForm(bigMock);

    await waitFor(() => {
      expect(axios.create).toHaveBeenCalledTimes(1);
      expect(onSubmitCallback).toHaveBeenCalledTimes(1);
    });
  });

  test('Submit form with return error 422', async () => {
    bigMock.push({
      label: 'Date de naissance *',
      value: userMock.correctBirthdate,
    });

    await testForm(bigMock);
    await waitFor(() => {
      expect(axios.create).toHaveBeenCalledTimes(1);
      expect(onSubmitCallback).toHaveBeenCalledTimes(1);
    });
  });
});
