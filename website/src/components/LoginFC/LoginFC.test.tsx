import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginFC from './LoginFC';
import { mockUseKeycloak } from '@utils/mockKeycloak';

jest.mock('../../context', () => {
  return {
    useSession: () => mockUseKeycloak,
    useUser: () => mockUseKeycloak,
  };
});

describe('<LoginFC />', () => {
  const renderComponent = () => {
    return render(
      <LoginFC
        isFCCitizen={false}
        contentText={{
          notExtendedMessage:
            'Faciliter vos demandes de subvention avec FranceConnect.',
          extendedQuestion:
            'Vous souhaitez faciliter vos demandes de subvention ?',
          extendedMessage1:
            'Rendez-vous sur la page de connexion et utilisez vos identifiants FranceConnect.',
          extendedMessage2:
            'Votre compte moB sera lié à FranceConnect et votre identitée validée.',
        }}
      />
    );
  };
  const renderComponentFC = () => {
    return render(
      <LoginFC
        isFCCitizen={true}
        contentText={{
          notExtendedMessage:
            'Faciliter vos demandes de subvention avec FranceConnect.',
          extendedQuestion:
            'Vous souhaitez faciliter vos demandes de subvention ?',
          extendedMessage1:
            'Rendez-vous sur la page de connexion et utilisez vos identifiants FranceConnect.',
          extendedMessage2:
            'Votre compte moB sera lié à FranceConnect et votre identitée validée.',
        }}
      />
    );
  };

  test('renders children text', async () => {
    const { container } = renderComponent();
    renderComponentFC();

    expect(
      screen.getByText(
        'Faciliter vos demandes de subvention avec FranceConnect.'
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /arrow_btn/i })
    ).toBeInTheDocument();
    const toggleButton = await screen.findAllByRole('button', {
      name: /arrow_btn/i,
    });
    fireEvent.click(toggleButton[0]);

    expect(
      container.getElementsByClassName('fc_buttons_container').length
    ).toBe(1);
    expect(
      screen.getByRole('button', { name: /fc_link/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /arrow_btn/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Vous souhaitez faciliter vos demandes de subvention ?')
    );
    expect(
      screen.getByText(
        'Rendez-vous sur la page de connexion et utilisez vos identifiants FranceConnect.'
      )
    );
    expect(
      screen.getByText(
        'Votre compte moB sera lié à FranceConnect et votre identitée validée.'
      )
    );

    expect(
      screen.getByRole('button', { name: /close_button/i })
    ).toBeInTheDocument();
    const closeInsert = await screen.findAllByRole('button', {
      name: /close_button/i,
    });
    fireEvent.click(closeInsert[0]);
  });
});
