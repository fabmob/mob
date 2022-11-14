import React, { FC } from 'react';

interface ImageProps {
  // filename : must match filename with extension in '../assets/images' folder, i.e. : 'girl-bike.jpg'
  filename?: string;
  // alt tag for image
  alt?: string;
  // fixed or fluid ? default fluid if undefined.
}

/**
 * Mock component for tests purposes.
 * @param filename
 * @param alt
 * @constructor
 */
const Image: FC<ImageProps> = ({ filename = 'no-image.svg', alt = '' }) => {
  return <img src={filename} alt={alt} />;
};

export default Image;
