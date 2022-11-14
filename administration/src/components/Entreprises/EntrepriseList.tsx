/* eslint-disable */
import { List, Datagrid, TextField, BooleanField } from 'react-admin';

const EntrepriseList = (props) => {
  return (
    <List {...props} exporter={false}>
      <Datagrid>
        <TextField source="name" label="Nom de l'entreprise" />
        <TextField
          source="employeesCount"
          label="Nombre de salariés dans l'entreprise"
        />
        <TextField source="siretNumber" label="Numéro SIRET" />
        <TextField source="budgetAmount" label="Montant Budget" />
        <BooleanField source="isHris" label="SI RH" />
        <BooleanField
          source="hasManualAffiliation"
          label="Affiliation manuelle"
        />
      </Datagrid>
    </List>
  );
};

export default EntrepriseList;
