import React, { FC } from 'react';
import { Link } from 'gatsby';
import classNames from 'classnames';
import './_links-nav.scss';

interface NavItems {
  label: string;
  path: string;
  active?: boolean;
}

interface StatusNavProps {
  navItems: NavItems[];
}

/**
 * Generates a list of links from a object
 * @param navItems
 * @constructor
 */
const LinksNav: FC<StatusNavProps> = ({ navItems }) => {
  return (
    <nav className="mcm-links-nav">
      <ul className="nav-links">
        {navItems.map(({ label, path, active }, index) => {
          const uniqueKey = `nav-link-${index}`;
          const CSSClass = classNames('nav-links__item', {
            'nav-links__item--active': active,
          });
          return (
            <li key={uniqueKey} className={CSSClass}>
              <Link to={path}>{label}</Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default LinksNav;
