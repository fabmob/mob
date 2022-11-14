import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  mockUseKeycloak,
  mockUserKeycloakNotAuthenticated,
} from '../../../routes/mockKeycloak';
import AffiliateAlreadyExistsMessage from './AffiliateAlreadyExistsMessage';

jest.mock('../../../../context', () => {
  return {
    useSession: jest
      .fn()
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated()),
  };
});

describe('<AffiliateAlreadyExistsMessage />', () => {
  test('check texts attendance when user is logged', () => {
    const { getByTitle } = render(<AffiliateAlreadyExistsMessage />);

    screen.getByText((_content, node) => {
      if (node === null) {
        return false;
      }
      const hasText = (node: Element) => {
        return (
          node.textContent ===
          'Vous êtes déjà affilié à une entreprise, vous pouvez vérifier votre affiliation sur votre page Mon profil.'
        );
      };
      const nodeHasText = hasText(node as Element);
      const childrenDontHaveText = Array.from(node.children).every(
        (child) => !hasText(child)
      );

      return nodeHasText && childrenDontHaveText;
    });

    expect(getByTitle('Voir mon profil')).toBeInTheDocument();
  });

  test("check texts attendance user isn't logged", () => {
    const { getByText } = render(<AffiliateAlreadyExistsMessage />);

    expect(
      getByText(
        "Vous êtes déjà affilié à une entreprise, vous pouvez vérifier votre affiliation sur votre page 'Mon profil'."
      )
    ).toBeInTheDocument();
  });
});
