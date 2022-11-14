import React, { FC } from 'react';
import { Link } from 'gatsby';
import classNames from 'classnames';
import './_links-nav.scss';

export interface NavItems {
  label: string;
  path?: string /** Specified path to link to */;
  active?: boolean /** State of element on the nav */;
}

export interface StatusNavProps {
  navItems: NavItems[];
  getSelectedTab?: (
    label: string
  ) => void /** Callback function to pass current selected tab */;
}

/**
 * Generates a list of links from a object
 * @param navItems
 * @constructor
 */
const LinksNav: FC<StatusNavProps> = ({ navItems, getSelectedTab }) => {
  const renderNavItems = () =>
    navItems.map(({ label, path, active }, index) => {
      const uniqueKey = `nav-link-${index}`;
      const CSSClass = classNames('nav-links__item', {
        'nav-links__item--active': active,
      });

      /**
       * if a path is provided then navigate to another page
       * Otherwise, trigger onClick event to pass current selected item
       * */
      return path ? (
        <li key={uniqueKey} className={CSSClass}>
          <Link to={path}>{label}</Link>
        </li>
      ) : (
        <li
          key={uniqueKey}
          className={CSSClass}
          onClick={() => getSelectedTab?.(label)}
        >
          {label}
        </li>
      );
    });

  return (
    <nav className="mcm-links-nav">
      <ul className="nav-links">{renderNavItems()}</ul>
    </nav>
  );
};

export default LinksNav;
