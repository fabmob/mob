import React, { FC, useState } from 'react';
import querystring from 'query-string';

import SignUpForm from '@components/Form/SignUpForm/';
import {
  CreationCompteMessage,
  CreationCompteSuccesMessage,
  LetterM,
  PatternCompositionMessage,
} from '../components';
import Layout from '@components/Layout/Layout';
import Image from '@components/Image/Image';

import classNames from 'classnames';
import Strings from '../locale/fr.json';
import config from '@utils/configFC';

const InscriptionPageForm: FC = () => {
  const [inscriptionMode, setInscriptionMode] = useState(true);

  const CSSClass = classNames('connexion-inscription', {
    'connexion-inscription--form': inscriptionMode,
    'connexion-inscription--confirmation': !inscriptionMode,
  });

  const completionMode = window.location.pathname.includes(
    'completer-formulaire'
  );

  const openFranceConnect = () => {
    const query = {
      redirect_uri: `${config.ORIGIN_PATH}${config.REDIRECT_PATH}`,
      client_id: `platform`,
      response_type: 'code',
      scope: `openid`,
      kc_idp_hint: `franceconnect-particulier`,
    };

    const url: string = `${config.IDP_URL}${config.IDP_PATH}`;
    window.location.href = `${url}?${querystring.stringify(query)}`;    
  };

  return (
    <Layout
      pageTitle={`${Strings['creation.line1.create']} ${Strings['creation.line2.account']}`}
    >
      {/* FRANCE CONNECT PART START */}
      {!completionMode && inscriptionMode && (
        <>
          <h1 className="connexion-inscription__title">{`${Strings['creation.line1.create']} ${Strings['creation.line2.account']}`}</h1>
          <div className={CSSClass}>
            <div className="connexion-inscription__first">
              <h2>{`${Strings['title.FC']}`}</h2>
              <p>{Strings['description.FC']}</p>
            </div>
            <div className="connexion-inscription__second btn-FC">
              <div className="fc_buttons_content">
                <button
                  type="button"
                  aria-label="fc_link"
                  className="fc_link"
                  onClick={() => {
                    openFranceConnect();
                  }}
                ></button>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://franceconnect.gouv.fr"
                >
                  {Strings['what.is.fc']}
                </a>
              </div>
            </div>
          </div>
          <div className="separ-sections">
            <p className="label">{`${Strings['signin.separation.label']}`}</p>
          </div>
        </>
      )}
      {/* FRANCE CONNECT PART END */}

      {/* moB PART START */}
      <div className={CSSClass}>
        <div className="connexion-inscription__first">
          {inscriptionMode ? (
            <>
              <CreationCompteMessage completionMode={completionMode} />
              {!completionMode && <PatternCompositionMessage />}
            </>
          ) : (
            <CreationCompteSuccesMessage completionMode={completionMode} />
          )}
        </div>
        <div className="connexion-inscription__second">
          {inscriptionMode && (
            <SignUpForm
              completionMode={completionMode}
              handleSwitchMode={() => setInscriptionMode(false)}
            />
          )}
        </div>
        <div className="connexion-inscription__image">
          <div className="img-rounded-left">
            {!inscriptionMode && <Image fixed filename="girl-smiling.jpg" />}
          </div>
          {LetterM}
        </div>
      </div>
    </Layout>
  );
};

export default InscriptionPageForm;
