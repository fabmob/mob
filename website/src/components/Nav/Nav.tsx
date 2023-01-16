import React, { FC, useState } from 'react';

import { Link } from 'gatsby';
import Tippy from '@tippyjs/react';

import { useRoleAccepted, useGetFunder } from '@utils/keycloakUtils';
import { firstCharUpper } from '@utils/helpers';

import { Roles, FunderType } from '../../constants';
import { useSession } from '../../context';

import Strings from './locale/fr.json';

import './_nav.scss';

const CommonNav: FC<{ keycloak: Keycloak.KeycloakInstance }> = ({
  keycloak,
}) => {
  const { funderType } = useGetFunder();
  const isConnected = keycloak?.authenticated;
  const isSupervisor = useRoleAccepted(Roles.SUPERVISORS);
  const isManager = useRoleAccepted(Roles.MANAGERS);
  const isCitizen = useRoleAccepted(Roles.CITIZENS);
  const isFunder = isSupervisor || isManager;
  let showSearchValue = !isConnected;

  let showSearchValueAuth = (isConnected && isCitizen);

  return (
    <>
      {!isFunder && (
        <li className="mcm-nav__item">
          <Link id="nav-recherche" to="/comment-ca-marche">
            {Strings['nav.guide.user']}
          </Link>
        </li>
      )}

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

      {/* Displays a specific message if the user is connected */}
      {showSearchValue && !showSearchValueAuth && !isFunder && (
        <li className="mcm-nav__item">
          <Link id="nav-recherche" to="/recherche">
            {Strings['nav.search.value']}
          </Link>
        </li>
      )}


      {showSearchValueAuth && (
        <li className="mcm-nav__item">
          <Link id="nav-recherche" to="/recherche">
            {Strings['nav.search.value.authenticated']}
          </Link>
        </li>
      )}

    </>
  );
};

const MobileNav: FC<{
  keycloak: Keycloak.KeycloakInstance;
}> = ({ keycloak }) => {
  const logout = () => {
    keycloak.logout();
  };

  const { funderName } = useGetFunder();
  const isSupervisor = useRoleAccepted(Roles.SUPERVISORS);
  const isManager = useRoleAccepted(Roles.MANAGERS);
  const isFunder = isSupervisor || isManager;
  const isCitizen = useRoleAccepted(Roles.CITIZENS);

  return (
    <ul className="mcm-nav__list mcm-nav__mobile">
      <li
        className={`${keycloak?.authenticated ? 'mcm-nav__straighten' : ''
          } mcm-nav__item mcm-nav__item--accent`}
      >
        {keycloak?.authenticated && (
          <>
            <Link className="mcm-nav__arrow name-color cursor-pointer">
              {keycloak &&
                keycloak.tokenParsed &&
                firstCharUpper(keycloak.tokenParsed.name)}
            </Link>
            {funderName && (
              <div className="nav-sub-name-text">
                {firstCharUpper(funderName)}
              </div>
            )}
          </>
        )}
      </li>

      <CommonNav keycloak={keycloak} />

      {keycloak?.authenticated ? (
        <>
          {(isCitizen ||
            isFunder) && (
              <li className="mcm-mobile--profile mcm-nav__item">
                  <Link id="nav-mon-profile2" to="/mon-profil/">
                    {Strings['nav.profile.value']}
                  </Link>
              </li>
            )}
          <li className="mcm-mobile--profile mcm-nav__item">
            <Link id="nav-logout" to="#" onClick={() => logout()}>
              {Strings['nav.sign.out.value']}
            </Link>
          </li>
        </>
      ) : (
        <li className="mcm-nav__item mcm-nav__connect">
          <div
            id="nav-login"
            onClick={() =>
              keycloak.login({
                redirectUri: `${window.location.origin}/redirection/`,
              })
            }
          >
            {Strings['nav.sign.in.value']}
          </div>
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
  keycloak: Keycloak.KeycloakInstance;
}> = ({ keycloak }) => {
  const logout = () => {
    keycloak.logout();
  };

  const { funderName } = useGetFunder();
  const isSupervisor = useRoleAccepted(Roles.SUPERVISORS);
  const isManager = useRoleAccepted(Roles.MANAGERS);
  const isFunder = isSupervisor || isManager;
  const isCitizen = useRoleAccepted(Roles.CITIZENS);


  return (
    <ul className="mcm-nav__list mcm-nav__desktop">
      <CommonNav keycloak={keycloak} />

      <li
        className={`${keycloak?.authenticated ? 'mcm-nav__straighten' : ''
          } mcm-nav__item mcm-nav__item--accent`}
      >
        {keycloak?.authenticated ? (
          <>
            <Link className="mcm-nav__arrow name-color cursor-pointer">
              {keycloak &&
                keycloak.tokenParsed &&
                firstCharUpper(keycloak.tokenParsed.name)}
            </Link>
            {funderName && (
              <div className="nav-sub-name-text">
                {firstCharUpper(funderName)}
              </div>
            )}
            <ul className="mcm-nav__drop-down">
              {(isFunder || isCitizen) && (
                <li>
                    <Link id="nav-mon-profile2" to="/mon-profil/">
                      {Strings['nav.profile.value']}
                    </Link>
                </li>
              )}
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
  const { keycloak } = useSession();

  const [expanded, setExpanded] = useState<boolean>(false);
  const handleChange = (option: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = option.target as HTMLInputElement;
    setExpanded(checked);
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
        <MobileNav keycloak={keycloak!} />
        <DesktopNav keycloak={keycloak!} />
        <ul></ul>
      </div>
    </nav>
  );
};

export default Nav;
