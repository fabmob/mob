import React, { FC, useState } from 'react';
import { Link } from 'gatsby';
import { useKeycloak } from '@react-keycloak/web';
import { useRoleAccepted, useGetFunder } from '@utils/keycloakUtils';

import Tippy from '@tippyjs/react';

import { Roles, FunderType } from '../../constants';

import Strings from './locale/fr.json';

import './_nav.scss';

const CommonNav: FC<{ keycloak: any }> = ({ keycloak }) => {
  const { funderType } = useGetFunder();
  const isConnected = keycloak?.authenticated;
  const isSupervisor = useRoleAccepted(Roles.SUPERVISORS);
  const isManager = useRoleAccepted(Roles.MANAGERS);
  const isFunder = isSupervisor || isManager;

  return (
    <>
      {isConnected && (
        <li className="mcm-nav__item">
          <Link id="nav-dashbord" to="/mon-dashboard">
            {Strings['nav.dashboard.value']}
          </Link>
        </li>
      )}
      {isFunder && (
        <>
          {funderType === FunderType.ENTERPRISES && (
            <li className="mcm-nav__item">
              <Link id="nav-gerer-salaries" to="/gerer-salaries">
                {Strings['nav.gestion.salarie.dashboard.value']}
              </Link>
            </li>
          )}
          {funderType === FunderType.COLLECTIVITIES && (
            <li className="mcm-nav__item">
              <Link id="nav-gerer-citoyens" to="/gerer-citoyens">
                {Strings['nav.manage.citizens.dashboard.value']}
              </Link>
            </li>
          )}
          <li className="mcm-nav__item">
            {isManager ? (
              <Link id="nav-admin-demandes" to="/administrer-demandes">
                {Strings['nav.management.dashboard.value']}
              </Link>
            ) : (
              <Tippy
                content={Strings['common.restriction.supervisor.tip']}
                className="form-tooltip"
                trigger="mouseenter focus"
                aria={{ content: 'describedby' }}
                maxWidth={330}
                placement="top"
                offset={[0, 16]}
              >
                <Link to="#">{Strings['nav.management.dashboard.value']}</Link>
              </Tippy>
            )}
          </li>
        </>
      )}
      {/* Non connected user */}
      {!isFunder && (
        <li className="mcm-nav__item">
          <Link id="nav-recherche" to="/recherche">
            {Strings['nav.search.value']}
          </Link>
        </li>
      )}
    </>
  );
};

const MobileNav: FC<{
  keycloak: any;
}> = ({ keycloak }) => {
  const logout = () => {
    keycloak.logout();
  };

  const { funderName } = useGetFunder();

  return (
    <ul className="mcm-nav__list mcm-nav__mobile">
      <li
        className={`${
          keycloak?.authenticated ? 'mcm-nav__straighten' : ''
        } mcm-nav__item mcm-nav__item--accent`}
      >
        {keycloak?.authenticated && (
          <>
            <Link className="mcm-nav__arrow name-color" to="#">
              {keycloak && keycloak.tokenParsed && keycloak.tokenParsed.name}
            </Link>
            {funderName && (
              <div className="nav-sub-name-text">{funderName}</div>
            )}
          </>
        )}
      </li>

      <CommonNav keycloak={keycloak} />

      {keycloak?.authenticated ? (
        <>
          <li className="mcm-mobile--profile mcm-nav__item">
            <Link id="nav-mon-profile" to="/mon-profil/">
              {Strings['nav.profile.value']}
            </Link>
          </li>
          <li className="mcm-mobile--profile mcm-nav__item">
            <Link id="nav-logout" to="#" onClick={() => logout()}>
              {Strings['nav.sign.out.value']}
            </Link>
          </li>
        </>
      ) : (
        <li className="mcm-nav__item mcm-nav__connect">
          <a
            id="nav-login"
            onClick={() =>
              keycloak.login({
                redirectUri: `${window.location.origin}/redirection/`,
              })
            }
          >
            {Strings['nav.sign.in.value']}
          </a>
        </li>
      )}

      {/* Sub-menu mobile version */}
      <ul className="mcm-mobile-sub-nav">
        <li className="mcm-mobile-sub-nav__item">
          {' '}
          <Link id="nav-contact" to="/contact">
            {Strings['nav.contact.us.value']}
          </Link>
        </li>
        <li className="mcm-mobile-sub-nav__item">{Strings['nav.faq.value']}</li>
        <li className="mcm-mobile-sub-nav__item">
          <a
            id="nav-linkedin"
            href="https://www.linkedin.com/showcase/mon-compte-mobilit%C3%A9/"
            target="_blank"
            rel="noreferrer"
          >
            {Strings['nav.contact.linkedin.value']}
          </a>
        </li>
      </ul>
    </ul>
  );
};

const DesktopNav: FC<{
  keycloak: any;
}> = ({ keycloak }) => {
  const logout = () => {
    keycloak.logout();
  };

  const { funderName } = useGetFunder();

  return (
    <ul className="mcm-nav__list mcm-nav__desktop">
      <CommonNav keycloak={keycloak} />

      <li
        className={`${
          keycloak?.authenticated ? 'mcm-nav__straighten' : ''
        } mcm-nav__item mcm-nav__item--accent`}
      >
        {keycloak?.authenticated ? (
          <>
            <Link className="mcm-nav__arrow name-color" to="#">
              {keycloak && keycloak.tokenParsed && keycloak.tokenParsed.name}
            </Link>
            {funderName && (
              <div className="nav-sub-name-text">{funderName}</div>
            )}
            <ul className="mcm-nav__drop-down">
              <li>
                <Link id="nav-mon-profile2" to="/mon-profil/">
                  {Strings['nav.profile.value']}
                </Link>
              </li>
              <li>
                <Link id="nav-logout2" to="#" onClick={() => logout()}>
                  {Strings['nav.sign.out.value']}
                </Link>
              </li>
            </ul>
          </>
        ) : (
          <div
            id="nav-login2"
            className="mcm-nav__connect"
            onClick={() =>
              keycloak.login({
                redirectUri: `${window.location.origin}/redirection/`,
              })
            }
          >
            {Strings['nav.sign.in.value']}
          </div>
        )}
      </li>
    </ul>
  );
};

const Nav: FC = () => {
  const { keycloak } = useKeycloak();

  const [expanded, setExpanded] = useState<boolean>(false);
  const handleChange = (option: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = option.target as HTMLInputElement;
    setExpanded(checked as boolean);
  };

  return (
    <nav role="navigation" aria-label="Menu principal">
      <input
        type="checkbox"
        id="burger-checkbox"
        className="mcm-burger__checkbox"
        onChange={handleChange}
        defaultChecked={false}
      />
      <label htmlFor="burger-checkbox" className="mcm-burger">
        <button
          id="burger"
          className="mcm-burger__button noprint"
          type="button"
          aria-label="Afficher ou masquer la navigation"
          aria-controls="menu"
          aria-haspopup="true"
          aria-expanded={expanded}
          tabIndex={0}
        >
          <i />
        </button>
      </label>
      <div className="mcm-nav">
        <MobileNav keycloak={keycloak} />
        <DesktopNav keycloak={keycloak} />
        <ul></ul>
      </div>
    </nav>
  );
};

export default Nav;
