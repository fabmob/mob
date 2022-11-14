/* eslint-disable */
import { TextInput, required } from 'react-admin';
import { CardContent, Box } from '@material-ui/core';
import { checkNamesLength } from '../../utils/checkNamesLength';

const TerritoryCreateForm = (save, record) => {
  return (
    <Box flex="1">
      <CardContent>
        <Box display="flex" maxWidth={700}>
          <TextInput
            label="Nom du territoire"
            source="name"
            fullWidth
            validate={[required(), checkNamesLength]}
          />
        </Box>
      </CardContent>
    </Box>
  );
};

export default TerritoryCreateForm;
