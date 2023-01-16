import { cleanup, render } from '@testing-library/react';
import React from 'react';
import SubscriptionSummary from './SubscriptionSummary';

const mockSpecificFields = jest.fn().mockImplementation(() => {
  const Fields = {
    community: 'Mulhouse-Communauté A',
    choixmultiple: [
      { id: 1, label: 'champ 2', value: 'champ 2' },
      { id: 1, label: 'champ 2', value: 'champ 2' },
    ],
    prix: '230',
    date2: '23/09/2022',
    consent: true,
    champstextoptionnel: '',
    champsnumberoptionnel: '',
    dateoptionnel: undefined,
    multichoixoptionnel: [],
  };
  return Fields;
});

const mockEmptyFields = {};

const mockIncentiveFields = jest.fn().mockImplementation(() => {
  const incentiveFields = [
    {
      title: 'prix',
      inputFormat: 'Texte',
      name: 'prix',
      isRequired: true,
    },
    {
      title: 'Champs text optionnel',
      inputFormat: 'Texte',
      isRequired: false,
      name: 'champstextoptionnel',
    },
    {
      title: 'date 2',
      inputFormat: 'Date',
      name: 'date2',
      isRequired: true,
    },
    {
      title: 'Champs Number optionnel',
      inputFormat: 'Numerique',
      isRequired: false,
      name: 'champsnumberoptionnel',
    },
    {
      title: 'Date optionnel',
      inputFormat: 'Date',
      isRequired: false,
      name: 'dateoptionnel',
    },
    {
      title: 'choix multiple',
      inputFormat: 'listeChoix',
      choiceList: {
        inputChoiceList: [
          { inputChoice: 'champ 2' },
          { inputChoice: 'champ 2' },
        ],
        possibleChoicesNumber: 1,
      },
      name: 'choixmultiple',
      isRequired: true,
    },
    {
      title: 'multichoix optionnel',
      inputFormat: 'listeChoix',
      isRequired: false,
      choiceList: {
        possibleChoicesNumber: 1,
        inputChoiceList: [
          {
            inputChoice: 'choix 1',
          },
          {
            inputChoice: 'choix 2',
          },
          {
            inputChoice: 'choix 3',
          },
        ],
      },
      name: 'multichoixoptionnel',
    },
  ];
  return incentiveFields;
});

const mockImportedFiles = [
  {
    path: 'file.png',
    name: 'file.png',
  },
  {
    path: 'file.jpeg',
    name: 'file.png',
  },
];

const mockAttachmentMetadata = [
  {
    fileName: 'file.pdf',
  },
  {
    fileName: 'file.pdf',
  },
  {
    fileName: 'file.pdf',
  },
];

afterEach(() => {
  jest.restoreAllMocks();
});

describe('<SubscriptionSummary />', () => {
  test('It Should render SubscriptionSummary with props', async () => {
    render(
      <SubscriptionSummary
        incentiveSpecificFields={mockIncentiveFields()}
        specificFields={mockSpecificFields()}
        importedFiles={mockImportedFiles}
        attachmentMetadata={mockAttachmentMetadata}
      ></SubscriptionSummary>
    );
  });

  test('It Should render SubscriptionSummary without files', async () => {
    render(
      <SubscriptionSummary
        incentiveSpecificFields={mockIncentiveFields()}
        specificFields={mockSpecificFields()}
      ></SubscriptionSummary>
    );
  });

  test('It Should render SubscriptionSummary without specificFields', async () => {
    render(
      <SubscriptionSummary
        incentiveSpecificFields={mockIncentiveFields()}
        specificFields={mockEmptyFields}
      ></SubscriptionSummary>
    );
  });
});
