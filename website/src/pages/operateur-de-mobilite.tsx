import React, { FC, useEffect, useState } from 'react';
import { Link } from 'gatsby';
import Layout from '../components/Layout/Layout';
import Button from '../components/Button/Button';
import LinksNav from '../components/StatusNav/LinksNav';
import SectionWithImage from '../components/SectionWithImage/SectionWithImage';
import PartnerList from '../components/PartnerList/PartnerList';
import OrderedList from '../components/OrderedList/OrderedList';
import VideoPlayer from '../components/Video/VideoPlayer';
import { partnersList } from '../utils/partners';
import '../assets/images/man-riding-bike.jpg';
import Strings from './locale/fr.json';
import { HomeVideos } from '../constants';
import { environment } from '../environment';

const navLinks = [
  {
    label: Strings['operateur.mobility.nav.links.label.citizen'],
    path: '/',
    active: false,
  },
  {
    label: Strings['operateur.mobility.nav.links.label.employer'],
    path: '/employeur',
    active: false,
  },
  {
    label: Strings['operateur.mobility.nav.links.label.collectivite'],
    path: '/collectivite',
    active: false,
  },
  {
    label: Strings['operateur.mobility.nav.links.label.operator'],
    path: '/operateur-de-mobilite',
    active: true,
  },
];

const IndexPage: FC = () => {

  return (
    <Layout
      fullWidth
      footer={{
        imageFilename: 'man-riding-bike.jpg',
        isVisibleOnMobile: false,
      }}
    >
      <div className="mcm-home mcm-home--operateur">
        <LinksNav navItems={navLinks} />
        <section className="mcm-home__header">
          <div className="page-container o-blue-bg-wrapper">
            <h1 className="mt-m mb-m">
              {Strings['operateur.mobility.title.part1']}
              <span className="special">
                {Strings['operateur.mobility.title.part2']}
              </span>
            </h1>
            <Link id="op-contact" to="/contact">
              <Button>{Strings['operateur.mobility.btn.contact.us']}</Button>
            </Link>
          </div>
        </section>
        <section className="mcm-hero">
          <VideoPlayer
            url={
              environment.LANDSCAPE === 'production'
                ? HomeVideos.AT_PROD
                : environment.LANDSCAPE === 'preprod'
                ? HomeVideos.AT_PREPROD
                : HomeVideos.AT_PREVIEW
            }
          />
        </section>
        <main className="mcm-container__main">
          <SectionWithImage
            imgFilename="girls-laughing.jpg"
            className="section--over-width"
            imageLeft
          >
            <h2 className="mb-s">
              {Strings['operateur.mobility.description.title']}
            </h2>
            <OrderedList
              items={[
                <>
                  <span className="special">
                    {Strings['operateur.mobility.description.item1']}
                  </span>
                  {Strings['operateur.mobility.description.item1.text']}
                </>,
                <>
                  <span className="special">
                    {Strings['operateur.mobility.description.item2']}
                  </span>
                  {Strings['operateur.mobility.description.item2.text']}
                </>,
                <>
                  <span className="special">
                    {Strings['operateur.mobility.description.item3']}
                  </span>
                  {Strings['operateur.mobility.description.item3.text']}
                </>,
              ]}
            />
          </SectionWithImage>
          <div className="mob-pattern">
            <div className="mob-pattern__svg" />
          </div>
          <SectionWithImage
            imgFilename="bridge.jpg"
            className="section--over-width"
          >
            <h2 className="mb-s">
              {Strings['why.mob.title']}
            </h2>
            <p className="mb-xs">
              {Strings['operateur.mobility.why.mob.item1']}
            </p>
            <p className="mb-s">
              {Strings['operateur.mobility.why.mob.item2']}
            </p>
            <Link id="op-contact2" to="/contact">
              <Button>
                {Strings['operateur.mobility.why.mob.button.contact.us']}
              </Button>
            </Link>
            <Link id="op-decouvrir" to="/decouvrir-le-projet">
              <Button secondary>
                {Strings['operateur.mobility.why.mob.button.discover.project']}
              </Button>
            </Link>
          </SectionWithImage>
          <h2 className="mb-m mt-m">
            {Strings['operateur.mobility.why.mob.all.partners']}
          </h2>
          <PartnerList partners={partnersList} />
        </main>
      </div>
    </Layout>
  );
};

export default IndexPage;
