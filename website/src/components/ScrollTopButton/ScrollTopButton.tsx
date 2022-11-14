import React, { FC, useEffect, useState } from 'react';
import classNames from 'classnames';
import './_scroll-top-button.scss';
import SVG from '../SVG/SVG';

interface ScrollTopButtonProps {
  yOffset?: number; // Minimum offset value from where the button is shown. Default 400.
  scrollTo?: number; // Value to scroll to. Default 0 (top of the page).
  behavior?: 'smooth' | 'auto'; // scroll behaviour. Default "smooth".
}

const ScrollTopButton: FC<ScrollTopButtonProps> = ({
  yOffset = 400,
  scrollTo = 0,
  behavior = 'smooth',
}) => {
  const [showScroll, setShowScroll] = useState(false);

  const scrollTop = () => {
    window.scrollTo({ top: scrollTo, behavior });
  };

  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.pageYOffset > yOffset) {
        setShowScroll(true);
      } else if (showScroll && window.pageYOffset <= yOffset) {
        setShowScroll(false);
      }
    };

    window.addEventListener('scroll', checkScrollTop);

    return () => {
      window.removeEventListener('scroll', checkScrollTop);
    };
  }, [showScroll, yOffset, scrollTo, behavior]);

  const CSSClass = classNames('scroll-top-button', {
    'scroll-top-button--is-visible': showScroll,
  });

  return (
    <button
      type="button"
      onClick={scrollTop}
      aria-label="Return to top"
      className={CSSClass}
    >
      <SVG icon="triangle-up" />
    </button>
  );
};

export default ScrollTopButton;
