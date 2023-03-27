import React from 'react';
import { render } from '@testing-library/react';

import Strings from '../locale/fr.json';

import { mockUseKeycloak } from '@helpers/tests/mocks';
import InscriptionPageErrorReconciliation from './InscriptionPageErrorReconciliation';

jest.mock('@context', () => {
  return {
    useSession: () => [mockUseKeycloak.keycloak, mockUseKeycloak.isKCInit],
  };
});

jest.mock('@components/Image/Image');

describe('<InscriptionPageErrorReconciliation />', () => {
  test('Display InscriptionPageErrorReconciliation Page', async () => {
    const { getByText, getByTestId } = render(
      <InscriptionPageErrorReconciliation />
    );

    const contactButton = getByTestId('reconciliation-contactbtn');
    expect(
      getByText(Strings['creation.error.reconcialition.title'])
    ).toBeInTheDocument();
    expect(
      getByText(
        `${Strings['creation.error.reconcialition.message.line1']} ${Strings['creation.error.reconcialition.message.line2']}`
      )
    ).toBeInTheDocument();
    expect(
      getByText(Strings['creation.error.reconcialition.message.line3'])
    ).toBeInTheDocument();
    expect(contactButton).toHaveAttribute('href', '/contact');
  });
});
