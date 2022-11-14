/* eslint-disable */
import { TextInput, required } from 'react-admin';
import { CardContent, Box } from '@material-ui/core';
import { checkNamesLength } from '../../utils/checkNamesLength';

const TerritoryEditForm = () => {
  return (
    <Box flex="1">
      <CardContent>
        <Box mt={2} maxWidth={700}>
          <TextInput source="id" disabled label="Id" />
        </Box>
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

export default TerritoryEditForm;
