/* eslint-disable */
import { TextInput, required, NumberInput } from 'react-admin';
import { CardContent, Box } from '@material-ui/core';

const Spacer = () => <Box width={20} component="span" />;

const CollectiviteCreateForm = (save, record) => {
  return (
    <Box width={2000} display="flex">
      <Box flex="1">
        <CardContent>
          <Box display="flex">
            <Box flex="1" mt={-1} width={2000}>
              <Box mt={2} maxWidth={700}>
                <TextInput
                  label="Nom de l'AOM"
                  source="name"
                  fullWidth
                  validate={[required()]}
                />
              </Box>
              <Box display="flex" maxWidth={700}>
                <NumberInput
                  label="Nombre de citoyens dans l'AOM"
                  source="citizensCount"
                  fullWidth
                />
                <Spacer />
                <NumberInput
                  label="Montant du budget mobilité"
                  source="mobilityBudget"
                  fullWidth
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Box>
    </Box>
  );
};

export default CollectiviteCreateForm;
