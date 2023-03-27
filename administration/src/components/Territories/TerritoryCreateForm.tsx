/* eslint-disable */
import { TextInput, required, SelectInput, AutocompleteArrayInput } from 'react-admin';
import { CardContent, Box } from '@material-ui/core';
import { checkNamesLength } from '../../utils/checkNamesLength';
import { TERRITORY_SCALE_CHOICE } from '../../utils/constant';
import { inseeCodePatternValidation, duplicatedValueValidation } from '../../utils/helpers';

const inseeValueCreatedList: { id: string, name: string }[] = [];

const validateInseeValueList = [inseeCodePatternValidation, duplicatedValueValidation];

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
        <Box display="flex" maxWidth={700}>
          <SelectInput
            source="scale"
            label="Échelle"
            fullWidth
            choices={TERRITORY_SCALE_CHOICE}
            validate={[required()]}
          />
        </Box>
        <Box display="flex" maxWidth={700}>
          <AutocompleteArrayInput
            source="inseeValueList"
            label="Liste de codes INSEE"
            onCreate={(value) => {
              const inseeValue: { id: string, name: string } = { id: value, name: value };
              inseeValueCreatedList.push(inseeValue);
              return inseeValue;
            }}
            fullWidth
            choices={inseeValueCreatedList}
            validate={validateInseeValueList}
          />
        </Box>
      </CardContent>
    </Box>
  );
};


export default TerritoryCreateForm;
