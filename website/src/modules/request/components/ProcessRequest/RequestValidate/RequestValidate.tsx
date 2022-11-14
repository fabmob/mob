import React, { FC, useState } from 'react';

import Heading from '@components/Heading/Heading';
import SubscriptionValidateForm from '@components/Form/SubscriptionValidateForm/SubscriptionValidateForm';
import Button from '@components/Button/Button';
import ModalComponent, { paramsModal } from '@components/Modal/Modal';

import { putSubscriptionValidate } from '@api/DemandeService';

import {
  MultiplePayment,
  NoPayment,
  SinglePayment,
  SUBSCRIPTION_STEP,
  PAYMENT_VALUE,
} from '@utils/demandes';
import { formatInputDate } from '@utils/helpers';
import { FREQUENCY_VALUE } from '@utils/demandes';

import { format } from 'date-fns';
import Strings from '../locale/fr.json';

interface RequestValidateProps {
  subscriptionId: string;
  handleStep: Function;
}

/**
 * @name RequestValidate
 * @description This is the second step in the process of validating request.
 * @type [Business Controller]
 */
const RequestValidate: FC<RequestValidateProps> = ({
  subscriptionId,
  handleStep,
}) => {
  const [hasValue, setHasValue] = useState<boolean>(false);
  const [isShowModal, setShowModal] = useState<boolean>(false);
  const [validationData, setValidationData] = useState<
    SinglePayment | MultiplePayment | NoPayment
  >({});
  /**
   * Handle submit form, api call, its result and next step or error
   * @param event any
   */
  const onSubmit = (
    validationData: SinglePayment | MultiplePayment | NoPayment
  ) => {
    validationData.comments || delete validationData.comments;
    // Transform specific amountSingle/amountMultiple to montant before sending to api
    if (validationData.mode === PAYMENT_VALUE.SINGLE) {
      if (validationData.amountSingle.length > 0) {
        validationData.amountSingle = Number(validationData.amountSingle);
      } else delete validationData.amountSingle;
      delete Object.assign(validationData, {
        amount: validationData['amountSingle'],
      })['amountSingle'];
    }
    if (validationData.mode === PAYMENT_VALUE.MULTIPLE) {
      if (validationData.amountMultiple.length > 0) {
        validationData.amountMultiple = Number(validationData.amountMultiple);
      } else delete validationData.amountMultiple;
      const [day, month, year] = validationData.lastPayment.split('/');
      const lastPayment = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      delete Object.assign(validationData, {
        amount: validationData['amountMultiple'],
        lastPayment: format(lastPayment, 'yyyy-MM-dd'),
      })['amountMultiple'];
    }
    setValidationData(validationData);
    setShowModal(true);
  };

  /**
   * Use onChange to change button state
   * @param value string
   */
  const onChange = (value: string) => {
    setHasValue(Boolean(value));
  };

  const onValidateSubscription = (
    validationData: SinglePayment | MultiplePayment | NoPayment
  ) => {
    putSubscriptionValidate(subscriptionId, validationData)
      .then(() => {
        setShowModal(false);
        handleStep(SUBSCRIPTION_STEP.CONFIRM_VALIDATE);
      })
      .catch((err: any) => {});
  };

  const params: paramsModal = {
    title: Strings['subscription.processRequest.confirmValidate.modal.title'],
    submitBtn: {
      label:
        Strings[
          'subscription.processRequest.confirmValidate.modal.button.submit'
        ],
      onClick: () => onValidateSubscription(validationData),
    },
    cancelBtn: {
      label:
        Strings[
          'subscription.processRequest.confirmValidate.modal.button.cancel'
        ],
      onClick: '',
    },
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const validationMessage = () => {
    let validationMessage: string;

    if (validationData.mode === PAYMENT_VALUE.NONE) {
      validationMessage =
        Strings['subscription.processRequest.confirmValidate.modal.mode.none'];
    }

    if (validationData.mode === PAYMENT_VALUE.SINGLE && validationData.amount) {
      validationMessage = Strings[
        'subscription.processRequest.confirmValidate.modal.mode.single'
      ].replace('{montant}', validationData.amount);
    } else if (
      validationData.mode === PAYMENT_VALUE.SINGLE &&
      !validationData.amount
    ) {
      validationMessage =
        Strings[
          'subscription.processRequest.confirmValidate.modal.mode.single.no.amount'
        ];
    }

    if (
      validationData.mode === PAYMENT_VALUE.MULTIPLE &&
      validationData.amount
    ) {
      validationMessage = Strings[
        'subscription.processRequest.confirmValidate.modal.mode.multiple'
      ]
        .replace('{montant}', validationData.amount)
        .replace(
          '{frequence}',
          validationData.frequency === FREQUENCY_VALUE.MONTHLY
            ? 'mois'
            : 'trimestre'
        )
        .replace(
          '{date}',
          formatInputDate(validationData.lastPayment, 'dd/MM/yyyy')
        );
    } else if (
      validationData.mode === PAYMENT_VALUE.MULTIPLE &&
      !validationData.amount
    ) {
      validationMessage = Strings[
        'subscription.processRequest.confirmValidate.modal.mode.multiple.no.amount'
      ]
        .replace(
          '{frequence}',
          validationData.frequency === FREQUENCY_VALUE.MONTHLY
            ? 'mensuel'
            : 'trimestriel'
        )
        .replace(
          '{date}',
          formatInputDate(validationData.lastPayment, 'dd/MM/yyyy')
        );
    }

    return validationMessage!;
  };

  return (
    <>
      <ModalComponent
        params={params}
        isShowModal={isShowModal}
        closeModal={closeModal}
      >
        {Strings[
          'subscription.processRequest.confirmValidate.modal.children.mode'
        ].concat('', validationMessage())}
      </ModalComponent>
      <Heading level="h3" color="blue">
        {Strings['request.validate.heading.title']}
      </Heading>
      <SubscriptionValidateForm onSubmit={onSubmit} onChange={onChange}>
        <div className="mcm-demande__button-section">
          <Button
            secondary
            onClick={() => handleStep(SUBSCRIPTION_STEP.VISUALIZE)}
          >
            {Strings['subscription.processRequest.return.button']}
          </Button>
          <Button
            submit
            classnames="demande-validate-form"
            disabled={!hasValue}
          >
            {Strings['subscription.processRequest.validate.button']}
          </Button>
        </div>
      </SubscriptionValidateForm>
    </>
  );
};

export default RequestValidate;
