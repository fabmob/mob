import * as yup from 'yup';
import Strings from './locale/fr.json';
import { REASON_REJECT_VALUE } from '@utils/demandes';

const defaultRequiredMessage = Strings['subscriptions.error.required'];

const schema = yup.object().shape({
  type: yup.string().required(defaultRequiredMessage),

  other: yup.string().when('type', {
    is: REASON_REJECT_VALUE.OTHER,
    then: yup.string().required(defaultRequiredMessage),
    otherwise: yup.string().nullable(),
  }),
});

export default schema;
