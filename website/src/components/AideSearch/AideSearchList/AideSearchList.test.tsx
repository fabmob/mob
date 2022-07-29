import React from 'react';
import * as Gatsby from 'gatsby';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';

import AideSearchList from './AideSearchList';
import { Incentive } from '../../../utils/aides';
import { mockUseKeycloak } from '@utils/mockKeycloak';

jest.mock('@react-keycloak/web', () => {
  return {
    useKeycloak: () => mockUseKeycloak,
  };
});

const aideList: Incentive[] = [
  {
    id: '0',
    title: 'aide 1',
    description: 'my description',
    territoryName: 'territoryName',
    funderName: 'funderName',
    conditions: 'conditions',
    paymentMethod: 'paymentMethod',
    allocatedAmount: 'allocatedAmount',
    additionalInfos: 'additionalInfos',
    contact: 'contact',
    validityDuration: 'validityDuration',
    validityDate: 'validityDate',
    minAmount: '50',
    incentiveType: 'AideEmployeur',
    transportList: [
      { id: '0', transport: 'velo' },
      { id: '1', transport: 'voiture' },
    ],
    createdAt: 'now',
    updatedAt: 'now',
  },
  {
    id: '1',
    title: 'aide 2',
    description: 'my description',
    territoryName: 'territoryName',
    funderName: 'funderName',
    conditions: 'conditions',
    paymentMethod: 'paymentMethod',
    allocatedAmount: 'allocatedAmount',
    additionalInfos: 'additionalInfos',
    contact: 'contact',
    validityDuration: 'validityDuration',
    validityDate: 'validityDate',
    minAmount: '250',
    incentiveType: 'AideEmployeur',
    transportList: [
      { id: '0', transport: 'velo' },
      { id: '1', transport: 'voiture' },
    ],
    createdAt: 'now',
    updatedAt: 'now',
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

describe('<AideSearchList />', () => {
  test('Check presents of green card', async () => {
    const { getByText } = render(<AideSearchList items={[]} greenCard />);
    expect(
      getByText(
        'Découvrez les aides proposées par votre employeur en créant votre compte.'
      ).closest('.mcm-card--green')
    ).toBeInTheDocument();
  });
  test('Render list of two elements', async () => {
    const { getByText } = render(<AideSearchList items={aideList} greenCard />);
    expect(getByText('aide 1')).toBeInTheDocument();
    expect(getByText('aide 2')).toBeInTheDocument();
  });
  test('Render list of one elements', async () => {
    const { getByText } = render(
      <AideSearchList items={[aideList[0]]} greenCard />
    );
    expect(getByText('aide 1')).toBeInTheDocument();
  });
  test('Render list of two elements without green card', async () => {
    const { queryByText } = render(<AideSearchList items={aideList} />);
    expect(
      queryByText(
        'Découvrez les aides proposées par votre employeur en créant votre compte.'
      )
    ).toBeNull();
  });
  test('Render more aides if click on "Afficher plus de résultats"', async () => {
    const { getByText, queryByText } = render(
      <AideSearchList items={aideListX15} />
    );
    expect(queryByText('aide 14')).not.toBeInTheDocument();
    await act(async () => {
      fireEvent.click(getByText('Afficher plus de résultats'));
    });
    expect(queryByText('aide 14')).toBeInTheDocument();
  });
});

const aideListX15: Incentive[] = [
  {
    id: '1',
    title: 'aide 1',
    description: 'my description',
    territoryName: 'territoryName',
    funderName: 'funderName',
    conditions: 'conditions',
    paymentMethod: 'paymentMethod',
    allocatedAmount: 'allocatedAmount',
    additionalInfos: 'additionalInfos',
    contact: 'contact',
    validityDuration: 'validityDuration',
    validityDate: 'validityDate',
    minAmount: '50',
    incentiveType: 'AideEmployeur',
    transportList: [{ id: '1', transport: 'voiture' }],
    createdAt: 'now',
    updatedAt: 'now',
  },
  {
    id: '2',
    title: 'aide 2',
    description: 'my description',
    territoryName: 'territoryName',
    funderName: 'funderName',
    conditions: 'conditions',
    paymentMethod: 'paymentMethod',
    allocatedAmount: 'allocatedAmount',
    additionalInfos: 'additionalInfos',
    contact: 'contact',
    validityDuration: 'validityDuration',
    validityDate: 'validityDate',
    minAmount: '50',
    incentiveType: 'AideEmployeur',
    transportList: [{ id: '1', transport: 'voiture' }],
    createdAt: 'now',
    updatedAt: 'now',
  },
  {
    id: '3',
    title: 'aide 3',
    description: 'my description',
    territoryName: 'territoryName',
    funderName: 'funderName',
    conditions: 'conditions',
    paymentMethod: 'paymentMethod',
    allocatedAmount: 'allocatedAmount',
    additionalInfos: 'additionalInfos',
    contact: 'contact',
    validityDuration: 'validityDuration',
    validityDate: 'validityDate',
    minAmount: '50',
    incentiveType: 'AideEmployeur',
    transportList: [{ id: '1', transport: 'voiture' }],
    createdAt: 'now',
    updatedAt: 'now',
  },
  {
    id: '4',
    title: 'aide 4',
    description: 'my description',
    territoryName: 'territoryName',
    funderName: 'funderName',
    conditions: 'conditions',
    paymentMethod: 'paymentMethod',
    allocatedAmount: 'allocatedAmount',
    additionalInfos: 'additionalInfos',
    contact: 'contact',
    validityDuration: 'validityDuration',
    validityDate: 'validityDate',
    minAmount: '50',
    incentiveType: 'AideEmployeur',
    transportList: [
      { id: '0', transport: 'velo' },
      { id: '1', transport: 'voiture' },
    ],
    createdAt: 'now',
    updatedAt: 'now',
  },
  {
    id: '5',
    title: 'aide 5',
    description: 'my description',
    territoryName: 'territoryName',
    funderName: 'funderName',
    conditions: 'conditions',
    paymentMethod: 'paymentMethod',
    allocatedAmount: 'allocatedAmount',
    additionalInfos: 'additionalInfos',
    contact: 'contact',
    validityDuration: 'validityDuration',
    validityDate: 'validityDate',
    minAmount: '50',
    incentiveType: 'AideEmployeur',
    transportList: [
      { id: '0', transport: 'velo' },
      { id: '1', transport: 'voiture' },
    ],
    createdAt: 'now',
    updatedAt: 'now',
  },
  {
    id: '6',
    title: 'aide 6',
    description: 'my description',
    territoryName: 'territoryName',
    funderName: 'funderName',
    conditions: 'conditions',
    paymentMethod: 'paymentMethod',
    allocatedAmount: 'allocatedAmount',
    additionalInfos: 'additionalInfos',
    contact: 'contact',
    validityDuration: 'validityDuration',
    validityDate: 'validityDate',
    minAmount: '50',
    incentiveType: 'AideEmployeur',
    transportList: [
      { id: '0', transport: 'velo' },
      { id: '1', transport: 'voiture' },
    ],
    createdAt: 'now',
    updatedAt: 'now',
  },
  {
    id: '7',
    title: 'aide 7',
    description: 'my description',
    territoryName: 'territoryName',
    funderName: 'funderName',
    conditions: 'conditions',
    paymentMethod: 'paymentMethod',
    allocatedAmount: 'allocatedAmount',
    additionalInfos: 'additionalInfos',
    contact: 'contact',
    validityDuration: 'validityDuration',
    validityDate: 'validityDate',
    minAmount: '50',
    incentiveType: 'AideEmployeur',
    transportList: [
      { id: '0', transport: 'velo' },
      { id: '1', transport: 'voiture' },
    ],
    createdAt: 'now',
    updatedAt: 'now',
  },
  {
    id: '8',
    title: 'aide 8',
    description: 'my description',
    territoryName: 'territoryName',
    funderName: 'funderName',
    conditions: 'conditions',
    paymentMethod: 'paymentMethod',
    allocatedAmount: 'allocatedAmount',
    additionalInfos: 'additionalInfos',
    contact: 'contact',
    validityDuration: 'validityDuration',
    validityDate: 'validityDate',
    minAmount: '50',
    incentiveType: 'AideEmployeur',
    transportList: [
      { id: '0', transport: 'velo' },
      { id: '1', transport: 'voiture' },
    ],
    createdAt: 'now',
    updatedAt: 'now',
  },
  {
    id: '9',
    title: 'aide 9',
    description: 'my description',
    territoryName: 'territoryName',
    funderName: 'funderName',
    conditions: 'conditions',
    paymentMethod: 'paymentMethod',
    allocatedAmount: 'allocatedAmount',
    additionalInfos: 'additionalInfos',
    contact: 'contact',
    validityDuration: 'validityDuration',
    validityDate: 'validityDate',
    minAmount: '50',
    incentiveType: 'AideEmployeur',
    transportList: [
      { id: '0', transport: 'velo' },
      { id: '1', transport: 'voiture' },
    ],
    createdAt: 'now',
    updatedAt: 'now',
  },
  {
    id: '10',
    title: 'aide 10',
    description: 'my description',
    territoryName: 'territoryName',
    funderName: 'funderName',
    conditions: 'conditions',
    paymentMethod: 'paymentMethod',
    allocatedAmount: 'allocatedAmount',
    additionalInfos: 'additionalInfos',
    contact: 'contact',
    validityDuration: 'validityDuration',
    validityDate: 'validityDate',
    minAmount: '50',
    incentiveType: 'AideEmployeur',
    transportList: [
      { id: '0', transport: 'velo' },
      { id: '1', transport: 'voiture' },
    ],
    createdAt: 'now',
    updatedAt: 'now',
  },
  {
    id: '11',
    title: 'aide 11',
    description: 'my description',
    territoryName: 'territoryName',
    funderName: 'funderName',
    conditions: 'conditions',
    paymentMethod: 'paymentMethod',
    allocatedAmount: 'allocatedAmount',
    additionalInfos: 'additionalInfos',
    contact: 'contact',
    validityDuration: 'validityDuration',
    validityDate: 'validityDate',
    minAmount: '50',
    incentiveType: 'AideEmployeur',
    transportList: [
      { id: '0', transport: 'velo' },
      { id: '1', transport: 'voiture' },
    ],
    createdAt: 'now',
    updatedAt: 'now',
  },
  {
    id: '12',
    title: 'aide 12',
    description: 'my description',
    territoryName: 'territoryName',
    funderName: 'funderName',
    conditions: 'conditions',
    paymentMethod: 'paymentMethod',
    allocatedAmount: 'allocatedAmount',
    additionalInfos: 'additionalInfos',
    contact: 'contact',
    validityDuration: 'validityDuration',
    validityDate: 'validityDate',
    minAmount: '50',
    incentiveType: 'AideEmployeur',
    transportList: [
      { id: '0', transport: 'velo' },
      { id: '1', transport: 'voiture' },
    ],
    createdAt: 'now',
    updatedAt: 'now',
  },
  {
    id: '13',
    title: 'aide 13',
    description: 'my description',
    territoryName: 'territoryName',
    funderName: 'funderName',
    conditions: 'conditions',
    paymentMethod: 'paymentMethod',
    allocatedAmount: 'allocatedAmount',
    additionalInfos: 'additionalInfos',
    contact: 'contact',
    validityDuration: 'validityDuration',
    validityDate: 'validityDate',
    minAmount: '50',
    incentiveType: 'AideEmployeur',
    transportList: [
      { id: '0', transport: 'velo' },
      { id: '1', transport: 'voiture' },
    ],
    createdAt: 'now',
    updatedAt: 'now',
  },
  {
    id: '14',
    title: 'aide 14',
    description: 'my description',
    territoryName: 'territoryName',
    funderName: 'funderName',
    conditions: 'conditions',
    paymentMethod: 'paymentMethod',
    allocatedAmount: 'allocatedAmount',
    additionalInfos: 'additionalInfos',
    contact: 'contact',
    validityDuration: 'validityDuration',
    validityDate: 'validityDate',
    minAmount: '50',
    incentiveType: 'AideEmployeur',
    transportList: [
      { id: '0', transport: 'velo' },
      { id: '1', transport: 'voiture' },
    ],
    createdAt: 'now',
    updatedAt: 'now',
  },
  {
    id: '15',
    title: 'aide 15',
    description: 'my description',
    territoryName: 'territoryName',
    funderName: 'funderName',
    conditions: 'conditions',
    paymentMethod: 'paymentMethod',
    allocatedAmount: 'allocatedAmount',
    additionalInfos: 'additionalInfos',
    contact: 'contact',
    validityDuration: 'validityDuration',
    validityDate: 'validityDate',
    minAmount: '50',
    incentiveType: 'AideEmployeur',
    transportList: [
      { id: '0', transport: 'velo' },
      { id: '1', transport: 'voiture' },
    ],
    createdAt: 'now',
    updatedAt: 'now',
  },
];
