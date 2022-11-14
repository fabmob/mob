import React from 'react';
import { render } from '@testing-library/react';
import ModalComponent, { ParamsModal } from './Modal';

describe('<Modal />', () => {
  const value = 'This is the body of the modal';
  const params: ParamsModal = {
    title: 'Suppression affiliation',
    subtitle: 'Êtes vous sûr de vouloir supprimer',
    fullName: 'john doe',
    email: 'email@gmail.com',
    birthdate: '1991-11-17',
    submitBtn: {
      label: 'Valider',
      onClick: () => {},
    },
    cancelBtn: {
      label: 'Annuler',
      onClick: () => {},
    },
    rejectBtn: {
      label: 'Rejeter',
      onClick: () => {},
    },
  };

  const paramsWithCitizenData: ParamsModal = {
    title: 'Suppression affiliation',
    subtitle: 'Êtes vous sûr de vouloir supprimer',
    firstName: { name: 'firstname', value: 'Bob' },
    lastName: { name: 'lastName', value: 'Harley' },
    email: { name: 'email', value: 'a@b.com' },
    birthdate: { name: 'birthdate', value: '01/01/1999' },
    submitBtn: {
      label: 'Valider',
      onClick: () => {},
    },
    cancelBtn: {
      label: 'Annuler',
      onClick: () => {},
    },
    rejectBtn: {
      label: 'Rejeter',
      onClick: () => {},
    },
  };
  test('renders children text', () => {
    const { container, getByText } = render(
      <ModalComponent
        params={paramsWithCitizenData}
        isShowModal
        closeModal={() => {}}
        data={'citizenId'}
      >
        {value}
      </ModalComponent>
    );
    expect(getByText(value)).toBeInTheDocument();
  });
});
