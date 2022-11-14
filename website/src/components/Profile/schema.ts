import * as yup from 'yup';

import { validateEmailPattern } from '../../utils/form';

import Strings from './locale/fr.json';

const defaultRequiredMessage = Strings['citizens.error.required'];

interface CompanyOption {
  id: string;
  value: string;
  label: string;
  formats: string[];
}

/**
 * apply rules to inputs via form resolver.
 * Keys must match input 'city' attributes
 * Keys must match input 'postCode' attributes
 * Keys must match input 'idCompany' attributes
 * Keys must match input 'companyNotFound' attributes
 * Keys must match input 'emailCompany' attributes
 * Keys must match input 'hasNoEmailCompany' attributes
 */
const schema = yup.object().shape({
  city: yup.string().required(defaultRequiredMessage),
  postcode: yup
    .string()
    .required(defaultRequiredMessage)
    .matches(/^[0-9]{5}$/, Strings['citoyens.error.postcode.format']),
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
        Strings['citoyens.error.emailCompany.pattern'],
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
});

export default schema;
