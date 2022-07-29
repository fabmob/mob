import React, { FC, ReactText } from 'react';
import { format } from 'date-fns';
import { Link } from 'gatsby';

import Heading from '../../../../components/Heading/Heading';
import Image from '../../../../components/Image/Image';

import { capitalize } from '@utils/helpers';

import Strings from './locale/fr.json';

import './_citizen-card.scss';

export interface Affiliation {
  enterpriseId: string;
  enterpriseEmail: string;
  affiliationStatus: string;
}
export interface IdentityRessourceProps {
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  city?: string;
  postcode?: string;
  email?: string;
  affiliation?: Affiliation;
  citizenId?: string;
  isCitizenDeleted?: boolean;
}
interface ProfessionalRessourceProps {
  company?: string;
  number?: string;
}
interface Props {
  identity?: IdentityRessourceProps;
  professional?: ProfessionalRessourceProps;
  showSummary?: boolean;
}

/**
 * @name CitizenCard
 * @description A component to display a card with citizen information.
 */
const CitizenCard: FC<Props> = ({ identity, showSummary = true }) => {
  const { firstName, lastName, citizenId } = identity as IdentityRessourceProps;
  return (
    <div className="mcm-citizen-card mcm-paper mcm-paper--outlined">
      <div className="mcm-citizen-card__name">
        <Image
          filename="illus-profile.svg"
          verticalAlign="bottom"
          size="mini"
        />
        {capitalize(identity?.firstName)} {capitalize(identity?.lastName)}
      </div>
      {identity && renderIdentitySection(identity)}
      {showSummary && (
        <Link
          id={`gerer-salaries-${citizenId}`}
          to={`/gerer-salaries/${citizenId}`}
          state={{ firstName, lastName }}
        >
          <a
            target="_blank"
            rel="noreferrer"
            href="#"
            className="mcm-citizen-card__link"
          >
            {Strings['citizen.card.informations.button']}
          </a>
        </Link>
      )}
    </div>
  );
};

function renderIdentitySection(identity: IdentityRessourceProps) {
  const { birthdate, city, postcode, email, affiliation, isCitizenDeleted } =
    identity;

  return (
    <div className="mcm-citizen-card__section">
      <Heading level="h3">{Strings['heading.identity']}</Heading>
      <dl>
        {birthdate &&
          renderSectionItem(
            Strings['section.item.birthday'],
            format(new Date(birthdate), 'dd/MM/yyyy')
          )}
        {city && renderSectionItem(Strings['section.item.label.ville'], city)}
        {postcode &&
          renderSectionItem(
            Strings['section.item.label.postal.code'],
            postcode
          )}
        {affiliation?.enterpriseEmail
          ? renderSectionItem(
              Strings['section.item.label.email.pro'],
              affiliation.enterpriseEmail
            )
          : renderSectionItem(Strings['section.item.label.email.pro'], '-')}
        {email &&
          renderSectionItem(Strings['section.item.label.email.perso'], email)}
        {isCitizenDeleted &&
          renderSectionItem(
            Strings['section.item.label.account.status'],
            Strings['citizen.card.flag.delete'],
            'red'
          )}
      </dl>
    </div>
  );
}

function renderSectionItem(
  label: string,
  value: ReactText,
  valueColor?: string
) {
  return (
    <>
      <dt>{label}</dt>
      <dd style={{ color: valueColor }}>{value}</dd>
    </>
  );
}
export { CitizenCard, renderIdentitySection, renderSectionItem };
