import * as yup from 'yup';
import { compareAsc, add, isMatch, parse } from 'date-fns';
import Strings from './locale/fr.json';
import { PAYMENT_VALUE } from '@utils/demandes';
import { regexAmount } from '../../../constants';
const defaultRequiredMessage = Strings['subscriptions.error.required'];
const defaultMinialValueMessage = Strings['subscriptions.error.minimalValue'];
const schema = yup.object().shape(
  {
    mode: yup.string().required(defaultRequiredMessage),
    amountSingle: yup.string().when('amountSingle', {
      is: (value: any) => value !== '',
      then: yup
        .string()
        .transform((_value, originalValue) => originalValue.replace(/,/, '.'))
        .typeError(defaultRequiredMessage)
        .matches(regexAmount, Strings['subscriptions.validate.error.field'])
        .test(
          'amountSingle',
          defaultMinialValueMessage,
          (value) => Number(value) !== 0
        ),
    }),
    frequency: yup.string().when('mode', {
      is: PAYMENT_VALUE.MULTIPLE,
      then: yup.string().required(defaultRequiredMessage),
      otherwise: yup.string().nullable(),
    }),
    amountMultiple: yup.string().when('amountMultiple', {
      is: (value: any) => value !== '',
      then: yup
        .string()
        .transform((_value, originalValue) => originalValue.replace(/,/, '.'))
        .typeError(defaultRequiredMessage)
        .matches(regexAmount, Strings['subscriptions.validate.error.field'])
        .test(
          'amountMultiple',
          defaultMinialValueMessage,
          (value) => Number(value) !== 0
        ),
    }),
    lastPayment: yup.string().when('mode', {
      is: PAYMENT_VALUE.MULTIPLE,
      then: yup
        .string()
        .required(defaultRequiredMessage)
        .test(
          'lastPayment format',
          Strings['subscriptions.error.lastPayment.format'],
          (value) => (value ? isMatch(value, 'dd/MM/yyyy') : true)
        )
        .test(
          'minimal date for lastPayment',
          Strings['subscriptions.error.lastPayment.minimalDate'],
          (value) => checkMinimalDate(value)
        ),
      otherwise: yup.string().nullable(),
    }),
  },
  [
    // Add Cyclic deps when property require itself
    ['amountSingle', 'amountSingle'],
    ['amountMultiple', 'amountMultiple'],
  ]
);
/**
 * Date must be superior to today + 2months
 * Check is done when isMatch validator is ok
 * @param date string
 * @returns boolean
 */
const checkMinimalDate = (date: string | undefined): boolean => {
  if (date && isMatch(date, 'dd/MM/yyyy')) {
    const parsedDate = parse(date, 'dd/MM/yyyy', new Date());
    const minimalDate = add(new Date(), { months: 2 });
    return compareAsc(new Date(parsedDate), minimalDate) === 1;
  }
  return true;
};
export default schema;
