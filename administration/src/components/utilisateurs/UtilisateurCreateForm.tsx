/* eslint-disable */
import { TextInput, required, email, PasswordInput } from 'react-admin';
import { CardContent, Box } from '@material-ui/core';
import { useFormState } from 'react-final-form';

import FinanceurDropDown from '../common/FinanceurDropDown';
import CompteMessages from '../../utils/Compte/fr.json';
import CommunauteCheckBox from './CommunauteCheckBox';
import RolesRadioButtons from './RolesRadioButtons';
import { validatePassword } from '../../utils/regexPasswordFormat';
import { checkNamesLength } from '../../utils/checkNamesLength';

const UtilisateurCreateForm = (save, record) => {
  const { values } = useFormState();

  const Spacer = () => <Box width={20} component="span" />;

  const checkPatternEmail = (email) => {
    if (
      email &&
      values.emailFormat &&
      values.emailFormat.some((elt) => email.endsWith(elt)) !== true
    ) {
      return CompteMessages['email.error.emailFormat'];
    }
    return undefined;
  };

  const validateEmail = email();

  return (
    <Box width={2000} display="flex">
      <Box flex="1">
        <CardContent>
          <Box display="flex">
            <Box flex="1" mt={-1} width={2000}>
              <Box mt={2} maxWidth={700}>
                <FinanceurDropDown />
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
                <TextInput
                  label="Email"
                  source="email"
                  fullWidth
                  validate={[required(), validateEmail, checkPatternEmail]}
                />
              </Box>
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

export default UtilisateurCreateForm;
