export type DataType = 'text' | 'date';

type ActionType = 'p' | 'a' | 'link';

export interface Action {
    label: string;
    callback?: Function;
    type: ActionType;
}

export interface TableRowProps {
    iconName?: string;
    label?: string;
    type: DataType;
    value: string | number;
    actionList?: Action[];
}

export interface InputFormat extends TableRowProps {
    json: string;
}