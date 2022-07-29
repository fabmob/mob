/* eslint-disable */
import { TextInput, required } from 'react-admin';
import { CardContent, Box } from '@material-ui/core';

import FinanceurDropDown from '../common/FinanceurDropDown';

const CommuniteCreateForm = (save, record) => {
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
                  label="Nom de la communauté"
                  source="name"
                  fullWidth
                  validate={[required()]}
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Box>
    </Box>
  );
};

export default CommuniteCreateForm;
