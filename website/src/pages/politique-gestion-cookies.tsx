import React, { FC } from 'react';
import { Link } from 'gatsby';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';
import Layout from '../components/Layout/Layout';
import ScrollTopButton from '../components/ScrollTopButton/ScrollTopButton';
import Strings from './locale/fr.json';

interface CookiesInfosProps {
  pageContext: { breadcrumb: { crumbs: string } };
}

const CookiesInfos: FC<CookiesInfosProps> = ({ pageContext }) => {
  const {
    breadcrumb: { crumbs },
  } = pageContext;

  return (
    <Layout>
      <Breadcrumb crumbs={crumbs} crumbSeparator=" > " />
      <div className="mcm-informations-text mcm-cookies-infos o-bg-wrapper">
        <h1 className="mb-s">{Strings['politique.cookies.title']}</h1>

        <p>
          {Strings['politique.cookies.introduction']}
        </p>

        <h2>{Strings['politique.cookies.part1.title']}</h2>
        <p>
          {' '}
          {Strings['politique.cookies.part1.paragraphe1']}
        </p>

        <h2>{Strings['politique.cookies.part2.title']}</h2>
        <p>
          {Strings['politique.cookies.part2.paragraphe1']}
        </p>

        <h2>{Strings['politique.cookies.part3.title']}</h2>
        <p>
          {Strings['politique.cookies.part3.paragraphe1']}
        </p>

        <p className="sub-title">
          {Strings['politique.cookies.part3.paragraphe2']}
        </p>

        <p>
          {Strings['politique.cookies.part3.paragraphe3.line1']}<br></br>
          {Strings['politique.cookies.part3.paragraphe3.line2']}
        </p>

        <p className="sub-title">
          {Strings['politique.cookies.part3.paragraphe4']}
        </p>

        <p>
          {Strings['politique.cookies.part3.paragraphe5.line1']}<br></br>
          {Strings['politique.cookies.part3.paragraphe5.line2']}<br></br>
          {Strings['politique.cookies.part3.paragraphe5.line3']}
        </p>

        <h2>{Strings['politique.cookies.part4.title']}</h2>
        <p>
          {Strings['politique.cookies.part4.paragraphe1']}
        </p>
        <p>
          {Strings['politique.cookies.part4.paragraphe2']}
        </p>

        <h2>{Strings['politique.cookies.part5.title']}</h2>
        <p>{Strings['politique.cookies.part5.paragraphe1']}</p>

        <p className="sub-title">{Strings['politique.cookies.part5.paragraphe2']}</p>
        <table className="cookies-table">
          <thead>
            <tr>
              <td>{Strings['politique.cookies.part5.table.title1']}</td>
              <td>{Strings['politique.cookies.part5.table.title2']}</td>
              <td>{Strings['politique.cookies.part5.table.title3']}</td>
              <td>{Strings['politique.cookies.part5.table.title4']}</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>KC_RESTART</td>
              <td>idp</td>
              <td>
                This is an an encoded token that is stored as a cookie so that
                if there is a client timeout, then the authentication session
                can be restarted.
              </td>
              <td>Session</td>
            </tr>
            <tr>
              <td>AUTH_SESSION_ID_LEGACY</td>
              <td>idp</td>
              <td></td>
              <td>Session</td>
            </tr>
            <tr>
              <td>AUTH_SESSION_ID</td>
              <td>idp</td>
              <td>
                Optionally sets the browser authentication session cookie
                AUTH_SESSION_ID with the ID of the new session.
              </td>
              <td>Session</td>
            </tr>
            <tr>
              <td>KEYCLOAK_IDENTITY_LEGACY</td>
              <td>idp</td>
              <td></td>
              <td>Session</td>
            </tr>
            <tr>
              <td>KEYCLOAK_IDENTITY</td>
              <td>idp</td>
              <td></td>
              <td>Session</td>
            </tr>
            <tr>
              <td>KEYCLOAK_SESSION</td>
              <td>idp</td>
              <td></td>
              <td>9h</td>
            </tr>
            <tr>
              <td>KEYCLOAK_SESSION_LEGACY</td>
              <td>idp</td>
              <td></td>
              <td>9h</td>
            </tr>
            <tr>
              <td>Local storage</td>
              <td>N/A</td>
              <td>
                netlify-cms.entries.viewStyle <br></br>
                netlify-cms-user
              </td>
              <td>Local storage</td>
            </tr>
            <tr>
              <td>Indexed DB</td>
              <td>N/A</td>
              <td>localforage</td>
              <td>N/A</td>
            </tr>
            <tr>
              <td>Session storage</td>
              <td>N/A</td>
              <td>
                Netlify-cms-auth <br></br>
                what-input <br></br>
                what-intent <br></br>
              </td>
              <td></td>
            </tr>
            <tr>
              <td>nf_jwt</td>
              <td>mcm</td>
              <td></td>
              <td>Session</td>
            </tr>
            <tr>
              <td>experimentation_subject_id</td>
              <td>gitlab</td>
              <td></td>
              <td>20 ans</td>
            </tr>
          </tbody>
        </table>

        <p className="sub-title">{Strings['politique.cookies.part5.paragraphe3']}</p>
        <table className="cookies-table">
          <thead>
            <tr>
              <td>{Strings['politique.cookies.part5.table.title1']}</td>
              <td>{Strings['politique.cookies.part5.table.title2']}</td>
              <td>{Strings['politique.cookies.part5.table.title3']}</td>
              <td>{Strings['politique.cookies.part5.table.title4']}</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>_pk_id</td>
              <td>Serveur Matomo</td>
              <td>
                Used to store a few details about the user such as the unique
                visitor ID.
              </td>
              <td>13 mois par défaut</td>
            </tr>
            <tr>
              <td>_pk_ref</td>
              <td>Serveur Matomo</td>
              <td>
                Used to store the attribution information, the referrer
                initially used to visit the website.
              </td>
              <td>Session</td>
            </tr>
            <tr>
              <td>
                _pk_ses, <br></br>
                _pk_cvar
              </td>
              <td>Serveur Matomo</td>
              <td>
                Short lived cookies used to temporarily store data for the
                visit.
              </td>
              <td>30 minutes par défaut (Session)</td>
            </tr>
            <tr>
              <td>_pk_hsr</td>
              <td>Serveur Matomo</td>
              <td>Heatmap & Session recording.</td>
              <td>30 minutes par défaut (Session)</td>
            </tr>
            <tr>
              <td>_pk_testcookie</td>
              <td>Serveur Matomo</td>
              <td>
                Created and should be then directly deleted (used to check
                whether the visitor’s browser supports cookies).
              </td>
              <td></td>
            </tr>
            <tr>
              <td>
                mtm_consent <br></br>
                or <br></br>
                mtm_consent_removed
              </td>
              <td>Serveur Matomo</td>
              <td>
                To remember that consent was given (or removed) by the user.
              </td>
              <td>30 ans</td>
            </tr>
            <tr>
              <td>mtm_cookie_consent</td>
              <td>Serveur Matomo</td>
              <td>
                To remember that consent for storing and using cookies was given
                by the user.
              </td>
              <td>30 ans</td>
            </tr>
            <tr>
              <td>piwik_ignore</td>
              <td>Serveur Matomo</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>Session storage</td>
              <td>mcm</td>
              <td>@@scroll|*</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <h2>{Strings['politique.cookies.part6.title']}</h2>
        <p>
          {Strings['politique.cookies.part6.paragraphe1']}
        </p>
        <p>
          {Strings['politique.cookies.part6.paragraphe2']}{' '}
          <Link
            id="protection-donnees-charte"
            to="/charte-protection-donnees-personnelles"
            className="link-in-text_blue"
          >
            {Strings['politique.cookies.part6.paragraphe2.link']}
          </Link>
          .
        </p>
      </div>
      <ScrollTopButton />
    </Layout>
  );
};

export default CookiesInfos;
