import { FieldError } from 'react-hook-form';
import { isEmpty } from 'lodash';

import { ApiError, ErrorTypes } from './api';

/**
 * Utility function permits to add server errors on react-hook-form form.
 *
 * @param errors      Object of errors.
 * @param setError    The function use to set manually errors.
 * @param translation JSON mapper of key value.
 *
 */
interface Error {
  message: string;
  path: string;
}
function computeServerErrorsV2<T>(
  errors: { message: string; path: string | null },
  setError: (fieldName: keyof T, error: FieldError) => void,
  translation: any
): void {
  const { message, path } = errors;
  {
    if (path && !isEmpty(path)) {
      const type = path.substring(1);
      const lmessage = translation[message];
      setError(type as keyof T, {
        type,
        message: lmessage,
        types: {
          [type]: lmessage,
        },
      });
    }
  }
}

function computeServerErrors<T>(
  errors: { [P in keyof T]: ApiError },
  setError: (fieldName: keyof T, error: FieldError) => void,
  translation: any
): void {
  return Object.keys(errors).forEach((key) => {
    const error: ApiError = errors[key as keyof T];
    const lType = (error.code && ErrorTypes[error.code]) || 'server';
    const lMessage = (error.id && translation[error.id]) || error.message;

    setError(key as keyof T, {
      type: lType,
      message: lMessage,
      types: {
        [lType]: lMessage,
      },
    });
  });
}

export { computeServerErrorsV2, computeServerErrors };
