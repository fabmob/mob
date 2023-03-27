import React from 'react';
import { render } from '@testing-library/react';
import Card from './Card';
import { RenderTags } from './Card';

jest.mock('../Image/Image.tsx');

describe('Card component', () => {
  it('should render correctly with required props', () => {
    const { getByText } = render(
      <Card title="Title of card" tags={['Tag 1']} href="/slug" />
    );
    expect(getByText('Title of card').closest('.mcm-card')).toBeInTheDocument();
    expect(getByText('Title of card').closest('a')).toHaveAttribute(
      'href',
      '/slug'
    );
  });

  it('Should display the tags passed', () => {
    const { getByText, rerender } = render(
      <Card title="Title of card" tags={['Tag 1']} href="#" />
    );
    expect(getByText('Tag 1')).toBeInTheDocument();

    rerender(<Card title="Title of card" tags={['Tag 1', 'Tag 2']} href="#" />);
    expect(getByText('Tag 1')).toBeInTheDocument();
    expect(getByText('Tag 2')).toBeInTheDocument();
  });

  it('Should display the value passed', () => {
    const { getByText } = render(
      <Card title="Title of card" tags={['Tag 1']} value="500" href="#" />
    );
    expect(getByText('500')).toBeInTheDocument();
  });

  it('Should display the element passed in footerElement prop and not display tags', () => {
    const { getByText } = render(
      <Card
        theId="toto"
        title="Title of card"
        footerElement={<p>Hello</p>}
        href="#"
        tags={[]}
      />
    );
    expect(getByText('Hello')).toBeInTheDocument();
    expect(document.querySelector('.card-body-tags')).toBeEmptyDOMElement();
  });

  it('Should display the tags elements', () => {
    const { getByTestId } = render(<RenderTags tags={['Tag 1']} />);
    expect(getByTestId('tagComponent')).toBeInTheDocument();
  });

  it('Should display the element passed in valueElement prop and not display tags', () => {
    const { getByText } = render(
      <Card
        theId="toto"
        title="Title of card"
        valueElement={<p>Hello</p>}
        href="#"
        tags={[]}
      />
    );
    expect(getByText('Hello')).toBeInTheDocument();
    expect(document.querySelector('.card-body-tags')).toBeEmptyDOMElement();
  });
});
