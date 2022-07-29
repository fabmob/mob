import React from 'react';
import {
  cleanup,
  render,
  act,
  fireEvent,
  screen,
} from '@testing-library/react';
import SendFileStep from './SendFileStep';

const attachmentMetadata = [
  {
    fileName: 'file1',
  },
  {
    fileName: 'file2',
  },
  {
    fileName: 'file3',
  },
];

const attachment = ['justificatifDomicile', "bon d'achat"];

afterEach(cleanup);
describe('<SendFileStep />', () => {
  it('Should display justif bloc & metadata', () => {
    const { getByText } = render(
      <SendFileStep
        attachmentMetadata={attachmentMetadata}
        attachments={attachment}
        getAttachment={() => jest.fn()}
      />
    );

    expect(
      getByText('Récapitulatif des justificatifs demandés')
    ).toBeInTheDocument();
    expect(
      getByText('Justificatif de domicile de moins de 3 mois')
    ).toBeInTheDocument();
    expect(
      getByText(
        'Vos justificatifs déjà transmis depuis votre application Mobilité'
      )
    ).toBeInTheDocument();
    expect(getByText("bon d'achat")).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByText('Ajouter un document'));
    });

    expect(getByText('Ajouter des documents')).toBeInTheDocument();
  });

  it('Should display justif bloc', () => {
    const { getByText } = render(
      <SendFileStep
        attachmentMetadata={[]}
        attachments={attachment}
        getAttachment={() => jest.fn()}
      />
    );

    expect(
      getByText('Récapitulatif des justificatifs demandés')
    ).toBeInTheDocument();
    expect(
      getByText('Justificatif de domicile de moins de 3 mois')
    ).toBeInTheDocument();
  });

  it('Should display metadata', () => {
    const { getByText } = render(
      <SendFileStep
        attachmentMetadata={attachmentMetadata}
        attachments={[]}
        getAttachment={() => jest.fn()}
      />
    );

    expect(
      getByText(
        'Vos justificatifs déjà transmis depuis votre application Mobilité'
      )
    ).toBeInTheDocument();
    expect(getByText('file1')).toBeInTheDocument();
  });
});
