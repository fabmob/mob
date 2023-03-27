import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import DocumentBloc from './DocumentBloc';

describe('DocumentBloc', () => {
  it('should render name and delete button', () => {
    const name = 'example file';
    const deleteFile = jest.fn();
    const index = 0;
    const { getByText } = render(
      <DocumentBloc
        name={name}
        deleteFile={deleteFile}
        index={index}
        withAddedDoc={true}
      />
    );

    expect(getByText('Document ajouté')).toBeInTheDocument();
    const nameElement = getByText(name);
    expect(nameElement).toBeInTheDocument();
    const deleteButton = getByText('Supprimer');
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton);
    expect(deleteFile).toHaveBeenCalledWith(index);
  });
});
