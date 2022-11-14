import React, { FC, ReactNode } from 'react';
import { format } from 'date-fns';
import LinesEllipsis from 'react-lines-ellipsis';
import { useBreakpoint } from 'gatsby-plugin-breakpoints';
import classNames from 'classnames';

import {
  Subscription,
  SubscriptionRejection,
  STATUS,
  PAYMENT_VALUE,
  REASON_REJECT_VALUE,
  REASON_REJECT_LABEL,
  MultiplePayment,
} from '@utils/demandes';
import { transportMapping } from '@utils/aides';
import { getDispositifImgFilename } from '@utils/getDispositifImage';
import { firstCharUpper } from '@utils/helpers';

import Image from '../Image/Image';
import Heading from '../Heading/Heading';
import ArrowLink from '../ArrowLink/ArrowLink';
import CardLine from '../CardLine/CardLine';
import CardLineColumn from '../CardLine/CardLineColumn';
import CardLineContent from '../CardLine/CardLineContent';
import TooltipInfoIcon from '../TooltipInfoIcon/TooltipInfoIcon';

import Strings from './locale/fr.json';

import './_card-request.scss';

interface Props {
  /** Entire object of request */
  request: Subscription;
  isSubscriptionHistory: boolean;
}

/**
 * @name CardRequest
 * @description A card request displays a short information of request.
 */
const CardRequest: FC<Props> = ({ request, isSubscriptionHistory }) => {
  /**
   * Returns the correct image filename depending on the transport type.
   * Returns specific filename if there are more than 2 transport types.
   * @param transportList
   */
  const getDemandeImgFilename = (transportList: string[]): string => {
    return getDispositifImgFilename(transportList);
  };

  const getImageAltFilename = (transportList: string[]): string => {
    return `Aide de type ${
      transportList.length > 1
        ? 'multiple'
        : transportMapping[request?.incentiveTransportList[0]]
    }`;
  };

  const CSSClass = classNames(
    request?.status === STATUS.REJECTED
      ? 'card-request__reason'
      : 'card-request__action'
  );

  const renderVersement = (): ReactNode => {
    const { subscriptionValidation } = request;

    switch (subscriptionValidation.mode) {
      case PAYMENT_VALUE.MULTIPLE:
        return `${Strings['end.funding']} ${format(
          new Date((subscriptionValidation as MultiplePayment).lastPayment),
          'dd/MM/yyyy'
        )}`;
      case PAYMENT_VALUE.SINGLE:
        return Strings['unique.funding'];
      case PAYMENT_VALUE.NONE:
        return Strings['no.payment'];
      default:
        return null;
    }
  };

  const renderMotif = (
    subscriptionRejection: SubscriptionRejection
  ): ReactNode => {
    const breakpoints = useBreakpoint();

    if (subscriptionRejection.type !== REASON_REJECT_VALUE.OTHER) {
      return REASON_REJECT_LABEL[subscriptionRejection.type];
    }
    // Enables ellipsis behavior only for large and more breakpoints.
    if (breakpoints.l && subscriptionRejection.other) {
      return (
        <LinesEllipsis
          text={`${Strings['other.label']} - ${subscriptionRejection.other}`}
          maxLine={2}
        />
      );
    }
    return `${Strings['other.label']} - ${subscriptionRejection.other}`;
  };

  const renderColumnDate = (): ReactNode => {
    const { status, createdAt, updatedAt } = request;

    switch (status) {
      case STATUS.TO_PROCESS:
        return (
          <div className="card-request__status-date">
            {`${Strings['the.pronoun']} ${format(
              new Date(createdAt),
              "dd/MM/yyyy à H'h'mm"
            )}`}
          </div>
        );
      case STATUS.VALIDATED:
        return (
          <>
            <div className="card-request__status-date">
              {updatedAt &&
                `${Strings['validated.at']} ${format(
                  new Date(updatedAt),
                  "dd/MM/yyyy à H'h'mm"
                )}`}
            </div>
            <div className="card-request__payment">{renderVersement()}</div>
          </>
        );
      case STATUS.REJECTED:
        return (
          <>
            <div className="card-request__status-date">
              {updatedAt &&
                `${Strings['rejected.at']} ${format(
                  new Date(updatedAt),
                  "dd/MM/yyyy à H'h'mm"
                )}`}
            </div>
            <div className="card-request__payment">
              {`${Strings['requested.at']} ${format(
                new Date(createdAt),
                'dd/MM/yyyy'
              )}`}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const renderColumnAction = (): ReactNode => {
    const { status, subscriptionRejection } = request;

    switch (status) {
      case STATUS.TO_PROCESS:
        return (
          <a
            id={`administrer-demandes-${request.id}`}
            href={`/administrer-demandes/${request.id}`}
            target="_blank"
            rel="noreferrer"
          >
            <ArrowLink label={Strings['process.subscription']} />
          </a>
        );
      case STATUS.VALIDATED:
        return null;

      case STATUS.REJECTED:
        return subscriptionRejection && renderMotif(subscriptionRejection);
      default:
        return null;
    }
  };

  return (
    <CardLine classnames="card-request">
      <CardLineContent>
        {!isSubscriptionHistory && (
          <CardLineColumn classnames="card-request__name h3">
            {request.isCitizenDeleted && (
              <TooltipInfoIcon
                tooltipContent={Strings['citizen.tooltip.deleted.account']}
                iconName="error"
                iconSize={30}
              />
            )}
            <span>{firstCharUpper(request?.firstName)}</span>{' '}
            <span className="card-request__lastname">
              {request?.lastName.toUpperCase()}
            </span>
          </CardLineColumn>
        )}
        <CardLineColumn classnames="card-request__title">
          {request?.incentiveTransportList?.length && (
            <Image
              alt={getImageAltFilename(request?.incentiveTransportList)}
              filename={getDemandeImgFilename(request?.incentiveTransportList)}
            />
          )}
          <Heading level="h3">{request?.incentiveTitle}</Heading>
        </CardLineColumn>
        <CardLineColumn classnames="card-request__date">
          {renderColumnDate()}
        </CardLineColumn>
        <CardLineColumn classnames={CSSClass}>
          {renderColumnAction()}
        </CardLineColumn>
      </CardLineContent>
    </CardLine>
  );
};

export default CardRequest;
