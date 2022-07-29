import React, { FC, useState } from 'react';

import SignUpForm from '@components/Form/SignUpForm/';
import {
  CreationCompteMessage,
  CreationCompteSuccesMessage,
  LetterM,
  PasswordCompositionMessage,
} from '../components';
import Layout from '@components/Layout/Layout';
import Image from '@components/Image/Image';

import classNames from 'classnames';

const InscriptionPageForm: FC = () => {
  const [inscriptionMode, setInscriptionMode] = useState(true);

  const CSSClass = classNames('connexion-inscription', {
    'connexion-inscription--form': inscriptionMode,
    'connexion-inscription--confirmation': !inscriptionMode,
  });

  return (
    <Layout>
      <div className={CSSClass}>
        <div className="connexion-inscription__first">
          {inscriptionMode ? (
            <>
              <CreationCompteMessage />
              <PasswordCompositionMessage />
            </>
          ) : (
            <CreationCompteSuccesMessage />
          )}
        </div>
        <div className="connexion-inscription__second">
          {inscriptionMode && (
            <SignUpForm handleSwitchMode={() => setInscriptionMode(false)} />
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
