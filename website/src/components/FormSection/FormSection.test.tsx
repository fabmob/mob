import React from 'react';
import { render } from '@testing-library/react';
import FormSection from './FormSection';

describe('<FormSection />', () => {
  test('Div with correct className', () => {
    // with largeSpacing = false
    const { getByText, rerender } = render(
      <FormSection sectionName="Mon identité" />
    );
    const legend = getByText('Mon identité');

    expect(legend.closest('fieldset')).toHaveAttribute('class', 'fieldset');

    // with largeSpacing = true
    rerender(<FormSection sectionName="Mon identité" largeSpacing />);
    expect(legend.closest('fieldset')).toHaveAttribute(
      'class',
      'fieldset fieldset--large-spacing'
    );
  });

  test('FormSection renders with correct text', () => {
    const { queryByText, queryByTestId, rerender } = render(
      <FormSection sectionName="Mon identité" />
    );

    // text with no tooltip
    expect(queryByText('Mon identité')).toBeTruthy();
    expect(queryByTestId('svg-icon')).not.toBeInTheDocument();

    // text with tooltip
    rerender(
      <FormSection
        sectionName="Mon identité"
        tooltip="Renseignez les informations suivantes !"
      />
    );

    expect(queryByText('Mon identité')).toBeTruthy();
    expect(queryByTestId('svg-icon')).toBeInTheDocument();
  });

  test('Display correct children', () => {
    const { getByText } = render(
      <FormSection sectionName="Mon identité">
        <h1>Hello world !</h1>
      </FormSection>
    );
    const containerMain = getByText('Hello world !');

    expect(containerMain).toHaveTextContent('Hello world !');
    expect(containerMain.nodeName).toBe('H1');
  });
});
