import React, { FC, useEffect, useState } from 'react';
import classNames from 'classnames';

import './_tabs.scss';

export interface TabsMenuItem {
  id: number;
  tabLabel: string;
  statusState?: string;
}

interface TabProps {
  tabs: TabsMenuItem[];
  setSelectedIndex?: any;
  defaultActiveTab?: number;
}

const Tab: FC<TabProps> = ({ tabs, setSelectedIndex, defaultActiveTab }) => {
  const [activeTab, setActiveTab] = useState<number>(
    defaultActiveTab || tabs[0]?.id
  );
  useEffect(() => {
    setActiveTab(defaultActiveTab || tabs[0]?.id)
  }, [defaultActiveTab])

  const handleTabClick = (tabID: React.SetStateAction<number>) => {
    setActiveTab(tabID);
  };

  return (
    <div className="mcm-tab-container">
      <ul className="mcm-tab__list">
        {tabs &&
          tabs.map(({ id, tabLabel, statusState }) => {
            const CSSClass = classNames('tabs', {
              'active-tabs': id === activeTab,
            });
            return (
              <li
                key={id}
                className={CSSClass}
                onClick={() => {
                  handleTabClick(id);
                  setSelectedIndex(statusState);
                }}
              >
                {tabLabel}
              </li>
            );
          })}
      </ul>
    </div>
  );
};

export default Tab;
