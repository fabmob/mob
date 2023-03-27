/* eslint-disable */
import { FC } from 'react';
import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  Filter,
  SearchInput,
  ShowButton,
} from 'react-admin';

const FunderFilter: FC = (props) => (
  <Filter {...props}>
    <SearchInput
      placeholder="Rechercher Par Nom"
      source="name"
      resettable
      alwaysOn
    />
  </Filter>
);

const FunderList = (props) => {
  return (
    <List
      exporter={false}
      {...props}
      filters={<FunderFilter />}
      sort={{ field: 'name', order: 'ASC' }}
      bulkActionButtons={false}
    >
      <Datagrid optimized rowClick="show">
        <TextField source="name" label="Nom du financeur" />
        <TextField source="type" label="Type" />
        <BooleanField source="enterpriseDetails.isHris" label="SI RH" />
        <BooleanField
          source="enterpriseDetails.hasManualAffiliation"
          label="Affiliation manuelle"
        />
        <ShowButton basePath="/financeurs" />
      </Datagrid>
    </List>
  );
};

export default FunderList;
