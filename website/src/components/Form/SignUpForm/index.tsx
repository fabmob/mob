import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { format } from 'date-fns';
import { useMutation } from 'react-query';

import { computeServerErrorsV2 } from '@utils/form';
import { getEntreprisesList, EntrepriseName } from '@api/EntrepriseService';
import { createCitizen } from '@api/CitizenService';
import { Citizen } from '@utils/citoyens';
import ProfessionalForm from '@components/Form/ProfessionalForm/ProfessionalForm';

import Button from '../../Button/Button';
import TextField from '../../TextField/TextField';
import FormSection from '../../FormSection/FormSection';
import SelectField from '../../SelectField/SelectField';
import Checkbox from '../../Checkbox/Checkbox';

import Strings from './locale/fr.json';
import schema from './schema';

import './_sign-up-form.scss';

// Options to inject into "status" select
const statusOptions = [
  { value: 'salarie', label: Strings['status.employee'] },
  { value: 'etudiant', label: Strings['status.student'] },
  { value: 'independantLiberal', label: Strings['status.independent'] },
  { value: 'retraite', label: Strings['status.retired'] },
  { value: 'sansEmploi', label: Strings['status.without.job'] },
];

export interface CompanyOption {
  id: string;
  value: string;
  label: string;
  formats: string[];
}

interface CitizenForm extends Citizen {
  firstName: string;
  lastName: string;
  affiliation: {
    enterpriseEmail: string | undefined;
    enterpriseId: string | undefined;
    hasNoEnterpriseEmail?: boolean;
    companyNotFound?: boolean;
  };
  passwordConfirmation?: string;
  birthdate: string;
}

/**
 * Form used for sign-up process
 */
interface SignUpFormProps {
  handleSwitchMode: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ handleSwitchMode }) => {
  /**
   * COMPONENT STATE
   *
   *
   *
   *
   *
   */
  const [companyOptions, setCompanyOption] = useState<CompanyOption[]>([]);

  /**
   * FORM STATE
   *
   *
   *
   *
   */
  const {
    register,
    handleSubmit,
    setError,
    control,
    watch,
    formState: { errors },
  } = useForm<CitizenForm>({
    criteriaMode: 'all',
    resolver: yupResolver(schema),
    context: { companyOptions },
  });

  /**
   * FUNCTIONS
   *
   *
   *
   * handle the create citizen query
   */
  const createCitizenMutation = useMutation(
    (user: Citizen) => {
      return createCitizen(user);
    },
    {
      onSuccess: (data: any) => {
        if (data && data.error && data.error.message) {
          computeServerErrorsV2(data.error, setError, Strings);
        } else {
          handleSwitchMode();
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

  /**
   * handle the form submit
   * @param userData the form data
   */
  const onSubmit = async (userData: CitizenForm): Promise<void> => {
    const userDataParsed: CitizenForm = { ...userData }; // clones object without reference
    delete userDataParsed.passwordConfirmation;

    const [day, month, year] = userDataParsed.birthdate.split('/');
    const birthDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    );

    userDataParsed.birthdate = format(birthDate, 'yyyy-MM-dd'); // prepare the right format to fetch
    userDataParsed.affiliation.enterpriseId = companyOptions.find(
      (company: CompanyOption) =>
        userDataParsed.affiliation.enterpriseId === company.value
    )?.id;

    delete userDataParsed.affiliation.companyNotFound;
    delete userDataParsed.affiliation.hasNoEnterpriseEmail;

    createCitizenMutation.mutate(userDataParsed);
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
        const company: any[] = [];
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

  /**
   * USE EFFECTS
   *
   *
   *
   *
   */
  useEffect(() => {
    onGetEntreprisesList();
  }, []);

  /**
   * THE COMPONENT RETURN
   */
  return (
    <form className="signup-form" onSubmit={handleSubmit(onSubmit)}>
      <FormSection sectionName={Strings['identity.section']}>
        <TextField
          id="lastName"
          label={Strings['lastName.label']}
          type="text"
          {...register('lastName')}
          errors={errors}
          placeholder="Rasovsky"
          required
        />
        <TextField
          id="firstName"
          label={Strings['firstName.label']}
          type="text"
          {...register('firstName')}
          errors={errors}
          placeholder="Bob"
          required
        />
        <TextField
          id="birthdate"
          label={Strings['birthdate.label']}
          type="text"
          {...register('birthdate')}
          errors={errors}
          placeholder="JJ/MM/AAAA"
          required
        />
        <TextField
          id="email"
          label={Strings['email.label']}
          type="email"
          {...register('email')}
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
