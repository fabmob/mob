/* eslint-disable */
import React, { FC } from 'react';
import { List, Datagrid, TextField, Filter, SearchInput , EditButton, DeleteButton} from 'react-admin';

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
        <EditButton basePath="/utilisateurs" />
        <DeleteButton basePath="/utilisateurs" />
      </Datagrid>
    </List>
  );
};

export default UtilisateurList;
