/* eslint-disable */
import React from 'react';
import {
  TextInput,
  required,
  DateInput,
  SelectInput,
  BooleanInput,
  NumberInput,
  AutocompleteArrayInput,
  SimpleFormIterator,
  FormDataConsumer,
  useNotify,
  ArrayInput,
} from 'react-admin';
import { useForm } from 'react-final-form';
import { CardContent, Box, Tooltip } from '@material-ui/core';
import { InfoRounded } from '@material-ui/icons';

import {
  TRANSPORT_CHOICE,
  INCENTIVE_TYPE_CHOICE,
  INPUT_FORMAT_CHOICE,
  PROOF_CHOICE,
} from '../../utils/constant';
import { getDate } from '../../utils/convertDateToString';
import {
  startDateMin,
  dateMinValidation,
} from '../../utils/Aide/validityDateRules';
import { validateUrl } from '../../utils/Aide/formHelper';
import CustomAddButton from '../common/CustomAddButton';
import AidesMessages from '../../utils/Aide/fr.json';

import SubscriptionModeForm from '../common/SubscriptionModeForm';
import TerritoriesDropDown from '../common/TerritoriesDropDown';
import FunderDropDown from '../common/FunderDropDown';

import '../styles/DynamicForm.css';

const AideCreateForm = (save, record) => {
  const notify = useNotify();
  const form = useForm();

  const [isMobilityChecked, setIsMobilityChecked] = React.useState(false);
  const [isSendEmailChecked, setIsSendEmailChecked] = React.useState(false);
  const [isCertifiedTimestampChecked, setIsCertifiedTimestampChecked] =
    React.useState(false);


  const handleShowMobilityInputs = () => {
    form.change('subscriptionLink', undefined);
    form.change('specificFields', undefined);
    form.change('subscriptionCheckMode', undefined);
    form.change('eligibilityChecks', undefined);
    setIsMobilityChecked(!isMobilityChecked);
  };

  return (
    <Box mt={2} display="flex">
      <Box flex="1">
        <CardContent>
          <Box display="flex">
            <Box flex="1" mt={-1}>
              <Box maxWidth={700}>
                <h3>{AidesMessages['incentive.mainCharacteristics.title']}</h3>
                <TextInput
                  source="title"
                  label="Nom"
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
                  label="Type d'aide"
                  fullWidth
                  validate={[required()]}
                  choices={INCENTIVE_TYPE_CHOICE}
                />
                <FunderDropDown/>
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
                <TerritoriesDropDown />

                <h3>{AidesMessages['incentive.detailsInfo.title']}</h3>
                <TextInput
                  source="allocatedAmount"
                  label="Montant"
                  validate={[required()]}
                  rowsMax={10}
                  multiline
                  fullWidth
                />
                <TextInput
                  source="conditions"
                  label="Conditions d'obtention"
                  rowsMax={10}
                  validate={[required()]}
                  multiline
                  fullWidth
                />
                <TextInput
                  source="paymentMethod"
                  label="Modalités de versement"
                  rowsMax={10}
                  validate={[required()]}
                  multiline
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
                  source="additionalInfos"
                  label="Informations complémentaires"
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
              <h3>
                {AidesMessages['incentive.subscription.management.title']}
              </h3>
              <Box maxWidth={700}>
                <h3 className="subtitle">
                  {AidesMessages['incentive.mob.title']}
                </h3>
                <BooleanInput
                  checked={isMobilityChecked}
                  onChange={handleShowMobilityInputs}
                  source="isMCMStaff"
                  label={isMobilityChecked === true ? 'Oui' : 'Non'}
                />
                {isMobilityChecked ? (
                  <TextInput
                    source="subscriptionLink"
                    label="Site de souscription externe (facultatif)"
                    fullWidth
                  />
                ) : (
                  <TextInput
                    source="subscriptionLink"
                    label="Site de souscription externe"
                    fullWidth
                    validate={
                      isMobilityChecked
                        ? [validateUrl]
                        : [required(), validateUrl]
                    }
                  />
                )}
              </Box>
              {isMobilityChecked && (
                <>
                  <h3>{AidesMessages['incentive.subscription.form.title']}</h3>
                  <Box
                    mt={2}
                    display="flex"
                    maxWidth={700}
                    flexWrap="wrap"
                    justifyContent="space-between"
                  >
                    <AutocompleteArrayInput
                      source="attachments"
                      label="Justificatifs"
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
                    <ArrayInput source="specificFields" label="">
                      <div>
                        <h3 className="subtitle">
                          {AidesMessages['incentive.specificFields']}
                        </h3>
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
                      </div>
                    </ArrayInput>
                  </Box>
                  <h3>
                    {AidesMessages['incentive.subscription.treatment.title']}
                  </h3>
                  <SubscriptionModeForm />
                  <Box
                    display="flex"
                    alignItems="center"
                    maxWidth={700}
                    height={60}
                  >
                    <h3 className="subtitle">
                      {AidesMessages['incentive.timestamp.title']}
                    </h3>

                    <Tooltip title="Un horodatage des métadonnées de la souscription est effectué à chaque étape avant sa vérification finale.">
                      <InfoRounded color="primary" />
                    </Tooltip>
                  </Box>
                  <Box display="flex">
                    <BooleanInput
                      checked={isCertifiedTimestampChecked}
                      onChange={() =>
                        setIsCertifiedTimestampChecked(
                          !isCertifiedTimestampChecked
                        )
                      }
                      source="isCertifiedTimestampRequired"
                      label={isCertifiedTimestampChecked ? 'Actif' : 'Inactif'}
                    />
                  </Box>
                  <h3>
                    {
                      AidesMessages[
                        'incentive.subscription.communication.title'
                      ]
                    }
                  </h3>
                  <Box display="flex">
                    <BooleanInput
                      checked={isSendEmailChecked}
                      source="isCitizenNotificationsDisabled"
                      onChange={() =>
                        setIsSendEmailChecked(!isSendEmailChecked)
                      }
                      initialValue={false}
                      label={
                        isSendEmailChecked
                          ? 'Désactivation des notifications citoyen'
                          : 'Envoi des notifications au citoyen'
                      }
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
