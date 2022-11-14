import React, { FC } from 'react';

import Checkbox from '@components/Checkbox/Checkbox';
import SelectField from '@components/SelectField/SelectField';
import TextField from '@components/TextField/TextField';

import Strings from './locale/fr.json';

/**
 * INTERFACE
 *
 *
 *
 *
 */
interface ProfessionalFormProps {
  register: () => void;
  control: object;
  errors: object;
  companyOptions: object[];
  watch: () => void;
}

/**
 * Generic component used to render a card with the following attributes.
 * @constructor
 */
const ProfessionalForm: FC<ProfessionalFormProps> = ({
  register,
  control,
  errors,
  companyOptions,
  watch,
}) => {
  /**
   * VARIABLES
   *
   *
   *
   *
   */
  const watchedFormData = watch();
  const { affiliation } = watchedFormData;
  /**
   * RENDER
   *
   *
   *
   *
   */
  return (
    <>
      <SelectField
        control={control}
        id="enterpriseId"
        label={Strings['pro.form.label.company']}
        name="affiliation.enterpriseId"
        errors={affiliation?.companyNotFound ? {} : errors}
        classnames="field--new-line"
        placeholder={Strings['pro.form.placeholder.company']}
        options={companyOptions}
        isLoading={companyOptions.length === 0}
        isSearchable
        isClearable
        required
        disabled={affiliation?.companyNotFound}
      />

      <Checkbox
        type="checkbox"
        id="companyNotFound"
        label={Strings['pro.form.label.no.company']}
        {...register('affiliation.companyNotFound')}
        errors={errors}
        disabled={affiliation?.enterpriseId}
      />

      <TextField
        id="enterpriseEmail"
        label={Strings['pro.form.label.email']}
        type="text"
        {...register('affiliation.enterpriseEmail')}
        errors={affiliation?.hasNoEnterpriseEmail ? {} : errors}
        placeholder={Strings['pro.form.label.email']}
        classnames="field--new-line"
        required
        disabled={affiliation?.hasNoEnterpriseEmail}
      />

      <Checkbox
        type="checkbox"
        id="hasNoEnterpriseEmail"
        label={Strings['pro.form.label.no.email']}
        {...register('affiliation.hasNoEnterpriseEmail')}
        errors={errors}
        disabled={affiliation?.enterpriseEmail}
      />
    </>
  );
};

export default ProfessionalForm;
