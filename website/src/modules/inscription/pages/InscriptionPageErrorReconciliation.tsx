import React, { FC } from 'react';
import { Link } from 'gatsby';
import { RouteComponentProps } from '@reach/router';

import Layout from '@components/Layout/Layout';
import Image from '@components/Image/Image';
import Button from '@components/Button/Button';
import { LetterM } from '../components';
import Strings from '../locale/fr.json';

const InscriptionPageErrorReconciliation: FC<RouteComponentProps> = () => {
  return (
    <Layout
      pageTitle={`${Strings['creation.line1.create']} ${Strings['creation.line2.account']}`}
    >
      <h2 className="mb-s">{Strings['creation.error.reconcialition.title']}</h2>
      <div className="connexion-inscription connexion-inscription--reconciliation">
        <div className="connexion-inscription__first mb-m">
          <p className="mb-s">
            {Strings['creation.error.reconcialition.message.line1']}{' '}
            {Strings['creation.error.reconcialition.message.line2']}
          </p>
          <p className="mb-s">
            {Strings['creation.error.reconcialition.message.line3']}
          </p>
          <Button>
            <Link
              id="inscription-contact"
              to="/contact"
              data-testid="reconciliation-contactbtn"
            >
              {Strings['page.indisponible.contactUs']}
            </Link>
          </Button>
        </div>
        <div className="connexion-inscription__image">
          <div className="img-rounded-left">
            <Image fixed filename="tramway.jpg" />
          </div>
          {LetterM}
        </div>
      </div>
    </Layout>
  );
};

export default InscriptionPageErrorReconciliation;
