/* eslint-disable */
import { TextInput, required, BooleanInput } from 'react-admin';
import { CardContent, Box } from '@material-ui/core';
import { useFormState } from 'react-final-form';

import FunderDropDown from '../common/FunderDropDown';
import CommunauteCheckBox from './CommunauteCheckBox';
import RolesRadioButtons from './RolesRadioButtons';
import { checkNamesLength } from '../../utils/checkNamesLength';

import '../styles/DynamicForm.css';

const UtilisateurEditForm = () => {
  const Spacer = () => <Box width={20} component="span" />;

  const { values } = useFormState();

  return (
    <Box mt={2} display="flex">
      <Box flex="1">
        <CardContent>
          <Box display="flex">
            <Box flex="1" mt={2}>
              <Box mt={2} maxWidth={700}>
                <TextInput source="id" disabled label="Id" />
              </Box>
              <Box mt={2} maxWidth={700}>
                <FunderDropDown disabled={true}/>
              </Box>
              <Box display="flex" maxWidth={700}>
                <TextInput
                  label="Prénom"
                  source="firstName"
                  fullWidth
                  validate={[required(), checkNamesLength]}
                />
                <Spacer />
                <TextInput
                  label="Nom"
                  source="lastName"
                  fullWidth
                  validate={[required(), checkNamesLength]}
                />
              </Box>
              <Box display="flex" maxWidth={700}>
                <TextInput label="Email" source="email" fullWidth disabled />
              </Box>
              {values?.hasManualAffiliation && (
                <Box display="flex" maxWidth={700}>
                  <BooleanInput
                    source="canReceiveAffiliationMail"
                    label="Notification par mail des affiliations manuelles"
                  />
                </Box>
              )}

              <Box display="flex">
                <RolesRadioButtons />
              </Box>
              <Box mt={2} maxWidth={700}>
                <CommunauteCheckBox />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Box>
    </Box>
  );
};

export default UtilisateurEditForm;
