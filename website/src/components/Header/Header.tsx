/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { FC, useEffect } from 'react';
import { Link } from 'gatsby';
import { useMatomo } from '@datapunt/matomo-tracker-react';

import SVG from '../SVG/SVG';
import Nav from '../Nav/Nav';

import Strings from './locale/fr.json';
import './_header.scss';

const AppLogo: FC = () => {
  return (
    <>
      <SVG
        icon="logo-mobile"
        width="115px"
        height="44px"
        className="mcm-logo"
      />
      <SVG
        icon="logo-baseline"
        width="115px"
        height="15px"
        className="mcm-logo-baseline"
      />
    </>
  );
};

const Header: FC = () => {
  /**
   * MATOMO
   *
   *
   *
   *
   */
  const { pushInstruction } = useMatomo();

  useEffect(() => {
    // To ensure heatmap and session recordings are completely disabled
    pushInstruction('HeatmapSessionRecording::disable');
  }, []);

  return (
    <header className="mcm-header">
      <div className="mcm-header__left">
        <a
          id="header-home-page"
          href="/"
          title={`← ${Strings['go.to.homepage']}`}
        >
          <AppLogo />
        </a>
      </div>
      <Nav />
    </header>
  );
};

export default Header;
