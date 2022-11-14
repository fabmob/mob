
import React from 'react';
import { render } from '@testing-library/react';
import AffiliateActivationMessage from './AffiliateActivationMessage';

describe('<AffiliateActivationMessage/>', () => {
  test('check texts attendance', () => {
    const { getByText } = render(<AffiliateActivationMessage />);

    expect(
      getByText('Votre compte est prêt à être affilié.')
    ).toBeInTheDocument();
    expect(
      getByText(
        'Cliquez sur le lien ci-dessous pour affilier votre compte.'
      )
    ).toBeInTheDocument();
  });
});