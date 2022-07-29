import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  mockUseKeycloak,
  mockUserKeycloakNotAuthenticated,
} from '../../../routes/mockKeycloak';
import AffiliateFailedMessage from './AffiliateFailedMessage';

jest.mock('@react-keycloak/web', () => {
  return {
    useKeycloak: jest
      .fn()
      .mockReturnValueOnce(mockUseKeycloak())
      .mockReturnValueOnce(mockUserKeycloakNotAuthenticated()),
  };
});

describe('<AffiliateFailedMessage />', () => {
  test('check texts attendance when user is logged', () => {
    const { getByTitle } = render(<AffiliateFailedMessage />);

    screen.getByText((_content, node) => {
      if (node === null) {
        return false;
      }
      const hasText = (node: Element) => {
        return (
          node.textContent ===
          "Une erreur s'est produite, votre affiliation n'a pas pu être réalisée. Vous pouvez réessayer plus tard depuis la page Mon profil."
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
    const { getByText } = render(<AffiliateFailedMessage />);

    expect(
      getByText(
        "Une erreur s'est produite, votre affiliation n'a pas pu être réalisée. Vous pouvez réessayer plus tard depuis la page 'Mon profil'."
      )
    ).toBeInTheDocument();
  });
});