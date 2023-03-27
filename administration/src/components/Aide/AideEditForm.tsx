/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { find } from 'lodash';
import {
  TextInput,
  required,
  DateInput,
  SelectInput,
  BooleanInput,
  AutocompleteArrayInput,
  ArrayInput,
  SimpleFormIterator,
  useRecordContext,
  FormWithRedirect,
  FormDataConsumer,
  NumberInput,
  useEditContext,
  Toolbar,
  EditProps,
} from 'react-admin';
import { CardContent, Box, Tooltip } from '@material-ui/core';
import {
  TRANSPORT_CHOICE,
  INCENTIVE_TYPE_CHOICE,
  PROOF_CHOICE,
  INPUT_FORMAT_CHOICE,
} from '../../utils/constant';
import { validateIncentiveForm } from '../../utils/helpers';
import {
  startDateMin,
  dateMinValidation,
} from '../../utils/Aide/validityDateRules';
import { convertDateToString, getDate } from '../../utils/convertDateToString';
import { validateUrl } from '../../utils/Aide/formHelper';
import CustomAddButton from '../common/CustomAddButton';
import '../styles/DynamicForm.css';
import TerritoriesDropDown from '../common/TerritoriesDropDown';
import SubscriptionModeForm from '../common/SubscriptionModeForm';
import { InfoRounded } from '@material-ui/icons';
import AidesMessages from '../../utils/Aide/fr.json';

const AideEditForm = (props: EditProps) => {
  const { save, record } = useEditContext();
  const recordContext = useRecordContext();
  const [isMobilityChecked, setIsMobilityChecked] = useState(false);
  const [isSendEmailChecked, setIsSendEmailChecked] = React.useState(false);
  const [isCertifiedTimestampChecked, setIsCertifiedTimestampChecked] =
    React.useState(false);

  // Check the isMobilityChecked at the willmount
  useEffect(() => {
    setIsMobilityChecked(recordContext?.isMCMStaff);
  }, []);

  // Check the IsSendEmailChecked at the willmount
  useEffect(() => {
    setIsSendEmailChecked(recordContext?.isCitizenNotificationsDisabled);
  }, []);

  // Check the IsCertifiedTimestampChecked at the willmount
  useEffect(() => {
    setIsCertifiedTimestampChecked(recordContext?.isCertifiedTimestampRequired);
  }, []);

  // format attribute validityDate useEffect
  useEffect(() => {
    recordContext.validityDate = getDate(recordContext.validityDate);
  }, [recordContext.validityDate]);

  // verify if each label Proof exist in options (PROOF_CHOICE) in this aides, else add option in Proof choice
  if (recordContext?.attachments) {
    recordContext.attachments.map((value) => {
      if (!find(PROOF_CHOICE, ['id', value])) {
        PROOF_CHOICE.push({ id: value, name: value });
      }
    });
  }

  // Toogle of isMobilityChecked
  const handleShowMobilityInputs = () => {
    setIsMobilityChecked(!isMobilityChecked);
  };

  return (
    <FormWithRedirect
      {...props}
      sanitizeEmptyValues={false}
      record={record}
      redirect="/aides"
      save={save}
      validate={validateIncentiveForm}
      render={(formProps) => (
        <Box mt={2} display="flex">
          <Box flex="1">
            <CardContent>
              <form>
                <Box display="flex">
                  <Box flex="1" mt={-1}>
                    <Box maxWidth={700}>
                      <TextInput
                        resource="aides"
                        disabled
                        label="Id"
                        source="id"
                        fullWidth
                      />
                      <h3>
                        {AidesMessages['incentive.mainCharacteristics.title']}
                      </h3>
                      <TextInput
                        resource="aides"
                        source="title"
                        label="Nom"
                        fullWidth
                        validate={[required()]}
                      />
                      <TextInput
                        resource="aides"
                        source="description"
                        label="Proposition de valeur"
                        rowsMax={10}
                        validate={[required()]}
                        multiline
                        fullWidth
                      />
                      <SelectInput
                        resource="aides"
                        source="incentiveType"
                        label="Type d'aide"
                        disabled
                        fullWidth
                        validate={[required()]}
                        choices={INCENTIVE_TYPE_CHOICE}
                      />

                      <TextInput
                        resource="aides"
                        disabled
                        source="funderName"
                        label="Financeur"
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
                      <TerritoriesDropDown />
                      <h3>{AidesMessages['incentive.detailsInfo.title']}</h3>
                      <TextInput
                        resource="aides"
                        source="allocatedAmount"
                        label="Montant"
                        rowsMax={10}
                        validate={[required()]}
                        multiline
                        fullWidth
                      />
                      <TextInput
                        resource="aides"
                        source="conditions"
                        label="Conditions d'obtention"
                        rowsMax={10}
                        validate={[required()]}
                        multiline
                        fullWidth
                      />
                      <TextInput
                        resource="aides"
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
                        resource="aides"
                        source="additionalInfos"
                        label="Informations complémentaires"
                        fullWidth
                      />
                      <TextInput
                        resource="aides"
                        source="validityDuration"
                        label="Durée de validité"
                        fullWidth
                      />
                      <DateInput
                        resource="aides"
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
                      {' '}
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
                        <h3>
                          {AidesMessages['incentive.subscription.form.title']}
                        </h3>
                        <Box
                          mt={2}
                          display="flex"
                          maxWidth={700}
                          flexWrap="wrap"
                          justifyContent="space-between"
                        >
                          <AutocompleteArrayInput
                            resource="aides"
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
                                    scopedFormData?.inputFormat ===
                                    'listeChoix' ? (
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
                                />
                              </SimpleFormIterator>
                            </div>
                          </ArrayInput>
                        </Box>
                        <h3>
                          {
                            AidesMessages[
                              'incentive.subscription.treatment.title'
                            ]
                          }
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
                            label={
                              isCertifiedTimestampChecked ? 'Actif' : 'Inactif'
                            }
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
                            resource="aides"
                            checked={isSendEmailChecked}
                            source="isCitizenNotificationsDisabled"
                            onChange={() =>
                              setIsSendEmailChecked(!isSendEmailChecked)
                            }
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
                <Toolbar
                  record={formProps.record}
                  undoable={true}
                  invalid={formProps.invalid}
                  handleSubmit={formProps.handleSubmit}
                  saving={formProps.saving}
                  resource="aides"
                />
              </form>
            </CardContent>
          </Box>
        </Box>
      )}
    />
  );
};

export default AideEditForm;
