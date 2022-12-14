import React, { FC } from 'react';
import { List, Datagrid, TextField } from 'react-admin';

const CommunauteList: FC = (props) => {
  return (
    <List {...props} exporter={false}>
      <Datagrid optimized>
        <TextField source="funderName" label="Nom du financeur" />
        <TextField source="funderType" label="Type de financeur" />
        <TextField source="name" label="Nom de la communaut√©" />
      </Datagrid>
    </List>
  );
};

export default CommunauteList;
