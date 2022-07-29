import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';

import Button from '../../Button/Button';
import TextField from '../../TextField/TextField';
import FormSection from '../../FormSection/FormSection';
import Checkbox from '../../Checkbox/Checkbox';
import schema from './schema';
import { Contact, send } from '@api/ContactService';
import { computeServerErrors } from '../../../utils/form';
import Strings from './locale/fr.json';

/**
 * Form used for contact process
 */
const ContactForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitSuccessful },
  } = useForm<Contact>({
    criteriaMode: 'all',
    resolver: yupResolver(schema),
  });
  const [disabled, setDisabled] = useState<boolean>(false);

  const onSubmit = async (contactData: Contact): Promise<void> => {
    setDisabled(true);
    send(contactData)
      .then((contact) => {
        if (contact.errors) {
          computeServerErrors(contact.errors, setError, Strings);
        } else {
          toast.success(Strings['success.message']);
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setDisabled(false);
      });
  };

  useEffect(() => {
    // Make sure that form was successfully submitted and active in same time.
    if (isSubmitSuccessful && !disabled) {
      reset();
    }
  }, [disabled]);

  return (
    <form className="contact-form" onSubmit={handleSubmit(onSubmit)}>
      <fieldset className="fieldset">
        <legend className="form-section-title">{Strings['you.are']}</legend>
        <div className="form-btn-radio">
          <Checkbox
            {...register('userType')}
            type="radio"
            id="citoyen"
            value="citoyen"
            label={Strings['a.citizen']}
            name="userType"
            checked
            errors={errors}
          />
          <Checkbox
            {...register('userType')}
            type="radio"
            id="employeur"
            value="employeur"
            label={Strings['an.employer']}
            name="userType"
            errors={errors}
          />
          <Checkbox
            {...register('userType')}
            type="radio"
            id="collectivite"
            value="collectivite"
            label={Strings['a.community']}
            name="userType"
            errors={errors}
          />
          <Checkbox
            {...register('userType')}
            type="radio"
            id="operateur-de-mobilite"
            value="operateurMobilite"
            label={Strings['mobility.operator']}
            name="userType"
            errors={errors}
          />
        </div>
      </fieldset>
      <FormSection sectionName="">
        <TextField
          {...register('lastName')}
          id="lastName"
          label={`${Strings['lastName.label']} *`}
          type="text"
          name="lastName"
          placeholder="Rasovsky"
          errors={errors}
        />
        <TextField
          {...register('firstName')}
          id="firstName"
          label={`${Strings['firstName.label']} *`}
          type="text"
          name="firstName"
          placeholder="Bob"
          errors={errors}
        />
        <TextField
          {...register('email')}
          id="email"
          label={`${Strings['email.label']} *`}
          type="email"
          name="email"
          errors={errors}
          placeholder="exemple@mail.com"
        />
        <TextField
          {...register('postcode')}
          id="postcode"
          label={`${Strings['postal.code.label']} *`}
          type="text"
          name="postcode"
          placeholder="75000"
          errors={errors}
        />
      </FormSection>

      <fieldset className="fieldset">
        <legend className="form-section-title">
          {Strings['your.message']}
        </legend>
        <textarea
          {...register('message')}
          id="message"
          name="message"
          className="contact-message"
          placeholder={Strings['message.subject']}
        />
      </fieldset>
      <div className="check-tos" data-testid="checkbox-test">
        <Checkbox
          {...register('tos')}
          type="checkbox"
          id="tos"
          name="tos"
          errors={errors}
          children={<CheckBoxText />}
        />
      </div>
      <div className="btn-send-message">
        <Button classnames="mt-m" submit disabled={disabled}>
          {Strings['send.button']}
        </Button>
        <span>{`* ${Strings['message.subject']}`}</span>
      </div>
    </form>
  );
};

const CheckBoxText = () => {
  return (
    <p>
      {`${Strings['acknowledge.check']} `}
      <a
        id="mentions-legales-cgu3"
        href="/mentions-legales-cgu"
        target="_blank"
        rel="noreferrer"
        className="link-in-text_blue"
      >
        {`${Strings['terms.of.service']} `}
      </a>
      {`${Strings['of.site']} `}
      <a
        id="protection-donnees3"
        href="/charte-protection-donnees-personnelles"
        target="_blank"
        rel="noreferrer"
        className="link-in-text_blue"
      >
        {`${Strings['personal.data.charter']} `}
      </a>{' '}
      {` ${Strings['and.accepte']} *`}
    </p>
  );
};

export default ContactForm;
