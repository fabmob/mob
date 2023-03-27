/* eslint-disable */
import { ListProps } from '@material-ui/core';
import { FC } from 'react';
import {
  List,
  Datagrid,
  TextField,
  Filter,
  SearchInput,
  EditButton,
  FunctionField,
} from 'react-admin';

const TerritoryFilter: FC = (props) => (
  <Filter {...props}>
    <SearchInput
      placeholder="Rechercher Par Nom"
      source="name"
      resettable
      alwaysOn
    />
  </Filter>
);

const TerritoryList: FC<ListProps> = (props) => {
  return (
    <List
      exporter={false}
      {...props}
      filters={<TerritoryFilter />}
      sort={{ field: 'name', order: 'ASC' }}
      bulkActionButtons={false}
    >
      <Datagrid optimized rowClick="edit">
        <TextField
          source="name"
          label="Nom du territoire"
        />
        <TextField
          source="scale"
          label="Échelle"
        />
        <FunctionField
          source="inseeValueList"
          render={record => record.inseeValueList && `${record.inseeValueList.join(', ')}`}
          label="Liste des codes INSEE"
        />
        <EditButton basePath="/territoires" />
      </Datagrid>
    </List>
  );
};

export default TerritoryList;
