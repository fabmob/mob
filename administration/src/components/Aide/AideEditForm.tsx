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
import { CardContent, Box } from '@material-ui/core';
import {
  TRANSPORT_CHOICE,
  INCENTIVE_TYPE_CHOICE,
  PROOF_CHOICE,
  INPUT_FORMAT_CHOICE,
} from '../../utils/constant';
import {
  startDateMin,
  dateMinValidation,
} from '../../utils/Aide/validityDateRules';
import { getDate } from '../../utils/convertDateToString';
import { validateUrl } from '../../utils/Aide/formHelper';
import CustomAddButton from '../common/CustomAddButton';
import '../styles/DynamicForm.css';
import TerritoriesDropDown from '../common/TerritoriesDropDown';

const AideEditForm = (props: EditProps) => {
  const { save, record } = useEditContext();
  const recordContext = useRecordContext();
  const [isMobilityChecked, setIsMobilityChecked] = useState(false);

  // Check the isMobilityChecked at the willmount
  useEffect(() => {
    if (recordContext?.isMCMStaff) {
      setIsMobilityChecked(true);
    } else {
      setIsMobilityChecked(false);
    }
  }, []);
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
                      />
                      <TextInput
                        resource="aides"
                        source="title"
                        label="Nom de l'aide"
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
                        label="Financeur"
                        fullWidth
                        validate={[required()]}
                        choices={INCENTIVE_TYPE_CHOICE}
                      />
                      <TerritoriesDropDown canCreate={false} />
                      <TextInput
                        resource="aides"
                        disabled
                        source="funderName"
                        label="Nom du financeur"
                        fullWidth
                      />
                      <TextInput
                        resource="aides"
                        source="conditions"
                        label="Condition d'obtention"
                        rowsMax={10}
                        validate={[required()]}
                        multiline
                        fullWidth
                      />
                      <TextInput
                        resource="aides"
                        source="paymentMethod"
                        label="Modalité de versement"
                        rowsMax={10}
                        validate={[required()]}
                        multiline
                        fullWidth
                      />
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
                        source="minAmount"
                        label="Montant minimum de l'aide"
                        validate={[required()]}
                        fullWidth
                      />
                      <AutocompleteArrayInput
                        resource="aides"
                        source="transportList"
                        label="Mode de transport"
                        fullWidth
                        validate={[required()]}
                        choices={TRANSPORT_CHOICE}
                      />
                      <AutocompleteArrayInput
                        resource="aides"
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
                        resource="aides"
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
                    <BooleanInput
                      resource="aides"
                      source="isMCMStaff"
                      label="Mon Compte Mobilité"
                      checked={isMobilityChecked}
                      onChange={handleShowMobilityInputs}
                    />

                    {!isMobilityChecked ? (
                      <Box maxWidth={700}>
                        <TextInput
                          source="subscriptionLink"
                          label="Site de souscription"
                          fullWidth
                          validate={[required(), validateUrl]}
                        />
                      </Box>
                    ) : (
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
                          </SimpleFormIterator>
                        </ArrayInput>
                      </Box>
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
