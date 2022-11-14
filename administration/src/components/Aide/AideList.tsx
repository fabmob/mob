/* eslint-disable */
import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  EditButton,
  DeleteButton,
  FunctionField,
} from 'react-admin';

import { MAPPING_FUNDER_TYPE } from '../../utils/constant';

const AideList = (props) => {
  return (
    <List {...props} exporter={false}>
      <Datagrid>
        <TextField source="title" label="Nom de l'aide" />
        <TextField source="minAmount" label="Montant minimum de l'aide" />
        <FunctionField
          label="Nom du financeur"
          render={(record) =>
            `${record.funderName} (${
              MAPPING_FUNDER_TYPE[record.incentiveType]
            })`
          }
        />
        <EditButton basePath="/aides" />
        <DeleteButton basePath="/aides" />
      </Datagrid>
    </List>
  );
};

export default AideList;
