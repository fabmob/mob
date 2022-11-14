import React, { FC, useState } from 'react';

import SubscriptionRejectForm from '@components/Form/SubscriptionRejectForm/SubscriptionRejectForm';
import ModalComponent, { paramsModal } from '@components/Modal/Modal';
import Button from '@components/Button/Button';

import { putSubscriptionReject } from '@api/DemandeService';

import { SUBSCRIPTION_STEP, SubscriptionRejection } from '@utils/demandes';

import Strings from '../locale/fr.json';
interface RequestRejectProps {
  subscriptionId: string;
  handleStep: Function;
}

/**
 * @name RequestReject
 * @description This is the second step in the process of validating request.
 * @type [Business Controller]
 */
const RequestReject: FC<RequestRejectProps> = ({
  subscriptionId,
  handleStep,
}) => {
  const [hasValue, setHasValue] = useState<boolean>(false);
  const [subscriptionRejection, setRejectionMotif] =
    useState<SubscriptionRejection>({});
  const [isShowModal, setShowModal] = useState<boolean>(false);
  const onSubmit = (subscriptionRejectionSubmit: SubscriptionRejection) => {
    subscriptionRejectionSubmit.comments || delete(subscriptionRejectionSubmit.comments)
    setRejectionMotif(subscriptionRejectionSubmit);
    setShowModal(true);
  };
  /**
   * Use onChange to change button state
   * @param value string
   */
  const onChange = (value: string) => {
    setHasValue(Boolean(value));
  };

  const onRejectSubscription = (
    subscriptionRejectionReject: SubscriptionRejection
  ) => {
    putSubscriptionReject(subscriptionId, subscriptionRejectionReject)
      .then(() => {
        setShowModal(false);
        handleStep && handleStep(SUBSCRIPTION_STEP.CONFIRM_REJECT);
      })
      .catch((err: any) => {});
  };

  const params: paramsModal = {
    title: Strings['subscription.processRequest.confirmReject.modal.title'],
    submitBtn: {
      label:
        Strings[
          'subscription.processRequest.confirmReject.modal.button.submit'
        ],
      onClick: () => onRejectSubscription(subscriptionRejection),
    },
    cancelBtn: {
      label:
        Strings[
          'subscription.processRequest.confirmReject.modal.button.cancel'
        ],
      onClick: '',
    },
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <ModalComponent
        data-testid="modal"
        params={params}
        isShowModal={isShowModal}
        closeModal={closeModal}
      >
        {Strings['subscription.processRequest.confirmReject.modal.body']}
      </ModalComponent>
      <SubscriptionRejectForm onSubmit={onSubmit} onChange={onChange}>
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
            {Strings['subscription.processRequest.refuse.button']}
          </Button>
        </div>
      </SubscriptionRejectForm>
    </>
  );
};

export default RequestReject;
