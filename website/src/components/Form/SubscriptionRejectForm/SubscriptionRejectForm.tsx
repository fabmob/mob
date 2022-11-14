import React, { FC, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';

import { REASON_REJECT_VALUE } from '@utils/demandes';
import schema from './schema';
import SelectField from '@components/SelectField/SelectField';
import TextareaMarkdownField from '@components/TextareaMarkdownField/TextareaMarkdownField';
import TextField from '@components/TextField/TextField';
import Strings from './locale/fr.json';

import './_subscription-reject-form.scss';

interface SubscriptionRejectFormProps {
  children: {};
  onSubmit: () => void;
  onChange: (value: string) => void;
}

const SubscriptionRejectForm: FC<SubscriptionRejectFormProps> = ({
  children,
  onSubmit,
  onChange,
}) => {
  const REASON_OPTION_LIST = [
    {
      label: Strings['eligibility.conditions'],
      value: REASON_REJECT_VALUE.CONDITION,
    },
    {
      label: Strings['missing.receipt'],
      value: REASON_REJECT_VALUE.MISSING_PROOF,
    },
    {
      label: Strings['invalid.unreadable.receipt'],
      value: REASON_REJECT_VALUE.INVALID_PROOF,
    },
    { label: Strings['other.detail'], value: REASON_REJECT_VALUE.OTHER },
  ];

  const [selectedOther, setSelectedOther] = useState(false);

  const {
    register,
    unregister,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    criteriaMode: 'all',
    resolver: yupResolver(schema),
  });

  const handleSelectChange = ({ value }: { value: string }) => {
    onChange(value);
    if (value == REASON_REJECT_VALUE.OTHER) {
      register('type');
      return setSelectedOther(true);
    }
    unregister('other');
    return setSelectedOther(false);
  };

  return (
    <form
      id="subscription-reject-form"
      className="mcm-subscription-reject__form"
      onSubmit={handleSubmit(onSubmit)}
    >
      <SelectField
        id="type"
        label={Strings['subscriptions.reject.type.label']}
        name="type"
        placeholder={Strings['subscriptions.reject.type.placeholder']}
        onSelectChange={handleSelectChange}
        options={REASON_OPTION_LIST}
        errors={errors}
        control={control}
      />
      {selectedOther && (
        <TextField
          {...register('other')}
          id={REASON_REJECT_VALUE.OTHER}
          type="text"
          errors={errors}
          control={control}
          classnames="other"
          placeholder={Strings['subscriptions.reject.other.placeholder']}
          maxLength="80"
        />
      )}
      <TextareaMarkdownField
        {...register('comments')}
        id="comments"
        placeholder={Strings['subscriptions.reject.comments.placeholder']}
        type="text"
        label={Strings['subscriptions.reject.comments.label']}
        classnames="comments"
        errors={errors}
      />
      {children}
    </form>
  );
};

export default SubscriptionRejectForm;
