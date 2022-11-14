import React, { FC, useState } from 'react';
import TextField from '@components/TextField/TextField';
import Checkbox from '@components/Checkbox/Checkbox';
import SelectField from '@components/SelectField/SelectField';
import TextareaMarkdownField from '@components/TextareaMarkdownField/TextareaMarkdownField';

import {
  MultiplePayment,
  NoPayment,
  SinglePayment,
  FREQUENCY_VALUE,
  PAYMENT_VALUE,
} from '@utils/demandes';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import schema from './schema';
import Strings from './locale/fr.json';

import './_subscription-validate-form.scss';

const SubscriptionValidateForm: FC<any> = ({
  children,
  onSubmit,
  onChange,
}) => {
  const FREQUENCY_OPTION_LIST = [
    { label: 'Mensuelle', value: FREQUENCY_VALUE.MONTHLY },
    { label: 'Trimestrielle', value: FREQUENCY_VALUE.QUARTERLY },
  ];

  const [selectedPayment, setSelectedPayment] = useState<PAYMENT_VALUE>();

  const {
    register,
    unregister,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<SinglePayment | MultiplePayment | NoPayment>({
    criteriaMode: 'all',
    resolver: yupResolver(schema),
  });

  /**
   * Handle radio button changes (unregister input and setSelectedPayment)
   * @param event any
   */
  const handleRadio = (event: any) => {
    const value = event.target.value;

    // Send value to parent
    if (onChange) {
      onChange(value);
    }

    setSelectedPayment(value);

    setValue('mode', value);

    // Unregister input when radio value changes
    if (value === PAYMENT_VALUE.SINGLE) {
      unregister(['frequency', 'amountMultiple', 'lastPayment']);
      register('amountSingle');
    }
    if (value === PAYMENT_VALUE.MULTIPLE) {
      unregister('amountSingle');
      register('frequency');
      register('amountMultiple');
      register('lastPayment');
    }
    if (value === PAYMENT_VALUE.NONE) {
      unregister([
        'amountSingle',
        'frequency',
        'amountMultiple',
        'lastPayment',
      ]);
    }
  };
  return (
    <form
      id="subscription-validate-form"
      className="mcm-subscription-validate__form"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Checkbox
        {...register('mode')}
        type="radio"
        id={PAYMENT_VALUE.SINGLE}
        value={PAYMENT_VALUE.SINGLE}
        label={Strings['subscriptions.validate.modeUnique.label']}
        name="mode"
        onChange={(e: any) => handleRadio(e)}
        errors={errors}
      />
      {/* Show form input amount */}
      {selectedPayment === PAYMENT_VALUE.SINGLE && (
        <TextField
          {...register('amountSingle')}
          id="amountSingle"
          label={Strings['subscriptions.validate.amountSingle.label']}
          type="text"
          name="amountSingle"
          placeholder={
            Strings['subscriptions.validate.amountSingle.placeholder']
          }
          errors={errors}
        />
      )}
      <Checkbox
        {...register('mode')}
        type="radio"
        id={PAYMENT_VALUE.MULTIPLE}
        value={PAYMENT_VALUE.MULTIPLE}
        label={Strings['subscriptions.validate.modeMultiple.label']}
        name="mode"
        onChange={(e: any) => handleRadio(e)}
        errors={errors}
      />
      {/* Show form input multiple amounts */}
      {selectedPayment === PAYMENT_VALUE.MULTIPLE && (
        <>
          <SelectField
            id="frequency"
            label={Strings['subscriptions.validate.frequency.label']}
            name="frequency"
            options={FREQUENCY_OPTION_LIST}
            errors={errors}
            control={control}
          />
          <TextField
            {...register('amountMultiple')}
            id="amountMultiple"
            label={Strings['subscriptions.validate.amountMultiple.label']}
            type="text"
            name="amountMultiple"
            placeholder={
              Strings['subscriptions.validate.amountMultiple.placeholder']
            }
            errors={errors}
          />
          <TextField
            {...register('lastPayment')}
            id="lastPayment"
            label={Strings['subscriptions.validate.lastPayment.label']}
            type="text"
            errors={errors}
            placeholder={
              Strings['subscriptions.validate.lastPayment.placeholder']
            }
          />
        </>
      )}
      <Checkbox
        {...register('mode')}
        type="radio"
        id={PAYMENT_VALUE.NONE}
        value={PAYMENT_VALUE.NONE}
        label={Strings['subscriptions.validate.modeNone.label']}
        name="mode"
        onChange={(e: any) => handleRadio(e)}
        errors={errors}
      />
      <TextareaMarkdownField
        {...register('comments')}
        id="comments"
        placeholder={Strings['subscriptions.validate.comments.placeholder']}
        type="text"
        label={Strings['subscriptions.validate.comments.label']}
        classnames="comments"
        errors={errors}
      />
      {children}
    </form>
  );
};

export default SubscriptionValidateForm;
