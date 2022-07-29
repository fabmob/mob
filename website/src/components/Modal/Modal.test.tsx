import React from 'react';
import { render } from '@testing-library/react';
import ModalComponent, { ParamsModal } from './Modal';

describe('<Modal />', () => {
  const value = 'This is the body of the modal';
  const params: ParamsModal = {
    title: 'Suppression affiliation',
    subtitle: 'Êtes vous sûr de vouloir supprimer',
    submitBtn: {
      label: 'Valider',
      onClick: () => {},
    },
    cancelBtn: {
      label: 'Annuler',
      onClick: () => {},
    },
  };
  test('renders children text', () => {
    const { container, getByText } = render(
      <ModalComponent
        params={params}
        isShowModal={true}
        closeModal={() => {}}
        data={'citizenId'}
      >
        {value}
      </ModalComponent>
    );
    expect(getByText(value)).toBeInTheDocument();
  });
});
