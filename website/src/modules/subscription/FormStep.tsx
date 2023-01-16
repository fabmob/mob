import React, { FC, ReactNode } from 'react';

import Heading from '@components/Heading/Heading';
import SelectField from '@components/SelectField/SelectField';
import TextField from '@components/TextField/TextField';
import Checkbox from '@components/Checkbox/Checkbox';
import DatePickerComponent from '@components/DatePicker/DatePicker';

import { Community } from '@utils/funders';

import Strings from './locale/fr.json';

interface FormStepProps {
  communities: Community[];
  incentiveSpecificFields?: [];
  register?: () => void;
  control?: object;
  errors?: object;
  setValue(): void;
  getDateErrors: (arg: boolean) => void;
}

interface Options {
  id: string;
  inputChoice: string;
}

const FormStep: FC<FormStepProps> = ({
  communities,
  incentiveSpecificFields,
  register,
  control,
  errors,
  setValue,
  getDateErrors,
}) => {
  /**
   * format multichoice option
   * @param options array of options
   * @returns formated array of option
   */
  const formatMultiChoiceOption = (options: Options[] | Community[]) => {
    return options?.map((elm: Options | Community, index: number) => {
      if (elm.inputChoice) {
        return {
          id: index,
          label: elm.inputChoice,
          value: elm.inputChoice,
        };
      }
      return {
        id: index,
        label: elm.name,
        value: elm.name,
      };
    });
  };

  /**
   * Display Specific Fields
   *
   */
  const renderAdditionalInformations = (): ReactNode => {
    const specificFields = incentiveSpecificFields?.map(
      (element: object, index: number) => {
        switch (element.inputFormat) {
          case 'Date':
            return (
              <div className="specificField">
                <DatePickerComponent
                  key={index + '-' + element.name}
                  label={`${element.title}`}
                  {...register(element.name)}
                  name={element.name}
                  required={element.isRequired}
                  control={control}
                  setValue={setValue}
                  errors={errors?.[element.name]}
                  getDateErrors={getDateErrors}
                />
              </div>
            );
          case 'listeChoix':
            return (
              <div className="mcm-filters__dropdown">
                <SelectField
                  id={element.name}
                  key={index + '-' + element.name}
                  label={element.title}
                  name={element.name}
                  options={formatMultiChoiceOption(
                    element?.choiceList?.inputChoiceList
                  )}
                  errors={errors}
                  control={control}
                  required={element.isRequired}
                  isMulti
                  maxLimit={element?.choiceList?.possibleChoicesNumber}
                />
              </div>
            );
          default:
            return (
              <div className="specificField">
                <TextField
                  id={element.title}
                  key={index + '-' + element.name}
                  label={`${element.title} ${element.isRequired ? '*' : ''}`}
                  name={element.name}
                  type="text"
                  errors={errors}
                  control={control}
                  {...register(element.name)}
                />
              </div>
            );
        }
      }
    );
    return specificFields;
  };

  const CheckBoxText = () => {
    return (
      <p>
        {Strings['subscription.first.step.checkbox.cgu']}{' '}
        <a
          id="mentions-legales-cgu"
          href="/mentions-legales-cgu"
          className="link-in-text_blue"
        >
          {Strings['subscription.first.step.link.cgu']}
        </a>
      </p>
    );
  };

  return (
    <div>
      <p className="mb-m">{Strings['subscription.first.step.description']}</p>
      <div className="mcm-demande__fields-section">
        <Heading level="h3" color="blue">
          {Strings['subscription.first.step.additional.informations']}
        </Heading>

        <div className="form-bloc">{renderAdditionalInformations()}</div>

        {communities?.length > 1 && (
          <SelectField
            id="community"
            label={`${Strings['subscription.first.step.label.community']} *`}
            name="community"
            options={formatMultiChoiceOption(communities)}
            errors={errors}
            control={control}
          />
        )}

        <div className="check-tos" data-testid="checkbox-test">
          <Checkbox
            {...register('consent')}
            type="checkbox"
            id="consent"
            name="consent"
            errors={errors}
            children={<CheckBoxText />}
          />
        </div>
      </div>
    </div>
  );
};

export default FormStep;
