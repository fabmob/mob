import React from 'react';
import Modal from 'react-modal';

import Button from '../Button/Button';
import SVG from '../SVG/SVG';

import './_modal.scss';

export interface ParamsModal {
  title: string;
  subtitle: string;
  firstName: { name: string; value: string };
  lastName: { name: string; value: string };
  email: { name: string; value: string };
  birthdate: { name: string; value: string };
  submitBtn: {
    label: string;
    onClick(): void;
  };
  rejectBtn?: {
    label: string;
    onClick(): void;
  };
  cancelBtn: {
    label: string;
    onClick(): void;
  };
}

interface ModalProps {
  /** Primary content. */
  params: ParamsModal;
  isShowModal: boolean;
  closeModal(): void;
  data: string;
  children?: React.ReactNode;
  withTitleIcon?: boolean;
  isDisabled?: boolean;
}

/**
 * @constructor
 */
const ModalComponent: React.FC<ModalProps> = ({
  params,
  isShowModal,
  closeModal,
  children,
  withTitleIcon = true,
  isDisabled = false,
}) => {
  /**
   * FUNCTIONS
   *
   *
   *
   *
   */
  const onCloseModal = () => {
    closeModal();
  };

  /**
   * COMPONENT RETURN
   *
   *
   *
   *
   */
  return (
    <div>
      <Modal
        isOpen={isShowModal}
        onRequestClose={onCloseModal}
        ariaHideApp={false}
        className="content"
        overlayClassName="overlay"
      >
        <div className="modal-header">
          {params.title && (
            <div className="align-title-icon">
              {withTitleIcon && <SVG icon="warning" width="30" height="40" />}
              <h2>{params?.title}</h2>
            </div>
          )}
          <SVG icon="close" width="40" height="50" onClick={onCloseModal} />
          {params.subtitle && (
            <div className="modal-subtitle">
              <h3>{params?.subtitle}</h3>
            </div>
          )}
        </div>
        <div className="modal-body">{children}</div>
        {params.lastName && (
          <div className="modal-content">
            <ul>
              <li>
                {params.lastName && (
                  <div className="modal-list ">
                    <span className="modal-span">{params.lastName.name}</span>
                    <span>{params?.lastName.value}</span>
                  </div>
                )}
              </li>
              <li>
                {params.firstName && (
                  <div className="modal-list ">
                    <span className="modal-span">{params.firstName.name}</span>
                    <span>{params?.firstName.value}</span>
                  </div>
                )}
              </li>
              <li>
                {params.birthdate && (
                  <div className="modal-list ">
                    <span className="modal-span">{params.birthdate.name}</span>
                    <span>{params?.birthdate.value}</span>
                  </div>
                )}
              </li>
              <li>
                {params.email && (
                  <div className="modal-list ">
                    <span className="modal-span">{params.email.name}</span>
                    <span>{params?.email.value}</span>
                  </div>
                )}
              </li>
            </ul>
          </div>
        )}

        <div className="modal-footer">
          {params.submitBtn && (
            <div className="submit-btn">
              <Button
                submit
                onClick={params?.submitBtn?.onClick}
                disabled={isDisabled}
              >
                {params?.submitBtn?.label}
              </Button>
            </div>
          )}
          {params?.rejectBtn && (
            <div className="reject-btn">
              <Button
                submit
                onClick={params?.rejectBtn?.onClick}
                disabled={isDisabled}
              >
                {params?.rejectBtn?.label}
              </Button>
            </div>
          )}
          {params.cancelBtn && (
            <div className="cancel-btn">
              <Button secondary onClick={onCloseModal}>
                {params?.cancelBtn?.label}
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ModalComponent;
