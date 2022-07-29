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
  };
  return Fields;
});

const mockEmptyFields = {};

const mockIncentiveFields = jest.fn().mockImplementation(() => {
  const incentiveFields = [
    { title: 'prix', inputFormat: 'Texte', name: 'prix' },
    { title: 'date 2', inputFormat: 'Date', name: 'date2' },
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
