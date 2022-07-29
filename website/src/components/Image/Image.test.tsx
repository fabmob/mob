import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PureImage, Image } from './Image';

// mock graphQL query result
const images = {
  data: {
    edges: [
      {
        node: {
          relativePath: 'girl-bike.jpg',
          childImageSharp: {
            fluid: {
              base64: '',
              aspectRatio: 0.8695652173913043,
              src:
                '/static/10418ad3b377ad00b06baa28eaf01a97/e90d7/girl-bike.jpg',
              srcSet:
                '/static/10418ad3b377ad00b06baa28eaf01a97/fd013/girl-bike.jpg 200w,\n/static/10418ad3b377ad00b06baa28eaf01a97/25252/girl-bike.jpg 400w,\n/static/10418ad3b377ad00b06baa28eaf01a97/e90d7/girl-bike.jpg 508w',
              sizes: '(max-width: 508px) 100vw, 508px',
            },
            fixed: {
              base64: '',
              width: 450,
              height: 450,
              src:
                '/static/10418ad3b377ad00b06baa28eaf01a97/442db/girl-bike.jpg',
              srcSet:
                '/static/10418ad3b377ad00b06baa28eaf01a97/442db/girl-bike.jpg 1x',
            },
          },
          extension: 'jpg',
          publicURL:
            '/static/10418ad3b377ad00b06baa28eaf01a97/442db/girl-bike.jpg',
        },
      },
      {
        node: {
          relativePath: 'girl-smiling.jpg',
          childImageSharp: {
            fluid: {
              base64: '',
              aspectRatio: 0.8695652173913043,
              src:
                '/static/bf3bc614ef4005bdfe4f7e168e8cfe0c/e90d7/girl-smiling.jpg',
              srcSet:
                '/static/bf3bc614ef4005bdfe4f7e168e8cfe0c/fd013/girl-smiling.jpg 200w,\n/static/bf3bc614ef4005bdfe4f7e168e8cfe0c/25252/girl-smiling.jpg 400w,\n/static/bf3bc614ef4005bdfe4f7e168e8cfe0c/e90d7/girl-smiling.jpg 508w',
              sizes: '(max-width: 508px) 100vw, 508px',
            },
            fixed: {
              base64: '',
              width: 450,
              height: 450,
              src:
                '/static/bf3bc614ef4005bdfe4f7e168e8cfe0c/442db/girl-smiling.jpg',
              srcSet:
                '/static/bf3bc614ef4005bdfe4f7e168e8cfe0c/442db/girl-smiling.jpg 1x',
            },
          },
          extension: 'jpg',
          publicURL:
            '/static/bf3bc614ef4005bdfe4f7e168e8cfe0c/442db/girl-smiling.jpg',
        },
      },
      {
        node: {
          relativePath: 'tramway.jpg',
          childImageSharp: {
            fluid: {
              base64: '',
              aspectRatio: 0.8695652173913043,
              src: '/static/13b4b3ffd8b53e8a095f398cb325ed75/e90d7/tramway.jpg',
              srcSet:
                '/static/13b4b3ffd8b53e8a095f398cb325ed75/fd013/tramway.jpg 200w,\n/static/13b4b3ffd8b53e8a095f398cb325ed75/25252/tramway.jpg 400w,\n/static/13b4b3ffd8b53e8a095f398cb325ed75/e90d7/tramway.jpg 508w',
              sizes: '(max-width: 508px) 100vw, 508px',
            },
            fixed: {
              base64: '',
              width: 450,
              height: 450,
              src: '/static/13b4b3ffd8b53e8a095f398cb325ed75/442db/tramway.jpg',
              srcSet:
                '/static/13b4b3ffd8b53e8a095f398cb325ed75/442db/tramway.jpg 1x',
            },
          },
          extension: 'jpg',
          publicURL:
            '/static/13b4b3ffd8b53e8a095f398cb325ed75/442db/tramway.jpg',
        },
      },
    ],
  },
};

describe('Image component', () => {
  it('should render properly with passed alt text', () => {
    const { getByAltText } = render(
      <PureImage filename="tramway.jpg" images={images} alt="test-image" />
    );
    expect(getByAltText('test-image')).toHaveAttribute('alt', 'test-image');
  });

  it('should render the correct image', () => {
    const { baseElement } = render(
      <PureImage filename="tramway.jpg" images={images} alt="test-image" />
    );
    const image: HTMLImageElement = baseElement.querySelector(
      'picture img'
    ) as HTMLImageElement;
    expect(image.src).toContain('tramway.jpg');
  });

  it('should render properly on fixed if prop is true', () => {
    const { getByAltText } = render(
      <PureImage filename="tramway.jpg" images={images} alt="test-image" />
    );
    expect(getByAltText('test-image')).toHaveAttribute('alt', 'test-image');
  });
});
