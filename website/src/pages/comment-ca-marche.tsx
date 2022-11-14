import React, { FC, useEffect, useState } from 'react';
import { Link } from 'gatsby';

import Layout from '@components/Layout/Layout';
import Button from '@components/Button/Button';
import LinksNav, {
  StatusNavProps,
  NavItems,
} from '@components/StatusNav/LinksNav';
import VideoPlayer, { VideoProps } from '@components/Video/VideoPlayer';
import SectionWithImage from '@components/SectionWithImage/SectionWithImage';

import { CmmImages, CmmVideos, IdfmImages, IdfmVideos } from '../constants';
import { environment } from '../environment';

import ExternalStrings from '../templates/locale/fr.json';
import Strings from './locale/fr.json';
import { matomoPageTracker } from '@utils/matomo';
import { useMatomo } from '@datapunt/matomo-tracker-react';

const TAB = [
  { label: Strings['user.guide.idfm'], active: true },
  { label: Strings['user.guide.mulhouse'], active: false },
];

const IndexPage: FC = () => {
  const [navTabs, setNavTabs] = useState<StatusNavProps>(TAB);
  const [selectedTab, setSelectedTab] = useState<string>(TAB[0].label);

  const VIDEO_ITEMS = [
    {
      selectedItem: Strings['user.guide.idfm'],
      url:
        environment.LANDSCAPE === 'production'
          ? IdfmVideos.AT_PROD
          : environment.LANDSCAPE === 'preprod'
          ? IdfmVideos.AT_PREPROD
          : IdfmVideos.AT_PREVIEW,
      image:
        environment.LANDSCAPE === 'production'
          ? IdfmImages.AT_PROD
          : environment.LANDSCAPE === 'preprod'
          ? IdfmImages.AT_PREPROD
          : IdfmImages.AT_PREVIEW,
    },
    {
      selectedItem: Strings['user.guide.mulhouse'],
      url:
        environment.LANDSCAPE === 'production'
          ? CmmVideos.AT_PROD
          : environment.LANDSCAPE === 'preprod'
          ? CmmVideos.AT_PREPROD
          : CmmVideos.AT_PREVIEW,
      image:
        environment.LANDSCAPE === 'production'
          ? CmmImages.AT_PROD
          : environment.LANDSCAPE === 'preprod'
          ? CmmImages.AT_PREPROD
          : CmmImages.AT_PREVIEW,
    },
    8,
  ];

  /**
   * Loop through the object and deactivate the CSS class for unselected links.
   * Set the navTabs state for each tab change.
   **/
  const handleChangeLinks = () => {
    const newNavTabs = navTabs.map((tab: NavItems) => {
      if (tab.label === selectedTab) {
        tab.active = true;
      } else tab.active = false;

      return tab;
    });

    setNavTabs(newNavTabs);
  };

  /**
   * Render Video Section depending on selectedTab
   **/
  const renderVideoSection = () => {
    const fileteredItem: VideoProps = VIDEO_ITEMS.find(
      (item) => item.selectedItem === selectedTab
    );

    return <VideoPlayer url={fileteredItem.url} poster={fileteredItem.image} />;
  };

  useEffect(() => handleChangeLinks(), [selectedTab]);

  // Tracking page
  const { trackPageView } = useMatomo();
  useEffect(() => {
    matomoPageTracker(trackPageView, 'Comment ça marche', 2);
    return () => {};
  }, []);

  return (
    <Layout fullWidth>
      <div className="mcm-home">
        <LinksNav navItems={navTabs} getSelectedTab={setSelectedTab} />
        <section className="mcm-hero">{renderVideoSection()}</section>
        <main className="mcm-container__main mcm-container__main__with-margin">
          <SectionWithImage imgFilename="woman-yellow-coat.jpg" imageLeft>
            <h2 className="mb-s">{ExternalStrings['title.help']}</h2>
            <p className="mb-s">
              {ExternalStrings['description.help1']}
              {ExternalStrings['description.help2']}
            </p>
            <Link to="/recherche/">
              <Button>{ExternalStrings['search.help']}</Button>
            </Link>
          </SectionWithImage>
        </main>
      </div>
    </Layout>
  );
};

export default IndexPage;
