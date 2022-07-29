import React, { FC, ReactNode } from 'react';
import classNames from 'classnames';
import Image from '../Image/Image';

interface SectionWithImageProps {
  children?: ReactNode;
  className?: string;
  imgFilename: string;
  imageLeft?: boolean;
}

/**
 * Renders an illustrated section, composed of an image (added from filename) + body (passed as children)
 * @param className
 * @param imgFilename
 * @param imageLeft : default false, if true, image will be on the left.
 * @param children
 * @constructor
 */
const SectionWithImage: FC<SectionWithImageProps> = ({
  className,
  children,
  imgFilename,
  imageLeft = false,
}) => {
  const sectionClass = classNames(
    'mcm-section-with-image',
    {
      'mcm-section-with-image--image-left': imageLeft,
    },
    className
  );
  return (
    <div className={sectionClass}>
      <div className="mcm-section-with-image__image">
        <div className="img-wrapper">
          <Image filename={imgFilename} />
        </div>
      </div>
      <div className="mcm-section-with-image__body">{children}</div>
    </div>
  );
};

export default SectionWithImage;
