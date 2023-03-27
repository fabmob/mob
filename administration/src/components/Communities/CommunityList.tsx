/* eslint-disable */
import React, { FC } from 'react';
import { List, Datagrid, TextField,ReferenceField } from 'react-admin';



const CommunityList: FC = (props) => {
  return (
    <List
      {...props}
      bulkActionButtons={false}
      exporter={false}
      sort={{ field: 'name', order: 'ASC' }}
    >
      <Datagrid optimized>
        <TextField source="name" label="Nom de la communauté" />
        <ReferenceField
          source="funderId"
          reference="financeurs"
          label="Nom du financeur"
          link="show"
        >
          <TextField source="name" />
        </ReferenceField>
        <TextField source="funderType" label="Type de financeur" />
      </Datagrid>
    </List>
  );
};

export default CommunityList;
