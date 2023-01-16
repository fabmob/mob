import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { format } from 'date-fns';
import selectEvent from 'react-select-event';
import { QueryClient, QueryClientProvider } from 'react-query';

import * as citizenService from '@api/CitizenService';
import * as enterpriseService from '@api/EntrepriseService';
import * as userFunderService from '@api/UserFunderService';
import { deleteConsent } from '@api/CitizenService';

import { mockUseKeycloak } from '@utils/mockKeycloak';

import Profile from './Profile';

import { useUser } from '../../context';
import Strings from './locale/fr.json';

const userMock = {
  identity: {
    gender: {
      value: 1,
    },
    firstName: {
      value: 'Roger',
    },
    lastName: {
      value: 'Dupond',
    },
    birthDate: {
      value: '1991-11-17',
    },
  },
  birthdate: '1991-11-17',
  personalInformation: {
    email: {
      value: 'kennyg@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    },
  },
  mdp: 'Nicolas32!',
  city: 'Paris',
  postcode: '75001',
  status: 'salarie',
  statusPhrase: 'Salarié',
  consents: [
    {
      clientId: 'simulation-maas-client',
      name: 'simulation maas client',
    },
    {
      clientId: 'mulhouse-maas-client',
      name: 'mulhouse maas client',
    },
  ],
  affiliation: {
    enterpriseId: '12345',
    enterpriseEmail: 'roger@capgemini.com',
    status: 'A_AFFILIER',
  },
};

const userMockAffiliation = {
  identity: {
    gender: {
      value: 1,
    },
    firstName: {
      value: 'Roger',
    },
    lastName: {
      value: 'Dupond',
    },
    birthDate: {
      value: '1991-11-17',
    },
  },
  personalInformation: {
    email: {
      value: 'kennyg@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    },
  },
  mdp: 'Nicolas32!',
  city: 'Paris',
  postcode: '75001',
  status: 'salarie',
  statusPhrase: 'Salarié',
  consents: [
    {
      clientId: 'simulation-maas-client',
      name: 'simulation maas client',
    },
    {
      clientId: 'mulhouse-maas-client',
      name: 'mulhouse maas client',
    },
  ],
  affiliation: {
    enterpriseId: '12345',
    enterpriseEmail: 'roger@capgemini.com',
    status: 'AFFILIE',
  },
};

const userMockNoAffiliation = {
  identity: {
    gender: {
      value: 1,
    },
    firstName: {
      value: 'Roger',
    },
    lastName: {
      value: 'Dupond',
    },
    birthDate: {
      value: '1991-11-17',
    },
  },
  personalInformation: {
    email: {
      value: 'kennyg@gmail.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    },
  },
  mdp: 'Nicolas32!',
  city: 'Paris',
  postcode: '75001',
  status: 'salarie',
  statusPhrase: 'Salarié',
  consents: [
    {
      name: 'simulation maas client',
      clientId: 'simulation-maas-client',
    },
    {
      name: 'mulhouse maas client',
      clientId: 'mulhouse-maas-client',
    },
  ],
  affiliation: {
    enterpriseId: null,
    enterpriseEmail: null,
    status: 'UNKNOWN',
  },
};

const mockUserFunder = {
  email: 'superviseur-gestionnaire-ab.sm@yopmail.com',
  firstName: 'Gérard',
  lastName: 'Mansoif-SG-AB',
  id: 'f9986481-1af3-4925-8908-cf9da0cebcfb',
  funderId: '3cfe96f2-fc39-4351-a540-3fdff6d9adb7',
  communityIds: ['622f692f610f2d86cc05c38e', '622f692f610f2d86cc05c38f'],
  roles: ['superviseurs', 'gestionnaires'],
};

const mockUserFunderCommunities = [
  {
    id: '622f692f610f2d86cc05c38e',
    name: 'SM-Communauté A',
    funderId: '3cfe96f2-fc39-4351-a540-3fdff6d9adb7',
  },
  {
    id: '622f692f610f2d86cc05c38f',
    name: 'SM-Communauté B',
    funderId: '3cfe96f2-fc39-4351-a540-3fdff6d9adb7',
  },
];

const enterpriseListMock = [
  {
    id: '12345',
    name: 'Capgemini',
    emailFormat: ['@capgemini.com'],
  },
  {
    id: '54321',
    name: 'Atos',
    emailFormat: ['@atos.com'],
  },
  {
    id: '67890',
    name: 'Total',
    emailFormat: ['@total.com'],
  },
  {
    id: '12345',
    name: 'Capgemini',
    emailFormat: ['@capgemini.com'],
  },
];

const mockServerError = {
  data: {
    error: {
      message: 'Server Error',
      details: 'Server Error',
    },
  },
  status: 500,
};

const mockError422 = {
  error: {
    message: '422 Error',
    details: '422 Error',
    path: '/mockError',
  },
};

const citizenContext = {
  citizen: userMock,
  refetchCitizen: () => {},
};
const citizenNoAffilliationContext = {
  citizen: userMockNoAffiliation,
  refetchCitizen: () => {},
};

const citizenAffilliationContext = {
  citizen: userMockAffiliation,
  refetchCitizen: () => {},
};

const userFunderContext = {
  userFunder: mockUserFunder,
};

jest.mock('../Image/Image.tsx');

jest.mock('@utils/matomo', () => {
  return {
    matomoPageTracker: () => jest.fn(),
    matomoTrackEvent: () => jest.fn(),
  };
});

jest.mock('../../context', () => ({
  useSession: () => mockUseKeycloak,
  useUser: jest.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('<Profile />', () => {
  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Profile />
      </QueryClientProvider>
    );
  };

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  test('It should render User Funder Profile', async () => {
    useUser.mockImplementation(() => userFunderContext);

    jest
      .spyOn(userFunderService, 'getUserFunderCommunities')
      .mockReturnValue(mockUserFunderCommunities);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Mon identité')).toBeInTheDocument();
      expect(screen.queryByText('Mon adresse')).not.toBeInTheDocument();
      expect(screen.getByText('Mes droits de gestion')).toBeInTheDocument();
      expect(screen.getByText(mockUserFunder.lastName)).toBeInTheDocument();
      expect(screen.getByText(mockUserFunder.firstName)).toBeInTheDocument();
      expect(screen.getByText(mockUserFunder.email)).toBeInTheDocument();
      expect(screen.getByText('Collectivité')).toBeInTheDocument();
      expect(screen.getByText('Rôle')).toBeInTheDocument();
      expect(screen.getByText('Communautés de gestion')).toBeInTheDocument();
      expect(screen.getByText('Superviseur, Gestionnaire')).toBeInTheDocument();
      expect(
        screen.getByText('SM-Communauté A, SM-Communauté B')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'En tant que superviseur, je peux suivre le statut des demandes et gérer mes citoyens. En tant que gestionnaire, je peux consulter et traiter les demandes sur le périmètre de gestion qui m’est attribué.'
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          'Pour modifier vos droits de gestion, veuillez vous rapprocher de votre administrateur.'
        )
      ).toBeInTheDocument();
    });
  });

  test('It should keep Profile in edit mode and not save updated user informations on request error', async () => {
    useUser.mockImplementation(() => citizenContext);

    jest
      .spyOn(citizenService, 'getConsentsById')
      .mockReturnValue(userMock.consents);
    jest.spyOn(citizenService, 'getCitizenById').mockReturnValue(userMock);
    jest
      .spyOn(enterpriseService, 'getEntreprisesList')
      .mockReturnValue(enterpriseListMock);
    jest
      .spyOn(citizenService, 'updateCitizenById')
      .mockReturnValue(mockError422);

    renderComponent();

    const modifyBtns = await screen.findAllByRole('button', {
      name: /modifier/i,
    });

    expect(modifyBtns).toHaveLength(5);
    fireEvent.click(modifyBtns[0]);

    const saveButton = screen.queryByText(/enregistrer/i);
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
    expect(
      screen.queryByRole('button', {
        name: /modifier/i,
      })
    ).not.toBeInTheDocument();

    const cityInput = screen.getByLabelText(/ville/i) as HTMLInputElement;
    const postcodeInput = screen.getByLabelText(
      /code postal/i
    ) as HTMLInputElement;
    expect(cityInput.value).toBe(userMock.city);
    expect(postcodeInput.value).toBe(userMock.postcode);

    fireEvent.input(cityInput, {
      target: { value: 'Mulhouse' },
    });
    expect(cityInput.value).toBe('Mulhouse');

    fireEvent.input(postcodeInput, {
      target: { value: '75010' },
    });
    expect(postcodeInput.value).toBe('75010');
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeEnabled();

    fireEvent.click(saveButton!);
    expect(saveButton).toBeInTheDocument();

    expect(
      screen.queryAllByRole('button', {
        name: /modifier/i,
      })
    ).toHaveLength(0);
    expect(cityInput).toBeInTheDocument();
    expect(postcodeInput).toBeInTheDocument();
  });

  test('It should edit the profile and try save the user informations with not pro mail pattern match', async () => {
    useUser.mockImplementation(() => citizenContext);

    jest
      .spyOn(citizenService, 'getConsentsById')
      .mockReturnValue(userMock.consents);
    jest.spyOn(citizenService, 'getCitizenById').mockReturnValue(userMock);
    jest
      .spyOn(enterpriseService, 'getEntreprisesList')
      .mockReturnValue(enterpriseListMock);
    jest.spyOn(citizenService, 'updateCitizenById').mockReturnValue(null);

    renderComponent();

    const modifyBtns = await screen.findAllByRole('button', {
      name: /modifier/i,
    });
    expect(modifyBtns).toHaveLength(5);
    fireEvent.click(modifyBtns[0]);

    const saveButton = screen.queryByText(/enregistrer/i);
    expect(saveButton).toBeDisabled();

    expect(
      screen.queryByRole('button', {
        name: /modifier/i,
      })
    ).not.toBeInTheDocument();

    const cityInput = screen.getByLabelText(/ville/i) as HTMLInputElement;
    const postcodeInput = screen.getByLabelText(
      /code postal/i
    ) as HTMLInputElement;
    const emailCompanyInput = screen.getByLabelText(
      /adresse email professionnelle/i
    ) as HTMLInputElement;
    expect(cityInput.value).toBe(userMock.city);
    expect(postcodeInput.value).toBe(userMock.postcode);
    expect(emailCompanyInput.value).toBe(userMock.affiliation.enterpriseEmail);

    const companyName = screen.getByLabelText(/Renseignez votre entreprise/i);
    await selectEvent.select(companyName, enterpriseListMock[1].name);

    fireEvent.input(cityInput, {
      target: { value: 'Orleans' },
    });
    expect(cityInput.value).toBe('Orleans');

    fireEvent.input(postcodeInput, {
      target: { value: '45000' },
    });
    expect(postcodeInput.value).toBe('45000');

    fireEvent.input(emailCompanyInput, {
      target: { value: 'roger-salarie@atos.com' },
    });
    expect(emailCompanyInput.value).toBe('roger-salarie@atos.com');

    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeEnabled();

    act(async () => {
      fireEvent.click(saveButton!);
    });
    expect(
      await screen.findByRole('button', {
        name: 'Valider ma désaffiliation',
      })
    ).toBeInTheDocument();

    const cancelBtn = await screen.findAllByRole('button', {
      name: 'Annuler',
    });
    fireEvent.click(cancelBtn[1]);
    expect(cancelBtn[1]).not.toBeInTheDocument();
  });

  test('It should render the profile with user informations in read mode', async () => {
    useUser.mockImplementation(() => citizenContext);

    jest
      .spyOn(citizenService, 'getConsentsById')
      .mockReturnValue(userMock.consents);
    jest.spyOn(citizenService, 'getCitizenById').mockReturnValue(userMock);
    jest
      .spyOn(enterpriseService, 'getEntreprisesList')
      .mockReturnValue(enterpriseListMock);
    jest
      .spyOn(citizenService, 'deleteCitizenAccount')
      .mockReturnValue(Promise.resolve());
    jest
      .spyOn(citizenService, 'deleteConsent')
      .mockReturnValue(Promise.resolve());

    renderComponent();

    const modifyButtons = await screen.findAllByText('Modifier');
    expect(screen.queryByTestId('profile-title')).toBeInTheDocument();
    expect(screen.getByText('Mon identité')).toBeInTheDocument();
    expect(screen.getByText('Mon adresse')).toBeInTheDocument();
    expect(
      screen.getByText('Mon activité professionnelle')
    ).toBeInTheDocument();
    expect(modifyButtons).toHaveLength(5);
    expect(
      screen.getByText(Strings['profile.label.gender.male'])
    ).toBeInTheDocument();
    expect(
      screen.getByText(userMock.identity.lastName.value)
    ).toBeInTheDocument();
    expect(
      screen.getByText(userMock.identity.firstName.value)
    ).toBeInTheDocument();
    expect(
      screen.getByText(format(new Date(userMock.birthdate), 'dd/MM/yyyy'))
    ).toBeInTheDocument();
    expect(
      screen.getByText(userMock.personalInformation.email.value)
    ).toBeInTheDocument();
    expect(screen.getByText(userMock.city)).toBeInTheDocument();
    expect(screen.getByText(userMock.postcode)).toBeInTheDocument();
    expect(screen.getByText(userMock.statusPhrase)).toBeInTheDocument();
    expect(screen.getByText('Email professionnel')).toBeInTheDocument();
    expect(screen.getByText("Statut d'affiliation")).toBeInTheDocument();
    expect(
      screen.getByText(
        'Affiliation non validée - Veuillez confirmer votre mail professionnel grâce au lien reçu.'
      )
    ).toBeInTheDocument();

    expect(screen.getByText('Comptes liés')).toBeInTheDocument();
    expect(screen.getByText(userMock.consents[0].name)).toBeInTheDocument();
    expect(screen.getByText(userMock.consents[1].name)).toBeInTheDocument();

    const textsActif = await screen.findAllByText('Actif');
    expect(textsActif).toHaveLength(2);

    const deleteConsentButtons = await screen.findAllByRole('button', {
      name: 'Supprimer',
    });
    expect(deleteConsentButtons).toHaveLength(2);
    act(() => {
      fireEvent.click(deleteConsentButtons[0]);
    });
    expect(
      await screen.findByRole('button', {
        name: 'Valider',
      })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', {
        name: 'Annuler',
      })
    ).toBeInTheDocument();

    const confirmConsentDelete = await screen.findByRole('button', {
      name: 'Valider',
    });
    const cancelButton = await screen.findByRole('button', {
      name: 'Annuler',
    });

    act(() => {
      fireEvent.click(confirmConsentDelete);
    });
    await waitFor(() => {
      expect(deleteConsent).toHaveBeenCalled();
      expect(confirmConsentDelete).not.toBeInTheDocument();
      expect(cancelButton).not.toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(cancelButton);
    });
    expect(confirmConsentDelete).not.toBeInTheDocument();
    expect(cancelButton).not.toBeInTheDocument();

    const deleteBtn = screen.getByText(`Supprimer votre compte`);
    expect(deleteBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(deleteBtn);
    });
    expect(
      await screen.findByRole('button', {
        name: 'Valider',
      })
    ).toBeInTheDocument();

    const confirmDelete = await screen.findByRole('button', {
      name: 'Valider',
    });
    const cancelBtn = await screen.findByRole('button', {
      name: 'Annuler',
    });

    act(() => {
      fireEvent.click(confirmDelete);
    });

    await waitFor(() => {
      expect(confirmDelete).not.toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(cancelBtn);
    });
    expect(confirmDelete).not.toBeInTheDocument();
  });

  test('It should edit the profile and save the updated user informations for affiliated user', async () => {
    useUser.mockImplementation(() => citizenAffilliationContext);
    jest
      .spyOn(citizenService, 'getConsentsById')
      .mockReturnValue(userMock.consents);
    jest.spyOn(citizenService, 'getCitizenById').mockReturnValue(userMock);
    jest
      .spyOn(enterpriseService, 'getEntreprisesList')
      .mockReturnValue(enterpriseListMock);
    jest.spyOn(citizenService, 'updateCitizenById').mockReturnValue(null);

    renderComponent();

    const modifyBtns = await screen.findAllByRole('button', {
      name: /modifier/i,
    });
    expect(modifyBtns).toHaveLength(5);
    fireEvent.click(modifyBtns[0]);

    const saveButton = screen.queryByText(/enregistrer/i);
    expect(saveButton).toBeDisabled();

    expect(
      screen.queryByRole('button', {
        name: /modifier/i,
      })
    ).not.toBeInTheDocument();

    const cityInput = screen.getByLabelText(/ville/i) as HTMLInputElement;
    const postcodeInput = screen.getByLabelText(
      /code postal/i
    ) as HTMLInputElement;
    expect(cityInput.value).toBe(userMock.city);
    expect(postcodeInput.value).toBe(userMock.postcode);

    fireEvent.input(cityInput, {
      target: { value: 'Orleans' },
    });
    expect(cityInput.value).toBe('Orleans');

    fireEvent.input(postcodeInput, {
      target: { value: '45000' },
    });
    expect(postcodeInput.value).toBe('45000');

    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton!);
    expect(modifyBtns).toHaveLength(5);
    const successToast = await screen.findByText(
      'Votre profil a été mis à jour avec succès'
    );
    expect(successToast).toBeInTheDocument();
  });

  test('It should edit the profile and save the updated user informations', async () => {
    useUser.mockImplementation(() => citizenNoAffilliationContext);
    jest
      .spyOn(citizenService, 'getConsentsById')
      .mockReturnValue(userMock.consents);
    jest.spyOn(citizenService, 'getCitizenById').mockReturnValue(userMock);
    jest
      .spyOn(enterpriseService, 'getEntreprisesList')
      .mockReturnValue(enterpriseListMock);
    jest.spyOn(citizenService, 'updateCitizenById').mockReturnValue(null);

    renderComponent();

    const modifyBtns = await screen.findAllByRole('button', {
      name: /modifier/i,
    });
    expect(modifyBtns).toHaveLength(5);
    fireEvent.click(modifyBtns[0]);

    const saveButton = screen.queryByText(/enregistrer/i);
    expect(saveButton).toBeDisabled();

    expect(
      screen.queryByRole('button', {
        name: /modifier/i,
      })
    ).not.toBeInTheDocument();

    const cityInput = screen.getByLabelText(/ville/i) as HTMLInputElement;
    const postcodeInput = screen.getByLabelText(
      /code postal/i
    ) as HTMLInputElement;
    expect(cityInput.value).toBe(userMock.city);
    expect(postcodeInput.value).toBe(userMock.postcode);

    fireEvent.input(cityInput, {
      target: { value: 'Orleans' },
    });
    expect(cityInput.value).toBe('Orleans');

    fireEvent.input(postcodeInput, {
      target: { value: '45000' },
    });
    expect(postcodeInput.value).toBe('45000');

    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton!);
    expect(modifyBtns).toHaveLength(5);
    const successToast = await screen.findByText(
      'Votre profil a été mis à jour avec succès'
    );
    expect(successToast).toBeInTheDocument();
  });

  test('It should keep Profile in edit mode and not save updated user informations on server error', async () => {
    useUser.mockImplementation(() => citizenNoAffilliationContext);

    jest
      .spyOn(citizenService, 'getConsentsById')
      .mockReturnValue(userMock.consents);
    jest.spyOn(citizenService, 'getCitizenById').mockReturnValue(userMock);
    jest
      .spyOn(enterpriseService, 'getEntreprisesList')
      .mockReturnValue(enterpriseListMock);
    jest
      .spyOn(citizenService, 'updateCitizenById')
      .mockRejectedValue(mockServerError);

    renderComponent();

    const modifyBtns = await screen.findAllByRole('button', {
      name: /modifier/i,
    });

    expect(modifyBtns).toHaveLength(5);
    fireEvent.click(modifyBtns[0]);

    const saveButton = screen.queryByText(/enregistrer/i);
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
    expect(
      screen.queryByRole('button', {
        name: /modifier/i,
      })
    ).not.toBeInTheDocument();

    const cityInput = screen.getByLabelText(/ville/i) as HTMLInputElement;
    const postcodeInput = screen.getByLabelText(
      /code postal/i
    ) as HTMLInputElement;
    expect(cityInput.value).toBe(userMock.city);
    expect(postcodeInput.value).toBe(userMock.postcode);

    fireEvent.input(cityInput, {
      target: { value: 'Mulhouse' },
    });
    expect(cityInput.value).toBe('Mulhouse');

    fireEvent.input(postcodeInput, {
      target: { value: '75010' },
    });
    expect(postcodeInput.value).toBe('75010');

    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeEnabled();

    fireEvent.click(saveButton!);
    expect(saveButton).toBeInTheDocument();

    expect(
      screen.queryAllByRole('button', {
        name: /modifier/i,
      })
    ).toHaveLength(0);
    expect(cityInput).toBeInTheDocument();
    expect(postcodeInput).toBeInTheDocument();
  });

  test('It should cancel the edit form', async () => {
    useUser.mockImplementation(() => citizenContext);

    jest
      .spyOn(citizenService, 'getConsentsById')
      .mockReturnValue(userMock.consents);
    jest.spyOn(citizenService, 'getCitizenById').mockReturnValue(userMock);
    jest
      .spyOn(enterpriseService, 'getEntreprisesList')
      .mockReturnValue(enterpriseListMock);

    renderComponent();

    const modifyBtns = await screen.findAllByRole('button', {
      name: /modifier/i,
    });
    fireEvent.click(modifyBtns[0]);
    const cancelBtn = await screen.findAllByRole('button', {
      name: /annuler/i,
    });
    expect(cancelBtn).toHaveLength(1);
    fireEvent.click(cancelBtn[0]);
    expect(modifyBtns).toHaveLength(5);
  });

  test('It should submit new affiliation email', async () => {
    useUser.mockImplementation(() => citizenContext);
    jest
      .spyOn(citizenService, 'getConsentsById')
      .mockReturnValue(userMock.consents);
    jest.spyOn(citizenService, 'getCitizenById').mockReturnValue(userMock);
    jest
      .spyOn(enterpriseService, 'getEntreprisesList')
      .mockReturnValue(enterpriseListMock);
    jest.spyOn(citizenService, 'updateCitizenById').mockReturnValue(null);

    renderComponent();

    const sendAffiliationEmailButton = await screen.findAllByRole('button', {
      name: /Renvoyer le Lien/i,
    });
    expect(sendAffiliationEmailButton).toHaveLength(1);
    act(() => {
      fireEvent.click(sendAffiliationEmailButton[0]);
    });
    const successToast = await screen.findByText(
      "Un email d'affiliation a été envoyé avec succès"
    );
    expect(successToast).toBeInTheDocument();
  });

  test('It should submit new affiliation email on server error', async () => {
    useUser.mockImplementation(() => citizenContext);

    jest
      .spyOn(citizenService, 'getConsentsById')
      .mockReturnValue(userMock.consents);
    jest.spyOn(citizenService, 'getCitizenById').mockReturnValue(userMock);
    jest
      .spyOn(enterpriseService, 'getEntreprisesList')
      .mockReturnValue(enterpriseListMock);
    jest
      .spyOn(citizenService, 'updateCitizenById')
      .mockRejectedValue(mockServerError);

    renderComponent();

    const sendAffiliationEmailButton = await screen.findAllByRole('button', {
      name: /Renvoyer le Lien/i,
    });
    expect(sendAffiliationEmailButton).toHaveLength(1);
    act(() => {
      fireEvent.click(sendAffiliationEmailButton[0]);
    });
  });

  test('It should edit the non affiliated profile and save the updated user informations', async () => {
    useUser.mockImplementation(() => citizenNoAffilliationContext);

    jest
      .spyOn(citizenService, 'getConsentsById')
      .mockReturnValue(userMock.consents);
    jest
      .spyOn(citizenService, 'getCitizenById')
      .mockReturnValue(userMockNoAffiliation);
    jest
      .spyOn(enterpriseService, 'getEntreprisesList')
      .mockReturnValue(enterpriseListMock);
    jest.spyOn(citizenService, 'updateCitizenById').mockReturnValue(null);

    renderComponent();

    const modifyBtns = await screen.findAllByRole('button', {
      name: /modifier/i,
    });
    expect(modifyBtns).toHaveLength(5);
    fireEvent.click(modifyBtns[0]);

    const saveButton = screen.queryByText(/enregistrer/i);
    expect(saveButton).toBeDisabled();

    expect(
      screen.queryByRole('button', {
        name: /modifier/i,
      })
    ).not.toBeInTheDocument();

    const cityInput = screen.getByLabelText(/ville/i) as HTMLInputElement;
    const postcodeInput = screen.getByLabelText(
      /code postal/i
    ) as HTMLInputElement;
    expect(cityInput.value).toBe(userMock.city);
    expect(postcodeInput.value).toBe(userMock.postcode);

    fireEvent.input(cityInput, {
      target: { value: 'Orleans' },
    });
    expect(cityInput.value).toBe('Orleans');

    fireEvent.input(postcodeInput, {
      target: { value: '45000' },
    });
    expect(postcodeInput.value).toBe('45000');

    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeEnabled();

    act(() => {
      fireEvent.click(saveButton!);
    });

    expect(modifyBtns).toHaveLength(5);
    const successToast = await screen.findByText(
      "Un email d'affiliation a été envoyé avec succès"
    );
    expect(successToast).toBeInTheDocument();
  });

  test('It should download userData', async () => {
    useUser.mockImplementation(() => citizenContext);

    jest
      .spyOn(citizenService, 'getConsentsById')
      .mockReturnValue(userMock.consents);
    jest.spyOn(citizenService, 'getCitizenById').mockReturnValue(userMock);
    jest
      .spyOn(enterpriseService, 'getEntreprisesList')
      .mockReturnValue(enterpriseListMock);
    jest.spyOn(citizenService, 'downloadRgpdFileXlsx').mockRejectedValue(null);

    renderComponent();

    const télécharger = await screen.findByRole('link', {
      name: 'Télécharger mes données personnelles',
    });
    expect(télécharger).toBeInTheDocument();
    act(() => {
      fireEvent.click(télécharger);
    });
  });
});
