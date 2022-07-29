import React from 'react';
import { render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import VideoPlayer from './VideoPlayer';

jest.mock('react-player');
describe('<VideoPlayer />', () => {
  test('Display correct children with good button and correct className when video not playing', () => {
    const { container, getByText, queryByText } = render(
      <VideoPlayer homePage>
        <h1>Hello world !</h1>
      </VideoPlayer>
    );
    const containerMain = getByText('Hello world !');
    expect(containerMain).toHaveTextContent('Hello world !');
    expect(containerMain.nodeName).toBe('H1');
    expect(queryByText('Lire la vidéo')).toBeTruthy();
    expect(container.firstChild).toHaveClass('mcm-video');
  });
  test('Div with correct className when video playing', () => {
    const { container, getByText } = render(
      <VideoPlayer homePage>
        <h1>Hello world !</h1>
      </VideoPlayer>
    );

    fireEvent.click(getByText('Lire la vidéo'));

    expect(container.firstChild).toHaveClass('mcm-video--play');
  });

  test('Display no children with good button and correct className when video playing', async () => {
    const { container, queryByText, getByTestId } = render(<VideoPlayer />);

    fireEvent.click(getByTestId('button'));

    expect(queryByText('Lire la vidéo')).toBeFalsy();
    expect(container.firstChild).toHaveClass('mcm-video--play');
  });
});
