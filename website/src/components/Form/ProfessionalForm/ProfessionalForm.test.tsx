import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useForm } from 'react-hook-form';
import { renderHook } from '@testing-library/react-hooks';

import ProfessionalForm from './ProfessionalForm';

const companyOptionsMock = [
  {
    id: 'd3fc12be-1f90-49da-9fb4-f6f7af6eea44',
    value: 'Atos',
    label: 'Atos',
    formats: ['@atos.com'],
  },
  {
    id: '33f3a463-4b2f-42ab-a183-d5bd9e2007a0',
    value: 'Capgemini',
    label: 'Capgemini',
    formats: ['@capgemini.com'],
  },
];

describe('ProfessionalForm Component', () => {
  test('ProfessionalForm component renders with correct placeholder', () => {
    const { result } = renderHook(() =>
      useForm({
        defaultValues: {
          enterpriseId: null,
          companyNotFound: false,
          enterpriseEmail: null,
          hasNoEnterpriseEmail: false,
        },
      })
    );

    const { getByText } = render(
      <ProfessionalForm
        register={result.current.register}
        control={result.current.control}
        errors={{}}
        companyOptions={companyOptionsMock}
        watch={result.current.watch}
      />
    );

    expect(getByText('Renseignez votre entreprise')).toBeInTheDocument();
    expect(
      getByText("Je ne trouve pas mon entreprise / Je n'ai pas d'entreprise")
    ).toBeInTheDocument();
    expect(getByText('Adresse email professionnelle')).toBeInTheDocument();
    expect(getByText("Je n'ai pas d'email professionnel")).toBeInTheDocument();
  });
});
