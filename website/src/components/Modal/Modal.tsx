import React from 'react';
import Modal from 'react-modal';

import Button from '../Button/Button';
import SVG from '../SVG/SVG';

import './_modal.scss';

export interface ParamsModal {
  title: string;
  subtitle: string;
  submitBtn: {
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
        </div>
        {params.subtitle && (
          <div className="modal-subtitle">
            <h3>{params?.subtitle}</h3>
          </div>
        )}
        <div className="modal-body">{children}</div>
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
