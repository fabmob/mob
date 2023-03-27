import React from 'react';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { navigate } from 'gatsby';
import '@testing-library/jest-dom';

import AideSearchGreenCard from './AideSearchGreenCard';
import { mockUseKeycloak } from '@utils/mockKeycloak';
import { useUser } from '../../../context';
import { AffiliationStatus } from '@constants';

const userNotAffiliatedMock = {
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
  affiliation: {
    enterpriseId: '12345',
    enterpriseEmail: 'roger@capgemini.com',
    status: AffiliationStatus.TO_AFFILIATE,
  },
};

const userNoAffiliationNoCityPostcodeMock = {
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
  status: 'salarie'
};

const userAffiliatedNoCityPostcodeMock = {
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
  status: 'salarie',
  affiliation: {
    enterpriseId: '12345',
    enterpriseEmail: 'roger@capgemini.com',
    status: AffiliationStatus.AFFILIATED,
  },
};

const citizenNotAffiliatedContext = {
  citizen: userNotAffiliatedMock,
  authenticated: true
};

const citizenNoAffiliationNoCityPostcodeContext = {
  citizen: userNoAffiliationNoCityPostcodeMock,
  authenticated: true
};

const citizenAffiliatedNoCityPostcodeContext = {
  citizen: userAffiliatedNoCityPostcodeMock,
  authenticated: true
};

const citizenNotConnected = {
  citizen: undefined,
  authenticated: false
};


jest.mock('../../../context', () => ({
  useSession: () => mockUseKeycloak,
  useUser: jest.fn(),
}));

beforeEach(() => cleanup());

describe('<AideSearchGreenCard />', () => {
  test('Display correct green Card connected not affiliated', () => {
    useUser.mockImplementation(() => citizenNotAffiliatedContext);

    const { getByText } = render(<AideSearchGreenCard />);
    expect(
      getByText(
        'Compléter votre activité professionnelle pour découvrir les aides proposées par votre employeur'
      ).closest('.mcm-card--green')
    ).toBeInTheDocument();
  });

  test('Click on green card connected not affiliated', async () => {
    useUser.mockImplementation(() => citizenNotAffiliatedContext);

    const { getByText } = render(<AideSearchGreenCard />);
    expect(getByText('Mon Profil')).toBeInTheDocument();
    await waitFor(() => {
      fireEvent.click(getByText('Mon Profil'));
      expect(navigate).toHaveBeenCalledTimes(0);
    });
  });

  test('Display correct green Card connected not affiliated no postcode && city', () => {
    useUser.mockImplementation(() => citizenNoAffiliationNoCityPostcodeContext);

    const { getByText } = render(<AideSearchGreenCard />);
    expect(
      getByText(
        'Complétez votre profil avec :'
      ).closest('.mcm-card--green')
    ).toBeInTheDocument();
    expect(
      getByText(
        "Votre ville et code postal pour bénéficier d'un affichage personnalisé de vos aides"
      )
    ).toBeInTheDocument();
    expect(
      getByText(
        "Votre activité professionnelle pour découvrir les aides proposées par votre employeur"
      )
    ).toBeInTheDocument();
  });

  test('Click on green card connected not affiliated no postcode && city', async () => {
    useUser.mockImplementation(() => citizenNoAffiliationNoCityPostcodeContext);

    const { getByText } = render(<AideSearchGreenCard />);
    expect(getByText('Mon Profil')).toBeInTheDocument();
    await waitFor(() => {
      fireEvent.click(getByText('Mon Profil'));
      expect(navigate).toHaveBeenCalledTimes(0);
    });
  });

  test('Display correct green Card connected affiliated no postcode && city', () => {
    useUser.mockImplementation(() => citizenAffiliatedNoCityPostcodeContext);

    const { getByText } = render(<AideSearchGreenCard />);
    expect(
      getByText(
        "Compléter votre profil avec votre ville et code postal pour bénéficier d'un affichage personnalisé de vos aides"
      ).closest('.mcm-card--green')
    ).toBeInTheDocument();
  });

  test('Click on green card connected affiliated no postcode && city', async () => {
    useUser.mockImplementation(() => citizenAffiliatedNoCityPostcodeContext);

    const { getByText } = render(<AideSearchGreenCard />);
    expect(getByText('Mon Profil')).toBeInTheDocument();
    await waitFor(() => {
      fireEvent.click(getByText('Mon Profil'));
      expect(navigate).toHaveBeenCalledTimes(0);
    });
  });

  test('Display correct green Card not connected', () => {
    useUser.mockImplementation(() => citizenNotConnected);

    const { getByText } = render(<AideSearchGreenCard />);
    expect(
      getByText(
        "Connectez-vous ou créez votre compte pour :"
      ).closest('.mcm-card--green')
    ).toBeInTheDocument();
    expect(
      getByText(
        "Bénéficier d'un affichage personnalisé de vos aides"
      )
    ).toBeInTheDocument();
    expect(
      getByText(
        "Découvrir les aides proposées par votre employeur"
      )
    ).toBeInTheDocument();
  });

  test('Click on green card not connected', async () => {
    useUser.mockImplementation(() => citizenNotConnected);

    const { getByText } = render(<AideSearchGreenCard />);
    expect(getByText('Me connecter')).toBeInTheDocument();
    await waitFor(() => {
      fireEvent.click(getByText('Me connecter'));
      expect(navigate).toHaveBeenCalledTimes(0);
    });
  });

  
});
