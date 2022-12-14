import * as yup from 'yup';
import Strings from './locale/fr.json';
import { regexSchema } from '../../../constants';

const defaultRequiredMessage = Strings['contact.error.required'];

// Apply rules to inputs via form resolver. Keys must match input 'name' attributes.
const schema = yup.object().shape({
  lastName: yup
    .string()
    .required(defaultRequiredMessage)
    .min(2, Strings['contact.error.lastName.minLength'])
    .matches(regexSchema, Strings['contact.error.invalid.field'])
    .trim(),
  firstName: yup
    .string()
    .required(defaultRequiredMessage)
    .min(2, Strings['contact.error.firstName.minLength'])
    .matches(regexSchema, Strings['contact.error.invalid.field'])
    .trim(),
  userType: yup.string().required(defaultRequiredMessage),
  postcode: yup
    .string()
    .typeError(Strings['contact.error.postcode.type'])
    .matches(/^[0-9]{5}$/, Strings['contact.error.postcode.type'])
    .test('Code postal', Strings['contact.error.postcode.length'], (val) =>
      val ? val.toString().length === 5 : true
    )
    .required(defaultRequiredMessage),
  email: yup
    .string()
    .required(defaultRequiredMessage)
    .email(Strings['contact.error.email.format']),
  message: yup.string(),
  tos: yup
    .bool()
    .oneOf([true], Strings['contact.error.tos.false'])
    .required(defaultRequiredMessage),
});

export default schema;
