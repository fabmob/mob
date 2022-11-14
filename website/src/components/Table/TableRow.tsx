import React, { FC } from 'react';
import './_table-row.scss';
import { format } from 'date-fns';
import SVG from '@components/SVG/SVG';
import List from '@components/List/List';
import { Action, TableRowProps } from '@utils/table';

/**
 * Generic Component to show row information given by Table parent component
 * IconName is showing an icon with the value if present (see SVGIcons for possible values)
 * Label is showing field label if present (ex: 'Nom', 'Prenom')
 * Type is used to determine if value needs to be parsed
 * Value is the value to show
 * ActionList is used to add one or multiple actions in the end of the row
 * You can refer a 'callback' function in Action if you actually want 'action' to do something
 * See utils/table for more information about types.
 * @param param0 TableRowProps
 * @returns
 */
const TableRow: FC<TableRowProps> = ({
  iconName = undefined,
  label = undefined,
  type,
  value,
  actionList = undefined,
  actionId = 0,
}) => {
  /**
   * Format value according to type
   * @param value string | number
   * @returns
   */
  const formatValue = (): string | number | JSX.Element => {
    switch (type) {
      case 'text':
        return value;
      case 'array':
        return value.map((item: string | number) => {
          return <div>{item}</div>;
        });
      case 'arrayBullets':
        return <List items={value} nospace></List>;
      case 'date':
        return format(new Date(value), 'dd/MM/yyyy');
      default:
        return value;
    }
  };

  /**
   * Determine which component to return based on action type
   * @param action Action
   * @param index number
   * @returns
   */
  const formatAction = (action: Action, index: number): JSX.Element => {
    switch (action.type) {
      case 'p':
        return <p key={`${action.type}-${index}`}>{action.label}</p>;
      case 'a':
        return (
          <a key={`${action.type}-${index}`} onClick={() => action.callback!()}>
            {action.label}
          </a>
        );
      case 'button':
        return (
          <button
            type="button"
            key={`${action.type}-${index}`}
            onClick={() => action.callback?.()}
          >
            {action.label}
          </button>
        );
      default:
        return <p key={`${action.type}-${index}`}>{action.label}</p>;
    }
  };

  /**
   * set the table row action node
   */
  const rowJSX = actionList ? formatAction(actionList[actionId], 0) : null;

  return (
    <div className="mcm-row-container">
      {label && <p className="mcm-row-label">{label}</p>}
      <div className="mcm-row-value">
        {iconName && <SVG icon={iconName} size={20} />}
        {formatValue()}
      </div>
      <div className="mcm-row-action">{rowJSX}</div>
    </div>
  );
};

export default TableRow;
