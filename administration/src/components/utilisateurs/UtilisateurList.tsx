/* eslint-disable */
import { FC } from 'react';
import {
  List,
  Datagrid,
  TextField,
  Filter,
  SearchInput,
  EditButton,
  DeleteButton,
  BooleanField,
} from 'react-admin';

const UsersFilter = (props) => (
  <Filter {...props}>
    <SearchInput
      placeholder="Rechercher Par Nom"
      source="lastName"
      resettable
      alwaysOn
    />
  </Filter>
);

const UtilisateurList: FC = (props) => {
  return (
    <List
      {...props}
      filters={<UsersFilter />}
      sort={{ field: 'lastName', order: 'ASC' }}
      exporter={false}
    >
      <Datagrid optimized>
        <TextField source="funderName" label="Nom du financeur" />
        <TextField source="funderType" label="Type de financeur" />
        <TextField source="lastName" label="Nom" />
        <TextField source="firstName" label="Prénom" />
        <TextField source="email" label="Identifiant (mail)" />
        <TextField source="roles" label="Rôle" />
        <TextField
          source="communityName"
          label="Périmètre d'intervention gestionnaire"
        />
        <BooleanField
          source="canReceiveAffiliationMail"
          label="Réception des emails d'affiliation"
          looseValue={true}
        />
        <EditButton basePath="/utilisateurs" />
        <DeleteButton basePath="/utilisateurs" />
      </Datagrid>
    </List>
  );
};

export default UtilisateurList;
