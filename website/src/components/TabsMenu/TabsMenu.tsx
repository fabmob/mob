import React, { FC, useCallback, useState } from 'react';
import classNames from 'classnames';
import ReactMarkdown from 'react-markdown';
import Markdown from 'markdown-to-jsx';

import Strings from './locale/fr.json';

import InformationCard from '@components/InformationCard/InformationCard';

import './_tabs-menu.scss';

interface TabsMenuItem {
  id: number;
  tabLabel: string;
  tabContent: string;
}

interface TabsMenuProps {
  tabs: TabsMenuItem[];
  info?: string;
  contact?: string;
}

const TabsMenu: FC<TabsMenuProps> = ({ tabs, info, contact }) => {
  const [visibleTab, setVisibleTab] = useState(tabs[0].id);
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const measuredRef = useCallback(
    (node) => {
      if (node !== null && visibleTab) {
        setContentHeight(node.getBoundingClientRect().height);
      }
    },
    [visibleTab]
  );

  const handleTabClick = (tabID: React.SetStateAction<number>) => {
    setContentHeight(0); // Need to reset height between each tab click
    setVisibleTab(tabID);
  };

  const tabsLabelList = tabs.map(({ id, tabLabel }) => {
    const CSSClass = classNames('tab-label', {
      'tab-label--active': id === visibleTab,
    });
    return (
      <li key={id} className={CSSClass}>
        <button type="button" onClick={() => handleTabClick(id)}>
          {tabLabel}
        </button>
      </li>
    );
  });

  const tabsContentList = tabs.map((item) => {
    return (
      <div
        className="tab"
        key={item.id}
        style={visibleTab === item.id ? {} : { display: 'none' }}
      >
        <ReactMarkdown>{item.tabContent}</ReactMarkdown>
      </div>
    );
  });
  const CSSContentClass = classNames('mcm-tabs__content', {
    'has-show-more': contentHeight > 700,
    'is-expanded': isExpanded,
    'has-info': info,
  });
  return (
    <div className="mcm-tabs">
      <ul className="mcm-tabs__labels page-container">{tabsLabelList}</ul>
      <div className={CSSContentClass}>
        <div ref={measuredRef} className="page-container">
          <div className="content-list">
            {tabsContentList}
            {contentHeight > 800 && (
              <div className="show-more">
                <button
                  type="button"
                  className="show-more__button"
                  onClick={() => setIsExpanded(true)}
                >
                  {Strings['see.more']}
                </button>
              </div>
            )}
          </div>
          <div className="container-card">
            {contact && (
              <InformationCard title={Strings['contact']}>
                <Markdown>{contact}</Markdown>
              </InformationCard>
            )}
            {info && (
              <InformationCard title={Strings['good.toKnow']}>
                <p className="contact__body">{info}</p>
              </InformationCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabsMenu;
