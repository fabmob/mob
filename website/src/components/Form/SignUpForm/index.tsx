import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { format } from 'date-fns';
import { useMutation } from 'react-query';
import { useSession } from '../../../context';

import { computeServerErrorsV2 } from '@utils/form';
import { getEntreprisesList, EntrepriseName } from '@api/EntrepriseService';
import { createCitizen } from '@api/CitizenService';
import { Citizen, CmsType } from '@utils/citoyens';
import { matomoAccountCreation } from '@utils/matomo';
import { formatDate } from '@utils/helpers';

import ProfessionalForm from '@components/Form/ProfessionalForm/ProfessionalForm';
import DatePickerComponent from '../../DatePicker/DatePicker';
import Button from '../../Button/Button';
import TextField from '../../TextField/TextField';
import FormSection from '../../FormSection/FormSection';
import SelectField from '../../SelectField/SelectField';
import Checkbox from '../../Checkbox/Checkbox';

import Strings from './locale/fr.json';
import schema from './schema';

import './_sign-up-form.scss';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import { matomoTrackEvent } from '@utils/matomo';
import { AnyObject } from 'yup/lib/types';
import { StringParam, useQueryParam } from 'use-query-params';
import { CertificationSource } from '@constants';

// Options to inject into "status" select
const statusOptions = [
  { value: 'salarie', label: Strings['status.employee'] },
  { value: 'etudiant', label: Strings['status.student'] },
  { value: 'independantLiberal', label: Strings['status.independent'] },
  { value: 'retraite', label: Strings['status.retired'] },
  { value: 'sansEmploi', label: Strings['status.without.job'] },
];

// Options to inject into "gender" select
const genderOptions = [
  { value: 1, label: Strings['gender.male'] },
  { value: 2, label: Strings['gender.female'] },
];

export interface CompanyOption {
  id: string;
  value: string;
  label: string;
  formats: string[];
}

interface CitizenForm extends Citizen {
  identity: {
    gender: CmsType;
    firstName: CmsType;
    lastName: CmsType;
    birthDate: CmsType;
    birthPlace?: CmsType;
    birthCountry?: CmsType;
  };
  personalInformation: {
    email: CmsType;
  };
  affiliation: {
    enterpriseEmail: string | undefined;
    enterpriseId: string | undefined;
    hasNoEnterpriseEmail?: boolean;
    companyNotFound?: boolean;
  };
  passwordConfirmation?: string;
}

/**
 * Form used for sign-up process
 */
interface SignUpFormProps {
  handleSwitchMode: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({
  handleSwitchMode,
}) => {
  const [companyOptions, setCompanyOption] = useState<CompanyOption[]>([]);
  const [dateErrors, setDateErrors] = useState<boolean>(false);
  const [inscription, setInscription] = useQueryParam(
    'inscription',
    StringParam
  );

  const cmsObject: CmsType = {
    value: '',
    source: CertificationSource.MOB,
    certificationDate: new Date(),
  };

  const {
    register,
    handleSubmit,
    setError,
    control,
    watch,
    formState: { errors },
    setValue,
  } = useForm<CitizenForm>({
    criteriaMode: 'all',
    resolver: yupResolver(schema),
    context: { companyOptions },
  });

  // handle the create citizen query

  const { trackPageView, trackEvent } = useMatomo();

  let userData: Citizen = {};
  const createCitizenMutation = useMutation(
    (user: Citizen) => {
      userData = user;
      return createCitizen(user);
    },
    {
      onSuccess: (data: any) => {
        if (data && data.error && data.error.message) {
          computeServerErrorsV2(data.error, setError, Strings);
        } else {
          handleSwitchMode();
          matomoAccountCreation(trackPageView, userData, companyOptions);
          matomoTrackEvent('inscription', trackEvent, 'citoyen');
          setInscription('success');
        }
      },
      onError: (err: any) => {
        const { data } = err;
        if (data.error && data.error.details) {
          computeServerErrorsV2(data.error.details, setError, Strings);
        }
        computeServerErrorsV2(data.error, setError, Strings);
      },
    }
  );

  const getDateErrors = (errorsDate: boolean) => {
    setDateErrors(errorsDate);
  };

  /**
   * handle the form submit
   * @param userData the form data
   */
  const onSubmit = async (userData: CitizenForm): Promise<void> => {
    if (!dateErrors) {

      const newIdentity: AnyObject = {
        identity: {
          gender: { ...cmsObject },
          firstName: { ...cmsObject },
          lastName: { ...cmsObject },
          birthDate: { ...cmsObject },
          birthPlace: {
            ...cmsObject,
            name: '',
            inseeValue: '',
          },
          birthCountry: {
            ...cmsObject,
            isoValue: '',
            value: '',
          },
        },
        personalInformation: { email: { ...cmsObject } },
      };

      const userDataParsed: CitizenForm = {
        ...userData,
        ...newIdentity,
        affiliation: { ...userData.affiliation },
      }; // clones object without reference
      delete userDataParsed.passwordConfirmation;

      // Gender
      userDataParsed.identity.gender.value = parseInt(
        userData.identity.gender.value
      );

      // LastName
      userDataParsed.identity.lastName.value = userData.identity.lastName.value;

      // FirstName
      userDataParsed.identity.firstName.value =
        userData.identity.firstName.value;
      // email
      userDataParsed.personalInformation.email.value =
        userData.personalInformation.email.value;

      // BirthDate
      const dateValue = formatDate(userData.identity.birthDate.value);

      userDataParsed.identity.birthDate.value = format(
        new Date(dateValue),
        'yyyy-MM-dd'
      );

      // BirthCountry BirthPlace delete value
      delete userDataParsed.identity.birthPlace;
      delete userDataParsed.identity.birthCountry;

      // prepare the right format to fetch
      userDataParsed.affiliation.enterpriseId = companyOptions.find(
        (company: CompanyOption) =>
          userDataParsed.affiliation.enterpriseId === company.value
      )?.id;

      delete userDataParsed.affiliation.companyNotFound;
      delete userDataParsed.affiliation.hasNoEnterpriseEmail;

      createCitizenMutation.mutate(userDataParsed);
    }
  };

  /**
   * Handle change status field.
   *  Populate company field list if user choose company status
   *  Otherwise reset enterpriseEmail and company fields.
   * @param statusOption The value selected by user.
   */
  const onGetEntreprisesList = (): void => {
    getEntreprisesList<EntrepriseName[]>().then(
      (result: EntrepriseName[]) => {
        const company: CompanyOption[] = [];
        result.forEach((item) =>
          company.push({
            id: item.id,
            value: item.name,
            label: item.name,
            formats: item.emailFormat,
          })
        );

        // Sort of company names
        const compareObjects = (item1: any, item2: any, key: string) => {
          const obj1 = item1[key].toUpperCase();
          const obj2 = item2[key].toUpperCase();
          if (obj1 < obj2) {
            return -1;
          }
          if (obj1 > obj2) {
            return 1;
          }
          return 0;
        };
        company.sort((a, b) => compareObjects(a, b, 'label'));
        setCompanyOption(company);
      },
      (error: any) => {}
    );
  };

  useEffect(() => {
    onGetEntreprisesList();
  }, []);

  /**
   * THE COMPONENT RETURN
   */
  return (
    <form className="signup-form" onSubmit={handleSubmit(onSubmit)}>
      <FormSection sectionName={Strings['identity.section']}>
        <SelectField
          id="gender"
          label={Strings['gender.label']}
          name="identity.gender.value"
          options={genderOptions}
          errors={errors}
          control={control}
          required
        />
        <div className="lastName-input-container">
          <TextField
            id="lastName"
            label={Strings['lastName.label']}
            type="text"
            {...register('identity.lastName.value')}
            errors={errors}
            placeholder="Rasovsky"
            required
          />
        </div>
        <TextField
          id="firstName"
          label={Strings['firstName.label']}
          type="text"
          {...register('identity.firstName.value')}
          errors={errors}
          placeholder="Bob"
          required
        />
        <DatePickerComponent
          label={Strings['birthdate.label']}
          {...register('identity.birthDate.value')}
          name="identity.birthDate.value"
          placeholder="JJ/MM/AAAA"
          required
          control={control}
          setValue={setValue}
          errors={errors?.identity?.birthDate?.value}
          getDateErrors={getDateErrors}
          hasAgeCheck
        />
        <TextField
          id="email"
          label={Strings['email.label']}
          type="text"
          {...register('personalInformation.email.value')}
          errors={errors}
          placeholder="exemple@mail.com"
          required
        />

            <TextField
              {...register('password')}
              id="password"
              label={Strings['password.label']}
              type="password"
              errors={errors}
              required
            />
            <TextField
              {...register('passwordConfirmation')}
              id="passwordConfirmation"
              label={Strings['confirme.password.label']}
              type="password"
              errors={errors}
              required
            />
      </FormSection>
      <FormSection sectionName={Strings['address.section']}>
        <TextField
          id="city"
          label={Strings['city.label']}
          type="text"
          {...register('city')}
          errors={errors}
          placeholder="Paris"
          required
        />
        <TextField
          id="postcode"
          label={Strings['postal.code.label']}
          type="text"
          {...register('postcode')}
          errors={errors}
          placeholder="75000"
          required
        />
      </FormSection>
      <FormSection
        sectionName={Strings['professional.activities.section']}
        tooltip={Strings['professional.activities.tooltip']}
        largeSpacing
      >
        <SelectField
          id="status"
          label={Strings['status.question']}
          name="status"
          options={statusOptions}
          errors={errors}
          control={control}
          required
        />
        {/* PROFESSIONAL STATUS FORM */}
        <ProfessionalForm
          register={register}
          control={control}
          errors={errors}
          companyOptions={companyOptions}
          watch={watch}
        />
      </FormSection>
      <Checkbox
        {...register('tos1')}
        type="checkbox"
        id="tos1"
        label=" "
        name="tos1"
        errors={errors}
        children={<CheckBoxTextGeneralConditionOfUse />}
      />
      <Checkbox
        {...register('tos2')}
        type="checkbox"
        id="tos2"
        label=" "
        name="tos2"
        errors={errors}
        children={<CheckBoxTextDataProtection />}
      />
      <div className="reverse-order mt-m">
        <Button
          classnames="margin-button"
          submit
          disabled={createCitizenMutation.isLoading}
        >
          {Strings['send.button']}
        </Button>
        <label className="note-required-field">
          {`* ${Strings['required.field']}`}
        </label>
      </div>
    </form>
  );
};

/**
 * the form general condition text
 */
const CheckBoxTextGeneralConditionOfUse = () => {
  return (
    <p>
      {`${Strings['acknowledge.check']} `}
      <a
        id="mentions-legales-cgu2"
        href="/mentions-legales-cgu"
        target="_blank"
        className="link-in-text_blue"
      >
        {Strings['terms.of.service']}
      </a>
      <span aria-hidden="true"> *</span>
    </p>
  );
};

/**
 * the form data protection text
 */
const CheckBoxTextDataProtection = () => {
  return (
    <p>
      {`${Strings['consent.check']} `}
      <a
        id="protect-donnees-charte2"
        href="/charte-protection-donnees-personnelles"
        target="_blank"
        className="link-in-text_blue"
      >
        {`${Strings['data.protection.policy']} `}
      </a>
      <span aria-hidden="true"> *</span>
    </p>
  );
};

export default SignUpForm;
