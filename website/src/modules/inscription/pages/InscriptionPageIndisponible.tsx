import React, { FC } from 'react';
import { Link } from 'gatsby';
import { RouteComponentProps } from '@reach/router';

import Layout from '../../../components/Layout/Layout';
import Image from '../../../components/Image/Image';
import Button from '../../../components/Button/Button';
import { LetterM } from '../components';
import Strings from '../locale/fr.json';

const InscriptionPageIndisponible: FC<RouteComponentProps> = () => {
  return (
    <Layout>
      <div className="connexion-inscription connexion-inscription--question">
        <div className="connexion-inscription__first">
          <h1 className="mb-s ">
            {Strings['page.indisponible.line1.create']}
            <br />{Strings['page.indisponible.line1.account']}
          </h1>
          <p className="headline mb-m">
            {Strings['page.indisponible.message1.line1']}
            <br /> {Strings['page.indisponible.message1.line2']}
          </p>
          <p className="mb-m">
            {Strings['page.indisponible.message2.line1']}
          </p>
          <Button>
            <Link id="inscription-contact" to="/contact">
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

export default InscriptionPageIndisponible;
