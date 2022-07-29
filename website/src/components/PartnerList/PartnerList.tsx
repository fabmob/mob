import React, { FC } from 'react';
import Image from '../Image/Image';
import './_partner-list.scss';

interface Partner {
  logoFilename: string;
  href?: string;
}
interface PartnerListProps {
  partners: Partner[];
}

const PartnerList: FC<PartnerListProps> = ({ partners }) => {
  return (
    <div className="partner-wrapper">
      <ul className="partner-list" data-testid="partner-list">
        {partners.map(({ logoFilename, href }, index) => {
          const uniqueKey = `partner-${index}`;
          return (
            <li key={uniqueKey} className="partner-list__item">
              <a href={href} target="_blank" rel="noreferrer">
                <Image filename={logoFilename} />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PartnerList;
