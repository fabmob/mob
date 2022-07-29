import React, { FC } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import LinesEllipsis from 'react-lines-ellipsis';

import { getAide } from '@api/AideService';
import Button from '@components/Button/Button';
import Heading from '@components/Heading/Heading';
import Image from '@components/Image/Image';
import { AFFILIATION_STATUS } from '@utils/citoyens';
import { INCENTIVE_TYPE, STATUS, Subscription } from '@utils/demandes';
import { getDispositifImgFilename } from '@utils/getDispositifImage';
import { FREQUENCY_VALUE, REASON_REJECT_LABEL } from '@utils/demandes';
import SVG from '@components/SVG/SVG';
import CollapsableBlock from '@components/CollapsableBlock/CollapsableBlock';

import Strings from '../../locale/fr.json';
import { useUser } from '../../../../../context';

interface CitizenSubscriptionCardProps {
  subscription: Subscription;
}

const CitizenSubscriptionCard: FC<CitizenSubscriptionCardProps> = ({
  subscription,
}) => {
  const { citizen } = useUser();
  const {
    incentiveTitle,
    incentiveId,
    incentiveType,
    funderName,
    funderId,
    incentiveTransportList,
    subscriptionRejection = {},
    subscriptionValidation = {},
  } = subscription;

  const comments =
    subscriptionValidation?.comments || subscriptionRejection?.comments;

  const renewSubscription = async () => {
    if (
      incentiveType === INCENTIVE_TYPE.EMPLOYER_INCENTIVE &&
      (funderId !== citizen.affiliation?.enterpriseId ||
        citizen.affiliation?.affiliationStatus !==
          AFFILIATION_STATUS.AFFILIATED)
    ) {
      toast.error(Strings['dashboard.citizen.subscriptions.renew.not.allowed']);
      return;
    }
    try {
      await getAide(incentiveId);
      const newWindow = window.open(
        `/subscriptions/new?incentiveId=${incentiveId}`,
        '_blank',
        'noopener,noreferrer'
      );
      if (newWindow) newWindow.opener = null;
    } catch {}
  };

  return (
    <li className="citizen-subscription-card">
      <div className="card-content">
        <div className="img-container">
          {incentiveTransportList?.length && (
            <Image
              filename={getDispositifImgFilename(incentiveTransportList)}
              size={'mini'}
            />
          )}
          <Heading level="h3" className="dark">
            {incentiveTitle}
          </Heading>
        </div>
        <div className="middle-section">
          <div>
            <p className="funder">
              {Strings['dashboard.citizen.subscriptions.funder.name'].replace(
                '{0}',
                funderName
              )}
            </p>
            <Button
              id={`subscriptions-incentive`}
              target="_blank"
              rel="noreferrer"
              href={`/subscriptions/new?incentiveId=${incentiveId}`}
              classnames="renew-button"
              basic
              onClick={renewSubscription}
            >
              {Strings['dashboard.citizen.subscriptions.renew.subscription']}
            </Button>
          </div>
          <StatusBlock subscription={subscription} />
          <div className="consult-button"></div>
        </div>
      </div>
      <CollapsableBlock
        title={Strings['dashboard.citizen.subscriptions.comments.title']}
        content={comments}
      />
    </li>
  );
};

const StatusBlock: FC<CitizenSubscriptionCardProps> = ({ subscription }) => {
  const {
    status,
    updatedAt,
    subscriptionRejection = {},
    subscriptionValidation = {},
  } = subscription;
  let icon = '';
  let title = '';
  let titleColor = '';
  let infos = '';
  switch (status) {
    case STATUS.TO_PROCESS:
      icon = 'wip';
      title =
        Strings[
          'dashboard.citizen.subscriptions.subscription.to.process.title'
        ];
      titleColor = 'var(--color-dark)';
      break;
    case STATUS.VALIDATED:
      icon = 'success';
      title =
        Strings['dashboard.citizen.subscriptions.subscription.validated.title'];
      titleColor = '#01bf7d';
      const { amount, frequency, lastPayment } = subscriptionValidation;
      infos = !!amount ? `${amount}€` : '';
      if (!!frequency) {
        if (frequency === FREQUENCY_VALUE.MONTHLY) {
          infos += '/mois ';
        } else {
          infos += '/trimestre ';
        }
      }
      if (!!lastPayment) {
        infos += `${Strings['dashboard.citizen.subscriptions.subscription.date.until']} ${format(new Date(lastPayment!), 'dd/MM/yyy')}`;
      }
      break;
    case STATUS.REJECTED:
      icon = 'error';
      title =
        Strings['dashboard.citizen.subscriptions.subscription.rejected.title'];
      titleColor = '#e35447';
      const { type, other } = subscriptionRejection;
      if (!!type) {
        infos = REASON_REJECT_LABEL[type];
        if (other) infos = `${infos} - ${other}`;
      }
      break;
    default:
      break;
  }
  const formatedDate: string = format(new Date(updatedAt), 'dd/MM/yyyy');
  return (
    <div className="status-container">
      <div className="status-icon">
        <SVG icon={icon} size={20} />
      </div>
      <div className="status-body">
        <div className="status-title" style={{ color: `${titleColor}` }}>
          {title}
        </div>
        <div className="status-description">
          {`${
            status === STATUS.TO_PROCESS ? Strings['dashboard.date.requested.on'] : Strings['dashboard.date.the']
          } ${formatedDate}`}
        </div>
        <LinesEllipsis
          className="status-description"
          text={infos}
          maxLine={2}
        />
      </div>
    </div>
  );
};

export default CitizenSubscriptionCard;
