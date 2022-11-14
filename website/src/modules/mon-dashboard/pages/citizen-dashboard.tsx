import React, { FC, useState, useEffect } from 'react';
import { PageProps } from 'gatsby';
import { Breadcrumb } from 'gatsby-plugin-breadcrumb/';

import Layout from '@components/Layout/Layout';
import Heading from '@components/Heading/Heading';
import Tab, { TabsMenuItem } from '@components/Tabs/Tabs';

import MyRequestsTab from './CitizenDashboardTabs/MyRequestsTab/MyRequestsTab';
import Strings from './locale/fr.json';
import './_mon-dashboard.scss';

enum TABS {
  MY_CURRENT_MOBILITY='MY_CURRENT_MOBILITY',
  MY_REQUESTS='MY_REQUESTS',
  MY_ACTIVATED_RESOURCES='MY_ACTIVATED_RESOURCES',
}

const tabsConfig: Record<TABS, TabsMenuItem> = {
  [TABS.MY_CURRENT_MOBILITY]: {
    id: 0,
    tabLabel: Strings['dashboard.citizens.subscription.tab.current.mobility'],
    statusState: TABS.MY_CURRENT_MOBILITY,
    hidden: true,
  },
  [TABS.MY_REQUESTS]: {
    id: 1,
    tabLabel: Strings['dashboard.citizens.subscription.tab.my.requests'],
    statusState: TABS.MY_REQUESTS,
  },
  [TABS.MY_ACTIVATED_RESOURCES]: {
    id: 2,
    tabLabel:
      Strings['dashboard.citizens.subscription.tab.activated.resources'],
    statusState: TABS.MY_ACTIVATED_RESOURCES,
    hidden: true,
  },
};

const CitizenDashboardPage: FC<PageProps> = (props) => {
  const defaultTab: TabsMenuItem = tabsConfig[TABS.MY_REQUESTS];
  const [selectedTab, setSelectedTab] = useState<TABS>(defaultTab?.statusState);
  const [tabsList, setTabsList] = useState<TabsMenuItem[]>([]);
  const [tabContent, setTabContent] = useState<FC>();
  
  useEffect(() => {
    setTabsList(Object.values(tabsConfig).filter((item: TabsMenuItem) => !item.hidden));
  }, []);

  useEffect(() => {
    switch (selectedTab) {
      case TABS.MY_CURRENT_MOBILITY:
        setTabContent(() => <></>)
        break;
      case TABS.MY_REQUESTS:
        setTabContent(() => <MyRequestsTab {...props} />);
        break;
      case TABS.MY_ACTIVATED_RESOURCES:
        setTabContent(() => <></>)
        break;
      default:
        setTabContent(() => <></>)
        break;
    }
  }, [selectedTab]);

  return (
    <Layout fullWidth pageTitle={Strings['dashboard.citizen.title']}>
      <div className="page-container">
        <Breadcrumb crumbs={props?.pageContext?.breadcrumb?.crumbs} crumbSeparator=" > " />
      </div>
      <div className="">
        <section className="page-container">
          <div className="m-yellow-bg-wrapper">
            <Heading level="h1" className="">{Strings['dashboard.citizen.title']}</Heading>
          </div>
        </section>
        <div className="mcm-home">
          <div className="mcm-tabs">
            <Tab
              tabs={tabsList}
              defaultActiveTab={defaultTab?.id}
              setSelectedIndex={setSelectedTab}
            />
            <div className="mcm-tabs__content has-info">
              {tabContent}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CitizenDashboardPage;