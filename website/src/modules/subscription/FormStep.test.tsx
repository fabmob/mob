import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { renderHook } from '@testing-library/react-hooks';
import FormStep from './FormStep';

afterEach(cleanup);
describe('<FormStep />', () => {
  const { result } = renderHook(() =>
    useForm({
      defaultValues: {},
    })
  );

  const communities = [
    {
      id: '620a8af9712efa7444496084',
      name: 'SM-Communauté A',
      funderId: '1b53f61b-5148-42bd-add1-08607bd6a0e3',
    },
    {
      id: '620a8af9712efa7444496085',
      name: 'SM-Communauté B',
      funderId: '1b53f61b-5148-42bd-add1-08607bd6a0e3',
    },
  ];

  const specificFields = [
    {
      title: 'Champ text',
      inputFormat: 'Texte',
      name: 'champtext',
    },
    {
      title: 'champ date',
      inputFormat: 'Date',
      name: 'champdate',
    },
    {
      title: 'Champ numerique',
      inputFormat: 'Numerique',
      name: 'champnumerique',
    },
    {
      title: 'selection multiple',
      inputFormat: 'listeChoix',
      choiceList: {
        possibleChoicesNumber: 3,
        inputChoiceList: [
          {
            inputChoice: 'option 1',
          },
          {
            inputChoice: 'option 2',
          },
          {
            inputChoice: 'option 3',
          },
          {
            inputChoice: 'option 4',
          },
          {
            inputChoice: 'option 5',
          },
        ],
      },
      name: 'selectionmultiple',
    },
    {
      title: 'les couleurs',
      inputFormat: 'listeChoix',
      choiceList: {
        possibleChoicesNumber: 1,
        inputChoiceList: [
          {
            inputChoice: 'red',
          },
          {
            inputChoice: 'blue',
          },
          {
            inputChoice: 'black',
          },
          {
            inputChoice: 'yellow',
          },
          {
            inputChoice: 'turquoise',
          },
        ],
      },
      name: 'lescouleurs',
    },
  ];

  it('Should display the communities', () => {
    const { getByText } = render(
      <FormStep
        register={result.current.register}
        control={result.current.control}
        errors={{}}
        communities={communities}
      />
    );

    expect(getByText('Informations complémentaires')).toBeInTheDocument();
    expect(getByText("Votre communauté d'appartenance *")).toBeInTheDocument();
  });

  it('Should display with specificfields', () => {
    const { getByText } = render(
      <FormStep
        register={result.current.register}
        control={result.current.control}
        errors={{}}
        communities={communities}
        incentiveSpecificFields={specificFields}
      />
    );
    expect(getByText('les couleurs')).toBeInTheDocument();
  });
});
