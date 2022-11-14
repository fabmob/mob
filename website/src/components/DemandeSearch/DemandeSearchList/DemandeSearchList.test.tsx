import React from 'react';
import * as Gatsby from 'gatsby';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import DemandeSearchList from './DemandeSearchList';
import { Subscription } from '@utils/demandes';

const demandeList: Subscription[] = [
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
    status: 'A_TRAITER',
    attachments: ['RB'],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Capgemini',
    incentiveType: 'AideEmployeur',
  },
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
    status: 'A_TRAITER',
    attachments: ['RB'],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Capgemini',
    incentiveType: 'AideEmployeur',
  },
];

const useStaticQuery = jest.spyOn(Gatsby, 'useStaticQuery');
useStaticQuery.mockImplementation(() => ({
  data: {
    edges: [
      {
        node: {
          relativePath: 'velo.svg',
          childImageSharp: {
            fluid: {
              aspectRatio: 1,
              src: 'src',
              srcSet: 'srcSet',
              sizes: 'sizes',
            },
          },
        },
      },
      {
        node: {
          relativePath: 'voiture.svg',
          childImageSharp: {
            fluid: {
              aspectRatio: 1,
              src: 'src',
              srcSet: 'srcSet',
              sizes: 'sizes',
            },
          },
        },
      },
    ],
  },
}));

describe('<DemandeSearchList />', () => {
  test('Render list of two elements', async () => {
    const { getByText } = render(<DemandeSearchList items={demandeList} />);
    expect(getByText('aide 1')).toBeInTheDocument();
    expect(getByText('aide 2')).toBeInTheDocument();
  });
  test('Render list of one elements', async () => {
    const { getByText } = render(
      <DemandeSearchList items={[demandeList[0]]} />
    );
    expect(getByText('aide 1')).toBeInTheDocument();
  });
  test('Render list of two elements', async () => {
    const { queryByText } = render(<DemandeSearchList items={demandeList} />);
    expect(queryByText('aide 2')).toBeInTheDocument();
  });
  test('Render more aides if click on "Afficher plus de demandes"', async () => {
    const { getByText, queryByText } = render(
      <DemandeSearchList items={demandeListX} />
    );
    expect(queryByText('aide 11')).not.toBeInTheDocument();
    await act(async () => {
      fireEvent.click(getByText('Afficher plus de demandes'));
    });
    expect(queryByText('aide 11')).toBeInTheDocument();
  });
});

const demandeListX: Subscription[] = [
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
    status: 'A_TRAITER',
    attachments: ['RB'],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Capgemini',
    incentiveType: 'AideEmployeur',
  },
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
    status: 'A_TRAITER',
    attachments: ['RB'],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Capgemini',
    incentiveType: 'AideEmployeur',
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
    status: 'A_TRAITER',
    attachments: ['RB'],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Capgemini',
    incentiveType: 'AideEmployeur',
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
    status: 'A_TRAITER',
    attachments: ['RB'],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Capgemini',
    incentiveType: 'AideEmployeur',
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
    status: 'A_TRAITER',
    attachments: ['RB'],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Capgemini',
    incentiveType: 'AideEmployeur',
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
    status: 'A_TRAITER',
    attachments: ['RB'],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Capgemini',
    incentiveType: 'AideEmployeur',
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
    status: 'A_TRAITER',
    attachments: ['RB'],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Capgemini',
    incentiveType: 'AideEmployeur',
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
    status: 'A_TRAITER',
    attachments: ['RB'],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Capgemini',
    incentiveType: 'AideEmployeur',
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
    status: 'A_TRAITER',
    attachments: ['RB'],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Capgemini',
    incentiveType: 'AideEmployeur',
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
    status: 'A_TRAITER',
    attachments: ['RB'],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Capgemini',
    incentiveType: 'AideEmployeur',
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
    status: 'A_TRAITER',
    attachments: ['RB'],
    createdAt: '2021-02-02',
    updatedAt: '2021-02-02',
    funderName: 'Capgemini',
    incentiveType: 'AideEmployeur',
  },
];
