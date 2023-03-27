/* eslint-disable */
import { TextInput, required } from 'react-admin';
import { CardContent, Box } from '@material-ui/core';

import FunderDropDown from '../common/FunderDropDown';
import { FUNDER_TYPE } from '../../utils/constant';

const CommunityCreateForm = (save, record) => {
  return (
      <Box flex="1">
        <CardContent>
          <Box display="flex">
            <Box flex="1" mt={-1} width={200}>
              <Box mt={2} maxWidth={700}>
                <FunderDropDown/>
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
  );
};

export default CommunityCreateForm;
