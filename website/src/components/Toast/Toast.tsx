import React, { FC } from 'react';
import { Toaster, ToastBar } from 'react-hot-toast';

import SVG from '../SVG/SVG';
import './_toast.scss';

const toastOptions = {
  style: {
    color: '#fff',
    borderRadius: '0',
    minWidth: `-webkit-fill-available`,
    padding: '25px',
  },
  loading: {
    style: {
      background: '#74747f',
    },
  },
  success: {
    style: {
      background: '#01bf7d',
    },
  },
  error: {
    style: {
      background: '#e74c3c',
    },
  },
};
const containerStyle = {
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
};

const Toast: FC = () => {
  return (
    <Toaster
      position="top-center"
      toastOptions={toastOptions}
      containerStyle={containerStyle}
    >
      {(t) => {
        const icon =
          t.type === 'success'
            ? 'success-versed'
            : t.type === 'error'
            ? 'warning-versed'
            : 'information';
        return (
          <ToastBar toast={t}>
            {({ message }) => (
              <div id="toast-mcm" className="custom-toast">
                <div className="flex">
                  <SVG icon={icon} size={25} className="pt-tiny" />
                  <div className="pl-s">{message}</div>
                </div>
              </div>
            )}
          </ToastBar>
        );
      }}
    </Toaster>
  );
};

export default Toast;
