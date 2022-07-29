import React, { FC } from 'react';
import { Link } from 'gatsby';
import { useKeycloak } from '@react-keycloak/web';

import Layout from '../components/Layout/Layout';
import Button from '../components/Button/Button';
import LinksNav from '../components/StatusNav/LinksNav';
import VideoPlayer from '../components/Video/VideoPlayer';
import SectionWithImage from '../components/SectionWithImage/SectionWithImage';
import PartnerList from '../components/PartnerList/PartnerList';
import { StepsItemProps } from '../components/Steps/StepsItem';
import Steps from '../components/Steps/Steps';
import { partnersList } from '../utils/partners';
import money from '../assets/svg/illus-money.svg';
import profile from '../assets/svg/illus-profile.svg';
import tree from '../assets/svg/illus-tree.svg';
import Strings from './locale/fr.json';

const navLinks = [
  { label: 'Citoyen.ne', path: '/', active: true },
  { label: 'Employeur', path: '/employeur', active: false },
  { label: 'Collectivité', path: '/collectivite', active: false },
  {
    label: 'Opérateur de mobilité',
    path: '/operateur-de-mobilite',
    active: false,
  },
];

const stepList: StepsItemProps[] = [
  { image: profile, text: Strings['steps.title1'] },
  { image: tree, text: Strings['steps.title2'] },
  {
    image: money,
    text: Strings['steps.title3'],
  },
];

const IndexPage: FC = () => {
  const { keycloak } = useKeycloak();

  return (
    <Layout
      fullWidth
      footer={{
        imageFilename: 'man-riding-bike.jpg',
        isVisibleOnMobile: false,
      }}
    >
      <div className="mcm-home">
        <LinksNav navItems={navLinks} />
        <section className="mcm-hero">
          <VideoPlayer homePage>
            <h1 className="mb-m">{Strings['homePage.title']}</h1>
            <Button
              inverted
              classnames="button-margin-link"
              onClick={() =>
                keycloak.login({
                  redirectUri: `${window.location.origin}/redirection/`,
                })
              }
            >
            {Strings['create.account']}
            </Button>
          </VideoPlayer>
        </section>
        <main className="mcm-container__main">
          <Steps
            title={Strings['steps.mainTitle']}
            items={stepList}
          />
          <SectionWithImage imgFilename="woman-yellow-coat.jpg" imageLeft>
            <h2 className="mb-s">{Strings['title.help']}</h2>
            <p className="mb-s">{Strings['description.help1']}
              <br />{Strings['description.help2']}
            </p>
            <Link to="/recherche/">
              <Button>{Strings['search.help']}</Button>
            </Link>
          </SectionWithImage>
          <div className="mob-pattern">
            <div className="mob-pattern__svg" />
          </div>
          <SectionWithImage imgFilename="trees.jpg">
            <h2 className="mb-s">{Strings['project.title']}</h2>
            <p className="mb-xs">{Strings['project.def1']}</p>
            <p className="mb-s">{Strings['project.def2']}</p>
            <Link to="/contact">
              <Button>{Strings['project.contact']}</Button>
            </Link>
            <Link to="/decouvrir-le-projet">
              <Button secondary>{Strings['project.discover']}</Button>
            </Link>
          </SectionWithImage>
          <h2 className="mb-m mt-m">{Strings['project.partner']}</h2>
          <PartnerList partners={partnersList} />
        </main>
      </div>
    </Layout>
  );
};

export default IndexPage;
