import * as yup from 'yup';
import { isMatch } from 'date-fns';

import { validateEmailPattern } from '../../../utils/form';

import Strings from './locale/fr.json';

interface CompanyOption {
  id: string;
  value: string;
  label: string;
  formats: string[];
}

const checkAgeCitizen = (value: string | undefined, dateFormat: string) => {
  if (value && isMatch(value, dateFormat)) {
    const [day, month, year] = value.split('/');
    const birthDate = new Date(year, month - 1, day);
    const actualDate = new Date();

    actualDate.setFullYear(actualDate.getFullYear() - 16);
    return actualDate.getTime() - birthDate.getTime() >= 0;
  }

  return true;
};

const defaultRequiredMessage = Strings['citizens.error.required'];
const dateFormat = 'dd/MM/yyyy';

// Apply rules to inputs via form resolver. Keys must match input 'name' attributes.
const schema = yup.object().shape({
  firstName: yup.string().required(defaultRequiredMessage),
  lastName: yup.string().required(defaultRequiredMessage),
  birthdate: yup
    .string()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .required(Strings['citizens.error.birthdate.required'])
    .test(
      'format of the birth date',
      Strings['citizens.error.birthdate.format'],
      (value) => (value ? isMatch(value, dateFormat) : true)
    )
    .test(
      'age of the citizen',
      Strings['citizens.error.birthdate.age'],
      (value) => checkAgeCitizen(value, dateFormat)
    )
    .nullable(),
  email: yup
    .string()
    .required(defaultRequiredMessage)
    .email(Strings['email.error.format']),
  city: yup.string().required(defaultRequiredMessage),
  postcode: yup
    .string()
    .required(defaultRequiredMessage)
    .matches(/^[0-9]{5}$/, Strings['citizens.error.postcode.format']),
  status: yup.string().required(defaultRequiredMessage).nullable(),
  affiliation: yup.object({
    companyNotFound: yup.bool(),
    hasNoEnterpriseEmail: yup.bool(),
    enterpriseId: yup.string().when('companyNotFound', {
      is: (companyNotFound: boolean) => companyNotFound === false,
      then: yup.string().required(defaultRequiredMessage),
      otherwise: yup.string().nullable(),
    }),
    enterpriseEmail: yup
      .string()
      .email(Strings['email.error.format'])
      .when('hasNoEnterpriseEmail', {
        is: (hasNoEnterpriseEmail: boolean) => hasNoEnterpriseEmail === false,
        then: yup.string().required(defaultRequiredMessage),
        otherwise: yup.string().nullable(),
      })
      .test(
        'pattern-company',
        Strings['citizens.error.enterpriseEmail.pattern'],
        (email: string | undefined, testContext: yup.TestContext) => {
          const { enterpriseId } = testContext.parent;
          const { companyOptions } = testContext.options.context! as {
            companyOptions: CompanyOption[];
          };
          if (email && companyOptions?.length) {
            return validateEmailPattern(email, companyOptions, enterpriseId);
          }
          return true;
        }
      ),
  }),
  tos1: yup.bool().oneOf([true], Strings['citizens.error.tos1.false']),
  tos2: yup.bool().oneOf([true], Strings['citizens.error.tos2.false']),
  password: yup.string().required(defaultRequiredMessage),
  passwordConfirmation: yup
    .string()
    .required(defaultRequiredMessage)
    .oneOf([yup.ref('password')], Strings['citizens.error.confirmPassword']),
});

export default schema;
