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
import ipad from '../assets/svg/illus-ipad.svg';
import profile from '../assets/svg/illus-profile-blue.svg';
import graph from '../assets/svg/illus-graph.svg';
import Strings from './locale/fr.json';
import { HomeVideos } from '../constants';
import { environment } from '../environment';

const navLinks = [
  {
    label: Strings['collectivite.nav.links.label.citizen'],
    path: '/',
    active: false,
  },
  {
    label: Strings['collectivite.nav.links.label.employer'],
    path: '/employeur',
    active: false,
  },
  {
    label: Strings['collectivite.nav.links.label.collectivite'],
    path: '/collectivite',
    active: true,
  },
  {
    label: Strings['collectivite.nav.links.label.operator'],
    path: '/operateur-de-mobilite',
    active: false,
  },
];

const stepList: StepsItemProps[] = [
  { image: profile, text: Strings['collectivite.steps.text.profile'] },
  { image: ipad, text: Strings['collectivite.steps.text.ipad'] },
  {
    image: graph,
    text: Strings['collectivite.steps.text.graph'],
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
      <div className="mcm-home mcm-home--collectivite">
        <LinksNav navItems={navLinks} />
        <section className="mcm-home__header">
          <div className="page-container o-bg-wrapper">
            <h1 className="mt-m mb-m">
              {Strings['collectivite.title.part1']}
              <span className="special">
                {Strings['collectivite.title.part2']}
              </span>{' '}
              {Strings['collectivite.title.part3']}
            </h1>
            <Link id="collectivite-contact" to="/contact">
              <Button>{Strings['collectivite.button.contact.us']}</Button>
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
            title={Strings['collectivite.steps.Component.title']}
            items={stepList}
          />
          <div className="mcm-section-with-support--mac">
            <div className="mcm-section-with-support--mac__image">
              <div className="img-wrapper">
                <Image filename="support-mac.jpg" />
              </div>
            </div>
            <div className="mcm-section-with-support--mac__body">
              <h2 className="mb-m">
                {Strings['collectivite.description.title']}
              </h2>
              <div className="list-container">
                <OrderedList
                  items={[
                    <>
                      <span className="special">
                        {Strings['collectivite.description.item1']}
                      </span>
                      {Strings['collectivite.description.item1.text']}
                    </>,
                    <>
                      <span className="special">
                        {Strings['collectivite.description.item2']}
                      </span>
                      {Strings['collectivite.description.item2.text']}
                    </>,
                    <>
                      <span className="special">
                        {Strings['collectivite.description.item3']}
                      </span>
                      {Strings['collectivite.description.item3.text']}
                    </>,
                  ]}
                />
              </div>
            </div>
          </div>
          <div className="mob-pattern">
            <div className="mob-pattern__svg" />
          </div>
          <SectionWithImage
            imgFilename="dame-veste-corail.jpg"
            className="section--over-width"
          >
            <h2 className="mb-s">{Strings['why.mob.title']}</h2>
            <p className="mb-xs">{Strings['collectivite.why.mob.item1']}</p>
            <p className="mb-s">{Strings['collectivite.why.mob.item2']}</p>
            <Link id="collectivite-contact2" to="/contact">
              <Button>
                {Strings['collectivite.why.mob.button.contact.us']}
              </Button>
            </Link>
            <Link id="collectivite-decouvrir" to="/decouvrir-le-projet">
              <Button secondary>
                {Strings['collectivite.why.mob.button.discover.project']}
              </Button>
            </Link>
          </SectionWithImage>
          <h2 className="mb-m mt-m">
            {Strings['collectivite.why.mob.all.partners']}
          </h2>
          <PartnerList partners={partnersList} />
        </main>
      </div>
    </Layout>
  );
};

export default IndexPage;
