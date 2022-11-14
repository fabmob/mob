import React, { FC, useEffect, useState } from 'react';
import { Link } from 'gatsby';
import Layout from '../components/Layout/Layout';
import Button from '../components/Button/Button';
import LinksNav from '../components/StatusNav/LinksNav';
import Image from '../components/Image/Image';
import SectionWithImage from '../components/SectionWithImage/SectionWithImage';
import PartnerList from '../components/PartnerList/PartnerList';
import Steps from '../components/Steps/Steps';
import { StepsItemProps } from '../components/Steps/StepsItem';
import OrderedList from '../components/OrderedList/OrderedList';
import VideoPlayer from '../components/Video/VideoPlayer';
import { partnersList } from '../utils/partners';
import mobile from '../assets/svg/illus-mobile.svg';
import profile from '../assets/svg/illus-profile.svg';
import graph from '../assets/svg/illus-graph.svg';
import Strings from './locale/fr.json';
import { HomeVideos } from '../constants';
import { environment } from '../environment';

const navLinks = [
  {
    label: Strings['employeur.nav.links.label.citizen'],
    path: '/',
    active: false,
  },
  {
    label: Strings['employeur.nav.links.label.employer'],
    path: '/employeur',
    active: true,
  },
  {
    label: Strings['employeur.nav.links.label.collectivite'],
    path: '/collectivite',
    active: false,
  },
  {
    label: Strings['employeur.nav.links.label.operator'],
    path: '/operateur-de-mobilite',
    active: false,
  },
];

const stepList: StepsItemProps[] = [
  { image: profile, text: Strings['employeur.steps.text.profile'] },
  { image: mobile, text: Strings['employeur.steps.text.mobile'] },
  {
    image: graph,
    text: Strings['employeur.steps.text.graph'],
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
      <div className="mcm-home mcm-home--employeur">
        <LinksNav navItems={navLinks} />
        <section className="mcm-home__header">
          <div className="page-container m-bg-wrapper">
            <h1 className="mt-m mb-m">
              {Strings['employeur.title.part1']}
              <span className="special">
                {Strings['employeur.title.part2']}
              </span>
              {Strings['employeur.title.part3']}
            </h1>
            <Link id="employeur-contact" to="/contact">
              <Button>{Strings['employeur.button.contact.us']}</Button>
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
          <Steps
            title={Strings['employeur.steps.Component.title']}
            items={stepList}
          />
          <div className="mcm-section-with-support--iphone">
            <div className="mcm-section-with-support--iphone__image">
              <Image filename="support-iphone.png" />
            </div>
            <div className="mcm-section-with-support--iphone__body">
              <h2 className="mb-m">{Strings['employeur.description.title']}</h2>
              <OrderedList
                items={[
                  <>
                    <span className="special">
                      {Strings['employeur.description.item1']}
                    </span>
                    {Strings['employeur.description.item1.text']}
                  </>,
                  <>
                    <span className="special">
                      {Strings['employeur.description.item2']}
                    </span>
                    {Strings['employeur.description.item2.text']}
                  </>,
                  <>
                    <span className="special">
                      {Strings['employeur.description.item3']}
                    </span>
                    {Strings['employeur.description.item3.text']}
                  </>,
                ]}
              />
            </div>
            <div className="mob-pattern">
              <div className="mob-pattern__svg" />
            </div>
          </div>
          <SectionWithImage
            imgFilename="homme-d-affaire.jpg"
            className="section--over-width"
          >
            <h2 className="mb-s">{Strings['why.mob.title']}</h2>
            <p className="mb-xs">{Strings['employeur.why.mob.item1']}</p>
            <p className="mb-s">{Strings['employeur.why.mob.item2']}</p>
            <Link id="employeur-contact2" to="/contact">
              <Button>{Strings['employeur.why.mob.button.contact.us']}</Button>
            </Link>
            <Link id="employeur-decouvrir" to="/decouvrir-le-projet">
              <Button secondary>
                {Strings['employeur.why.mob.button.discover.project']}
              </Button>
            </Link>
          </SectionWithImage>
          <h2 className="mb-m mt-m">
            {Strings['employeur.why.mob.all.partners']}
          </h2>
          <PartnerList partners={partnersList} />
        </main>
      </div>
    </Layout>
  );
};

export default IndexPage;
