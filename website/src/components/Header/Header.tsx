/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { FC } from 'react';
import { Link } from 'gatsby';

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
  return (
    <header className="mcm-header">
      <div className="mcm-header__left">
        <Link
          id="header-home-page"
          to="/"
          title={`← ${Strings['go.to.homepage']}`}
        >
          <AppLogo />
        </Link>
      </div>
      <Nav />
    </header>
  );
};

export default Header;
