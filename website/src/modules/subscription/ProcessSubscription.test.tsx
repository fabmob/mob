import React from 'react';
import {
  act,
  screen,
  cleanup,
  render,
  fireEvent,
} from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import * as aideService from '@api/AideService';
import * as demandeService from '@api/DemandeService';
import { mockUseKeycloak } from '@utils/mockKeycloak';
import ProcessSubscription from './ProcessSubscription';
import { UserContext } from '../../context';


const incentiveResultMock = {
  id: '6217e822e5dbfc46b0876ff0',
  title: 'Aide avec spécifique filed',
  description: 'proposition de valeur',
  territoryName: 'mulhouse',
  funderName: 'simulation-maas',
  incentiveType: 'AideTerritoire',
  conditions: 'Citoyen',
  paymentMethod: 'modalité de versement',
  allocatedAmount: 'le Montant',
  minAmount: "le montant minimum de l'aide",
  transportList: ['voiture', 'autopartage'],
  attachments: ['justificatifDomicile', 'identite', 'certificatScolarite'],
  additionalInfos:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  contact: 'le contact',
  validityDuration: 'la durée de validité',
  validityDate: '2026-10-28T00:00:00.000Z',
  isMCMStaff: true,
  specificFields: [
    {
      title: 'Champ text',
      inputFormat: 'Texte',
    },
    {
      title: 'champ date',
      inputFormat: 'Date',
    },
    {
      title: 'Champ numerique',
      inputFormat: 'Numerique',
    },
  ],
  createdAt: '2022-02-24T20:18:42.427Z',
  updatedAt: '2022-03-01T07:54:38.852Z',
  funderId: '1b53f61b-5148-42bd-add1-08607bd6a0e3',
  links: [
    {
      href: 'http://localhost:8000/subscriptions/new?incentiveId=6217e822e5dbfc46b0876ff0',
      rel: 'subscribe',
      method: 'GET',
    },
  ],
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

const mockMetadataResult = {
  incentiveId: '6217e822e5dbfc46b0876ff0',
  citizenId: '3933a43b-deae-4599-9086-784162b2be4e',
  attachmentMetadata: [
    {
      fileName: '03-03-2021_Forfait_Navigo_Mois_Samy_Toto.pdf',
    },
  ],
};

jest.mock('../../components/Image/Image.tsx');
jest.mock('@react-keycloak/web', () => {
  return {
    useKeycloak: () => mockUseKeycloak,
  };
});

afterEach(cleanup);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

describe('<ProcessSubscription />', () => {
  const query = {
    incentiveId: '6217e822e5dbfc46b0876ff0',
    metadataId: 'b1dd02eb-151d-46b3-906d-c5262104763c',
  };

  const renderComponent = () => {
    return render(
      <UserContext.Provider value={{ citizen: userMock, authenticated: true }}>
        <QueryClientProvider client={queryClient}>
          <ProcessSubscription query={query} />
        </QueryClientProvider>
      </UserContext.Provider>
    );
  };

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((queryM) => ({
        matches: false,
        media: queryM,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('Should create subscription', async () => {
    jest.spyOn(aideService, 'getAide').mockReturnValue(incentiveResultMock);
    jest.spyOn(demandeService, 'postV1Subscription').mockReturnValue(null);
    jest
      .spyOn(demandeService, 'getMetadata')
      .mockReturnValue(mockMetadataResult);

    renderComponent();
    await waitFor(() => {
      const textInput = screen.getByLabelText(
        /Champ text */i
      ) as HTMLInputElement;
      const dateInput = screen.getByLabelText(
        /champ date */i
      ) as HTMLInputElement;

      const numInput = screen.getByLabelText(
        /Champ numerique */i
      ) as HTMLInputElement;

      fireEvent.input(textInput, {

        target: { value: 'text' },
      });
      expect(textInput.value).toBe('text');

      fireEvent.input(dateInput, {
        target: { value: '07/03/2022' },
      });
      expect(dateInput.value).toBe('07/03/2022');

      fireEvent.input(numInput, {
        target: { value: '1' },
      });
      expect(numInput.value).toBe('1');

      act(() => {
        fireEvent.click(
          screen.getByTestId('checkbox-test').querySelector('#consent')!
        );
      });

      expect(screen.getByText('Suivant')).toBeInTheDocument();
      act(() => {
        fireEvent.click(screen.getByText('Suivant'));
      });
    });
  });
});
