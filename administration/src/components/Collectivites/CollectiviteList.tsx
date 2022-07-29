/* eslint-disable */
import { List, Datagrid, TextField } from 'react-admin';

const CollectiviteList = (props) => {
  return (
    <List {...props}>
      <Datagrid>
        <TextField source="name" label="Nom de l'AOM" />
        <TextField
          source="citizensCount"
          label="Nombre de citoyens dans l'AOM"
        />
        <TextField source="mobilityBudget" label="Montant du budget mobilité" />
      </Datagrid>
    </List>
  );
};

export default CollectiviteList;
