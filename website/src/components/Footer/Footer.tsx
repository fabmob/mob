import React, { FC } from 'react';
import { Link } from 'gatsby';
import classNames from 'classnames';
import './_footer.scss';
import Tippy from '@tippyjs/react';
import mobLogo from '../../assets/svg/mob-footer.svg';
import Image from '../Image/Image';

import Strings from './locale/fr.json';

interface FooterProps {
  imageFilename?: string;
  isVisibleOnMobile: boolean;
}

const Footer: FC<FooterProps> = ({ imageFilename, isVisibleOnMobile }) => {
  const footerClass = classNames('mcm-footer', {
    'mcm-footer--with-image': imageFilename,
    'mcm-footer--with-image-mobile': isVisibleOnMobile,
  });
  const version = `${process.env.PACKAGE_VERSION || '1.0.0'}`;
  return (
    <footer className={footerClass}>
      {imageFilename && (
        <div className="footer-image">
          <div className="footer-image__wrapper">
            <Image filename={imageFilename} />
          </div>
        </div>
      )}
      <div className="mcm-container__main">
        <div className="mcm-footer-logo">
          <img src={mobLogo} alt="" />
        </div>
        <div className="mcm-footer-links">
          <input id="legalLinks" name="legalLinks" type="checkbox" />
          <label htmlFor="legalLinks" className="mcm-footer-links__title">
            {Strings['legal.information']}
          </label>
          <ul>
            <li>
              <Link to="/mentions-legales-cgu">{Strings['legal.notice']}</Link>
            </li>
            <li>
              <Link to="/politique-gestion-cookies">
                {Strings['cookie.policy.and.management']}
              </Link>
            </li>
            <li>
              <Link
                id="footer-donnees-perso"
                to="/charte-protection-donnees-personnelles"
              >
                {Strings['privacy.policy']}
              </Link>
            </li>
            <li>
              <Tippy
                content={version}
                placement="left"
                className="version-tooltip"
                trigger="click"
                aria={{ content: 'describedby' }}
                maxWidth={330}
                arrow={false}
              >
                <p>{Strings['app.version']}</p>
              </Tippy>
            </li>
          </ul>
        </div>
        <div className="mcm-footer-links">
          <input id="helpLinks" name="helpLinks" type="checkbox" />
          <label htmlFor="helpLinks" className="mcm-footer-links__title">
            {Strings['helps.accessibility']}
          </label>
          <ul>
            <li>
              <Link id="footer-contact" to="/contact">
                {Strings['contact.us']}
              </Link>
            </li>
            <li>
              <a
                id="footer-linkedin"
                href="https://www.linkedin.com/showcase/mon-compte-mobilit%C3%A9/"
                target="_blank"
                rel="noreferrer"
              >
                Linkedin
              </a>
            </li>
            <li>
              <Link id="footer-contact" to="/faq">
              {Strings['faq']}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
