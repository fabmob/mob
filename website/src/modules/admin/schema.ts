import * as yup from 'yup';
import { isFuture, isMatch } from 'date-fns';
import Strings from './locale/fr.json';
import { MessageParams } from 'yup/lib/types';

const defaultRequiredMessage = Strings['incentives.error.required'];

// Apply rules to inputs via form resolver. Keys must match input 'name' attributes.
const schema = yup.object().shape({
  title: yup
    .string()
    .min(3, Strings['incentives.error.title.minLength'])
    .required(defaultRequiredMessage),
  description: yup.string().required(defaultRequiredMessage),
  territoryName: yup.string().required(defaultRequiredMessage),
  funderName: yup.string().required(defaultRequiredMessage),
  incentiveType: yup
    .string()
    .required(defaultRequiredMessage)
    .typeError(defaultRequiredMessage),
  conditions: yup.string().required(defaultRequiredMessage),
  paymentMethod: yup.string().required(defaultRequiredMessage),
  allocatedAmount: yup.string().required(defaultRequiredMessage),
  minAmount: yup.string().required(defaultRequiredMessage),
  transportList: yup
    .array()
    .of(
      yup.object().shape({
        value: yup.string().required(),
        label: yup.string().required(),
      })
    )
    .required(defaultRequiredMessage)
    .typeError(defaultRequiredMessage),
  attachments: yup.array().nullable(),
  additionalInfos: yup.string(),
  contact: yup.string(),
  validityDuration: yup.string(),
  validityDate: yup
    .string()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .test(
      'check-is-correct-date',
      (object: MessageParams) => checkIsCorrectDate(object.value).errorMessage,
      (value: string | undefined) => (value ? checkIsCorrectDate(value).isCorrectDate : true)
    )
    .nullable(),
  isMCMStaff: yup.boolean(),
});

function checkIsCorrectDate(value: any) {
  let isCorrectDate = true;
  let errorMessage = Strings['incentives.error.validityDate.format'];
  if (!isMatch(value, 'dd/MM/yyyy')) {
    isCorrectDate = false;
  } else {
    const date = value.split('/');
    const isoDate = `${date[2]}-${date[1]}-${date[0]}`;
    if (!isFuture(new Date(isoDate))) {
      isCorrectDate = false;
      errorMessage = Strings['incentives.error.validityDate.minDate'];
    }
  }
  return { isCorrectDate, errorMessage };
}

export default schema;
