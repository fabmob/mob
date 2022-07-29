/* eslint-disable */
import {
  TextInput,
  required,
  NumberInput,
  BooleanInput,
  AutocompleteArrayInput,
} from 'react-admin';
import { Card, CardContent, Divider, Box } from '@material-ui/core';

import { isEmailFormatValid } from '../../utils/regexEmailFormat';

import '../styles/DynamicForm.css';

const EMAIL_TAB = [{ id: '@exemple.com', name: '@exemple.com' }];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EntrepriseCreateForm = (save, record) => {
  return (
    <Box display="flex">
      <Box flex="1">
        <Card>
          <CardContent>
            <Box>
              <Box display="flex">
                <Box flex="1" mt={-1}>
                  <Box mt={2} maxWidth={700} display="flex">
                    <TextInput
                      source="name"
                      label="Nom de l'entreprise"
                      validate={[required()]}
                      fullWidth
                    />
                    <Spacer />
                    <NumberInput
                      source="siretNumber"
                      label="Numéro SIRET"
                      fullWidth
                    />
                  </Box>
                  <Box maxWidth={700}>
                    <AutocompleteArrayInput
                      source="emailFormat"
                      label="Format d'adresse email de l'entreprise"
                      onCreate={(value) => {
                        if (isEmailFormatValid(value)) {
                          const newFormat = { id: value, name: value };
                          EMAIL_TAB.push(newFormat);
                          return newFormat;
                        }
                        EMAIL_TAB.push({ id: '', name: '' });
                      }}
                      fullWidth
                      choices={EMAIL_TAB}
                      validate={[required(), validateFormatEmail]}
                    />
                  </Box>
                  <Spacer />
                  <Divider />
                  <Box display="flex" maxWidth={700}>
                    <NumberInput
                      source="employeesCount"
                      label="Nombre de salariés dans l'entreprise"
                      fullWidth
                    />
                    <Spacer />
                    <NumberInput
                      source="budgetAmount"
                      label="Montant du budget mobilité"
                      fullWidth
                    />
                  </Box>
                  <Divider />
                  <Box display="flex" maxWidth={700}>
                    <BooleanInput
                      defaultValue={false}
                      source="isHris"
                      label="SI RH"
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

const Spacer = () => <Box width={20} component="span" />;

const validateFormatEmail = (value) => {
  return value.includes(undefined) || value.includes('@@ra-create')
    ? 'Ne doit pas être nul'
    : undefined;
};

export default EntrepriseCreateForm;
