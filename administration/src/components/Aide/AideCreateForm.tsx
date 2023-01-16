/* eslint-disable */
import React, { useEffect, useState } from 'react';
import {
  TextInput,
  required,
  DateInput,
  SelectInput,
  BooleanInput,
  NumberInput,
  AutocompleteArrayInput,
  AutocompleteInput,
  ArrayInput,
  SimpleFormIterator,
  FormDataConsumer,
  useNotify,
} from 'react-admin';
import { useForm, useFormState } from 'react-final-form';
import { CardContent, Box } from '@material-ui/core';
import { useQuery } from 'react-query';

import {
  TRANSPORT_CHOICE,
  INCENTIVE_TYPE_CHOICE,
  PROOF_CHOICE,
  INPUT_FORMAT_CHOICE,
} from '../../utils/constant';
import { getDate } from '../../utils/convertDateToString';
import {
  startDateMin,
  dateMinValidation,
} from '../../utils/Aide/validityDateRules';
import { validateUrl } from '../../utils/Aide/formHelper';
import CustomAddButton from '../common/CustomAddButton';
import { getFunders } from '../../api/financeurs';
import FinanceurMessages from '../../utils/Financeur/fr.json';
import AidesMessages from '../../utils/Aide/fr.json';

import '../styles/DynamicForm.css';
import TerritoriesDropDown from '../common/TerritoriesDropDown';
import SubscriptionModeForm from '../common/SubscriptionModeForm';

const AideCreateForm = (save, record) => {
  const notify = useNotify();
  const form = useForm();
  
  const [selectFinanceur, setSelectFinanceur] = useState('AideNationale');
  const { values } = useFormState();
  const [FUNDER_CHOICE, setFunderChoice] = useState<
    { name: string; label: string }[]
  >([]);
  const [isMobilityChecked, setIsMobilityChecked] = React.useState(false);
  const [isCertifiedTimestampChecked, setIsCertifiedTimestampChecked] =
    React.useState(false);

  const { data: funders } = useQuery(
    'funders',
    async (): Promise<any> => {
      return await getFunders();
    },
    {
      onError: () => {
        notify(FinanceurMessages['funders.error'], 'error');
      },
      enabled: true,
      retry: false,
      staleTime: Infinity,
    }
  );

  useEffect(() => {
    setFunderChoice(
      funders &&
        funders.map((elt) => {
          elt.label = elt.funderType
            ? `${elt.name} (${elt.funderType})`
            : elt.name;
          return elt;
        })
    );
  }, [funders]);

  const handleShowMobilityInputs = () => {
    form.change('subscriptionLink', undefined);
    form.change('specificFields', undefined);
    form.change('subscriptionCheckMode', undefined);
    form.change('eligibilityChecks', undefined);
    setIsMobilityChecked(!isMobilityChecked);
  };

  const validateFunder = (value): string | undefined => {
    if (isMobilityChecked && value) {
      const existFunder = funders.find((element) => element.name === value);
      return existFunder?.id
        ? undefined
        : AidesMessages['incentives.error.funderid.notfound'];
    }
    return undefined;
  };

  return (
    <Box mt={2} display="flex">
      <Box flex="1">
        <CardContent>
          <Box display="flex">
            <Box flex="1" mt={-1}>
              <Box maxWidth={700}>
                <TextInput
                  source="title"
                  label="Nom de l'aide"
                  fullWidth
                  validate={[required()]}
                />
                <TextInput
                  source="description"
                  label="Proposition de valeur"
                  validate={[required()]}
                  multiline
                  fullWidth
                />
                <SelectInput
                  source="incentiveType"
                  label="Financeur"
                  fullWidth
                  validate={[required()]}
                  choices={INCENTIVE_TYPE_CHOICE}
                  onChange={(event) => setSelectFinanceur(event.target.value)}
                />
                <TerritoriesDropDown />
                {selectFinanceur === 'AideNationale' ? (
                  <AutocompleteInput
                    source="funderName"
                    label="Nom du financeur"
                    fullWidth
                    onCreate={(value) => {
                      if (value) {
                        const newFunder = { name: value, label: value };
                        FUNDER_CHOICE.push(newFunder);
                        return newFunder;
                      }
                    }}
                    validate={[required(), validateFunder]}
                    choices={FUNDER_CHOICE}
                    optionText={(choice) =>
                      choice
                        ? choice.label
                          ? choice.label
                          : choice.name
                        : null
                    }
                    optionValue={'name'}
                    translateChoice={false}
                    onInputValueChange={(_, data) => {
                      if (
                        data.selectedItem?.id &&
                        data?.selectedItem?.id !== '@@ra-create'
                      ) {
                        values.funderId = data?.selectedItem?.id;
                      }
                    }}
                  />
                ) : (
                  <AutocompleteInput
                    source="funderName"
                    label="Nom du financeur"
                    fullWidth
                    validate={[required(), validateFunder]}
                    choices={FUNDER_CHOICE}
                    optionText={(choice) =>
                      choice
                        ? choice.label
                          ? choice.label
                          : choice.name
                        : null
                    }
                    optionValue="name"
                    translateChoice={false}
                  />
                )}
                <TextInput
                  source="conditions"
                  label="Condition d'obtention"
                  rowsMax={10}
                  validate={[required()]}
                  multiline
                  fullWidth
                />
                <TextInput
                  source="paymentMethod"
                  label="Modalité de versement"
                  rowsMax={10}
                  validate={[required()]}
                  multiline
                  fullWidth
                />
                <TextInput
                  source="allocatedAmount"
                  label="Montant"
                  validate={[required()]}
                  rowsMax={10}
                  multiline
                  fullWidth
                />
                <TextInput
                  source="minAmount"
                  label="Montant minimum de l'aide"
                  validate={[required()]}
                  fullWidth
                />
                <AutocompleteArrayInput
                  source="transportList"
                  label="Mode de transport"
                  fullWidth
                  validate={[required()]}
                  choices={TRANSPORT_CHOICE}
                />
                <AutocompleteArrayInput
                  source="attachments"
                  label="Justificatif (possibilité d'en créer)"
                  onCreate={(value) => {
                    if (value) {
                      const newProof = { id: value, name: value };
                      PROOF_CHOICE.push(newProof);
                      return newProof;
                    }
                  }}
                  fullWidth
                  choices={PROOF_CHOICE}
                />
                <TextInput
                  source="additionalInfos"
                  label="Informations complémentaires"
                  fullWidth
                />
                <TextInput
                  resource="aides"
                  source="contact"
                  label="Contact"
                  maxRows={10}
                  multiline
                  fullWidth
                />
                <TextInput
                  source="validityDuration"
                  label="Durée de validité"
                  fullWidth
                />
                <DateInput
                  source="validityDate"
                  label="Date de fin de validité"
                  inputProps={{
                    min: startDateMin(),
                  }}
                  validate={[dateMinValidation]}
                  format={getDate}
                />
              </Box>
              <hr style={{ width: '695px', margin: '0px' }} />
              <h3>Horodatage</h3>
              <div style={{ marginTop: '10px', marginLeft: '10px' }}>
                <span>Description :</span>
                <p
                  style={{
                    fontSize: '12px',
                    color: '#464cd0',
                    top: '-20px',
                  }}
                >
                  Horodatage des souscriptions
                </p>
                <Box display="flex">
                  <BooleanInput
                    checked={isCertifiedTimestampChecked}
                    onChange={() =>
                      setIsCertifiedTimestampChecked(
                        !isCertifiedTimestampChecked
                      )
                    }
                    source="isCertifiedTimestampRequired"
                    label="Actif"
                  />
                </Box>
              </div>
              <hr style={{ width: '695px', margin: '0px' }} />
              <Box display="flex">
                <BooleanInput
                  checked={isMobilityChecked}
                  onChange={handleShowMobilityInputs}
                  source="isMCMStaff"
                  label="Mon Compte Mobilité"
                />
              </Box>
              <Box maxWidth={700}>
                <TextInput
                  source="subscriptionLink"
                  label="Site de souscription"
                  fullWidth
                  validate={
                    isMobilityChecked
                      ? [validateUrl]
                      : [required(), validateUrl]
                  }
                />
              </Box>
              {isMobilityChecked && (
                <>
                  <Box
                    mt={2}
                    display="flex"
                    maxWidth={700}
                    flexWrap="wrap"
                    justifyContent="space-between"
                  >
                    <ArrayInput source="specificFields" label="">
                      <SimpleFormIterator
                        className="simpleForm1"
                        addButton={
                          <CustomAddButton
                            label={'Ajouter un champ spécifique'}
                          />
                        }
                      >
                        <TextInput
                          source="title"
                          label="Champ libre"
                          fullWidth
                          validate={[required()]}
                        />
                        <SelectInput
                          source="inputFormat"
                          label="Format"
                          fullWidth
                          validate={[required()]}
                          choices={INPUT_FORMAT_CHOICE}
                        />
                        <FormDataConsumer>
                          {({
                            formData, // The whole form data
                            scopedFormData, // The data for this item of the ArrayInput
                            getSource, // A function to get the valid source inside an ArrayInput
                            ...rest
                          }) =>
                            scopedFormData?.inputFormat === 'listeChoix' ? (
                              <>
                                <NumberInput
                                  source={getSource(
                                    'choiceList.possibleChoicesNumber'
                                  )}
                                  label="Nombre de choix possible"
                                  min={0}
                                  validate={[required()]}
                                />
                                <ArrayInput
                                  source={getSource(
                                    'choiceList.inputChoiceList'
                                  )}
                                  label=""
                                >
                                  <SimpleFormIterator className="simpleForm2">
                                    <TextInput
                                      source="inputChoice"
                                      label="Nom du champ"
                                      fullWidth
                                      validate={[required()]}
                                    />
                                  </SimpleFormIterator>
                                </ArrayInput>
                              </>
                            ) : null
                          }
                        </FormDataConsumer>
                        <BooleanInput
                          source="isRequired"
                          label="Champ obligatoire"
                          initialValue={false}
                        />
                      </SimpleFormIterator>
                    </ArrayInput>
                  </Box>
                  <SubscriptionModeForm />
                  <Box display="flex">
                    <BooleanInput
                      checked={false}
                      source="isCitizenNotificationsDisabled"
                      label="Désactiver l'envoi des notifications au citoyen"
                      initialValue={false}
                    />
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </CardContent>
      </Box>
    </Box>
  );
};

export default AideCreateForm;
