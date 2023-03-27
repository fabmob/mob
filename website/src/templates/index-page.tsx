import React, { FC, useEffect, useState } from 'react';
import { Link, navigate } from 'gatsby';

import Layout from '@components/Layout/Layout';
import Button from '@components/Button/Button';
import LinksNav from '@components/StatusNav/LinksNav';
import VideoPlayer from '@components/Video/VideoPlayer';
import SectionWithImage from '@components/SectionWithImage/SectionWithImage';
import PartnerList from '@components/PartnerList/PartnerList';
import { StepsItemProps } from '@components/Steps/StepsItem';
import Steps from '@components/Steps/Steps';

import { partnersList } from '@utils/partners';
import { isAuthenticated } from '@modules/routes/utils';

import money from '@assets/svg/illus-money.svg';
import profile from '@assets/svg/illus-profile.svg';
import tree from '@assets/svg/illus-tree.svg';

import { useSession } from '../context';
import { HomeImages, HomeVideos } from '../constants';
import { environment } from '../environment';

import Strings from './locale/fr.json';
import mobLogo from '../../static/mob-favicon.png';
import { Helmet } from 'react-helmet';

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
  const { keycloak } = useSession();

  return (
    <Layout
      fullWidth
      footer={{
        imageFilename: 'man-riding-bike.jpg',
        isVisibleOnMobile: false,
      }}
    >
      <Helmet
        title={Strings['homePage.head.title']}
        titleTemplate={`%s ${Strings['homePage.head.title.separator']} ${Strings['homePage.head.title.siteName']}`}
      >
        <html lang="fr" />
        <meta
          name="description"
          content={Strings['homePage.head.description']}
        />
        <meta property="og:image" content={mobLogo}></meta>
        <meta property="og:image:alt" content="logo-mob"></meta>
      </Helmet>
      <div className="mcm-home">
        <LinksNav navItems={navLinks} />
        <section className="mcm-hero">
          <VideoPlayer
            homePage
            url={
              environment.LANDSCAPE === 'production'
                ? HomeVideos.AT_PROD
                : environment.LANDSCAPE === 'preprod'
                ? HomeVideos.AT_PREPROD
                : HomeVideos.AT_PREVIEW
            }
            poster={
              environment.LANDSCAPE === 'production'
                ? HomeImages.AT_PROD
                : environment.LANDSCAPE === 'preprod'
                ? HomeImages.AT_PREPROD
                : HomeImages.AT_PREVIEW
            }
          >
            <h1 className="mb-m">{Strings['homePage.title']}</h1>
            {!isAuthenticated() && (
              <Button
                inverted
                classnames="button-margin-link"
                onClick={() => {
                  {
                    navigate('/inscription/formulaire');
                  }
                }}
              >
                {Strings['create.account']}
              </Button>
            )}
          </VideoPlayer>
        </section>
        <main className="mcm-container__main">
          <Steps title={Strings['steps.mainTitle']} items={stepList} />
          <SectionWithImage imgFilename="woman-yellow-coat.jpg" imageLeft>
            <h2 className="mb-s">{Strings['title.help']}</h2>
            <p className="mb-s">
              {Strings['description.help1']}
              {Strings['description.help2']}
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
