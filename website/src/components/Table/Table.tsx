import React, { FC } from 'react';

import { InputFormat } from '@utils/table';
import TableRow from '@components/Table/TableRow';

interface TableProps {
  inputFormatList: InputFormat[];
  data: object;
}

/**
 * Generic Component for table (see Profile, requestInformation)
 * Use an importFormatList to determine information to show to user (ex: icon, label, actions ...)
 * Json props is used to get corresponding values in data props
 * Component uses TableRow component to display information in a row
 * See TableRow for more information about its props.
 * @param param0 TableProps
 * @returns
 */
const Table: FC<TableProps> = ({ inputFormatList, data }) => {
  return (
    <>
      {inputFormatList.map(
        ({ iconName, label, json, type, actionList, actionId }, index) => {
          return (
            data[json] && (
              <TableRow
                key={`${json}-${index}`}
                label={label}
                type={type}
                value={data[json]}
                actionList={actionList}
                actionId={actionId}
                iconName={iconName}
              />
            )
          );
        }
      )}
    </>
  );
};

export default Table;
