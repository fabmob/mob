/* eslint-disable */
import { FC, useEffect, useState } from 'react';
import {
  required,
  useNotify,
  BooleanInput,
  SelectInput,
  AutocompleteArrayInput,
  ArrayInput,
  SimpleFormIterator,
  FormDataConsumer,
} from 'react-admin';
import { useForm, useFormState } from 'react-final-form';
import { useQuery } from 'react-query';
import { Box, Tooltip } from '@material-ui/core';
import { InfoRounded } from '@material-ui/icons';
import {
  getIncentives,
  getIncentiveEligibilityChecks,
} from '../../api/incentives';
import CustomAddButton from './CustomAddButton';
import AideMessages from '../../utils/Aide/fr.json';
import { SUBSCRIPTION_CHECK_MODE } from '../../utils/constant';
import {
  EligibilityChecks,
  Incentive,
  IncentiveEligibilityChecks,
} from '../../utils/helpers';
import '../styles/DynamicForm.css';

const SubscriptionModeForm: FC = () => {
  const notify = useNotify();
  const form = useForm();
  const { values } = useFormState();

  const [INCENTIVE_CHOICE, setIncentiveChoice] = useState<Incentive[]>([]);

  const [incentiveChecks, setIncentiveChecks] = useState<
    IncentiveEligibilityChecks[]
  >([]);

  const { data: incentives } = useQuery(
    'incentives',
    async (): Promise<Incentive[]> => {
      return await getIncentives();
    },
    {
      onError: () => {
        notify(AideMessages['incentives.error'], 'error');
      },
      enabled: true,
    }
  );

  const { data: incentiveEligibilityChecks } = useQuery(
    'incentive_eligibility_checks',
    async (): Promise<IncentiveEligibilityChecks[]> => {
      return await getIncentiveEligibilityChecks();
    },
    {
      onError: () => {
        notify(AideMessages['incentiveEligibilityChecks.error'], 'error');
      },
      enabled: true,
    }
  );

  useEffect(() => {
    setIncentiveChoice(
      incentives &&
        incentives
          .map((incentive) => {
            // Exclude incentive which is in edition mode from incentive exclusivity choice list (for creation mode values.id doesn't exist)
            if (!values?.id || (values?.id && values.id !== incentive.id)) {
              const element: string = `${
                incentive.funderName
              } - ${incentive.title.substring(0, 50)}`;
              incentive.label = element;
              incentive.name = element;
              return incentive;
            }
          })
          .filter((el) => el !== undefined)
    );
  }, [incentives]);

  useEffect(() => {
    setIncentiveChecks(incentiveEligibilityChecks);
  }, [incentiveEligibilityChecks]);

  const handleChangeSubscriptionCheckMode = () => {
    form.change('eligibilityChecks', undefined);
  };

  const getIncentiveEligibilityChecksData = (
    value: string
  ): IncentiveEligibilityChecks => {
    const data: IncentiveEligibilityChecks = incentiveChecks?.find(
      (element) => element.id === value
    );
    return data;
  };

  const validateActiveChecks = (value, allValues): string | undefined => {
    if (value === SUBSCRIPTION_CHECK_MODE[1].id) {
      const activeEligibilityChecks: EligibilityChecks[] =
        allValues?.eligibilityChecks?.filter((element) => element?.active);
      if (!activeEligibilityChecks?.length) {
        return AideMessages['incentives.error.min.required.eligibilityChecks'];
      }
    }
    return undefined;
  };

  const handleChangeIncentiveChecks = (event) => {
    const element: string = event.target.name.split('.')[0];
    form.change(`${element}.value`, undefined);
  };

  return (
    <Box maxWidth={700}>
      <Box display="flex">
        <SelectInput
          source="subscriptionCheckMode"
          label="Mode de vérification des souscriptions"
          fullWidth
          choices={SUBSCRIPTION_CHECK_MODE}
          onChange={handleChangeSubscriptionCheckMode}
          defaultValue={SUBSCRIPTION_CHECK_MODE[0].id}
          validate={[validateActiveChecks]}
        />
      </Box>
      <FormDataConsumer>
        {({ formData, ...rest }) =>
          formData?.subscriptionCheckMode === SUBSCRIPTION_CHECK_MODE[1].id && (
            <>
              <Box
                display="flex"
                alignItems="center"
                maxWidth={700}
                height={60}
              >
                <h3 className="eligibilityTitle">
                  Vérifications d'éligibilité
                </h3>

                <Tooltip title="Les contrôles ci-dessous seront exécutés par moB dans l'ordre d'affichage">
                  <InfoRounded color="primary" />
                </Tooltip>
              </Box>
              <Box display="flex">
                <ArrayInput source="eligibilityChecks" label="">
                  <SimpleFormIterator
                    className="simpleForm"
                    addButton={
                      <CustomAddButton
                        label={'Ajouter un contrôle'}
                        disabled={
                          values?.eligibilityChecks?.length ===
                          incentiveChecks?.length
                        }
                      />
                    }
                  >
                    <SelectInput
                      source="id"
                      label="Contrôles"
                      fullWidth
                      validate={[required()]}
                      choices={incentiveChecks}
                      onChange={handleChangeIncentiveChecks}
                    />
                    <FormDataConsumer>
                      {({ formData, scopedFormData, getSource, ...rest }) => (
                        <>
                          {getIncentiveEligibilityChecksData(
                            scopedFormData?.id
                          ) && (
                            <>
                              <div>
                                <span>Description :</span>
                                <p className="eligibilityDescription">
                                  {
                                    getIncentiveEligibilityChecksData(
                                      scopedFormData?.id
                                    )?.description
                                  }
                                </p>
                              </div>
                              {getIncentiveEligibilityChecksData(
                                scopedFormData?.id
                              )?.type === 'array' && (
                                <>
                                  <AutocompleteArrayInput
                                    source={getSource('value')}
                                    label="Choisissez les aides mutuellement exclusives"
                                    fullWidth
                                    validate={[required()]}
                                    choices={INCENTIVE_CHOICE}
                                  />
                                </>
                              )}
                              <BooleanInput
                                source={getSource('active')}
                                label="Actif"
                                initialValue={false}
                              />
                            </>
                          )}
                        </>
                      )}
                    </FormDataConsumer>
                  </SimpleFormIterator>
                </ArrayInput>
              </Box>
            </>
          )
        }
      </FormDataConsumer>
    </Box>
  );
};

export default SubscriptionModeForm;
