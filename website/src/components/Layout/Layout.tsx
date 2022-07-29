import React, { FC } from 'react';

import classNames from 'classnames';

import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Toast from '../Toast/Toast';

import './_layout.scss';

/**
 * INTERFACES
 *
 *
 *
 *
 */
interface LayoutProps {
  className?: string;
  fullWidth?: boolean;
  footer?: {
    imageFilename: string;
    isVisibleOnMobile?: boolean;
  };
}

const Layout: FC<LayoutProps> = ({
  className,
  children,
  fullWidth = false,
  footer = { imageFilename: '', isVisibleOnMobile: true },
}) => {
  /**
   * Set the css class for the container
   */
  const CSSClass = classNames('mcm-container__main', className, {
    'mcm-container__main--fw': fullWidth,
  });

  return (
    <div className="mcm-container">
      <Toast />
      <Header />
      <div className={CSSClass}>{children}</div>
      <Footer
        imageFilename={footer.imageFilename}
        isVisibleOnMobile={!!footer.isVisibleOnMobile}
      />
    </div>
  );
};

export default Layout;
