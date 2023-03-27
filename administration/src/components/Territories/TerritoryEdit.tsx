/* eslint-disable */
import { FC } from 'react';
import {
  Edit,
  EditProps,
  SaveButton,
  SimpleForm,
  Toolbar,
  ToolbarProps,
  useNotify,
  useRedirect,
  useRefresh,
} from 'react-admin';
import TerritoryEditForm from './TerritoryEditForm';
import { errorFetching } from '../../utils/constant';
import TerritoryMessages from '../../utils/Territory/fr.json';
import { validateTerritoryForm } from '../../utils/helpers';
import { Aside } from './TerritoryAside';

const TerritoryEdit: FC<EditProps> = (props) => {
  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const onSuccess = (): void => {
    notify(`Le territoire a été modifié avec succes`, 'success');
    redirect('/territoires');
    refresh();
  };

  const onFailure = ({ message }): void => {
    const result: string =
      message !== errorFetching.messageApi
        ? TerritoryMessages[message]
        : errorFetching.messageToDisplay;
    notify(result, 'error');
  };

  const EditToolbar = (props: ToolbarProps) => {
    return (
      <Toolbar {...props}>
        <SaveButton disabled={props.pristine} />
      </Toolbar>
    );
  };

  return (
    <Edit
      mutationMode="pessimistic"
      {...props}
      onSuccess={onSuccess}
      onFailure={onFailure}
      aside={<Aside />}
      title="Modification d'un territoire"
    >
      <SimpleForm toolbar={<EditToolbar />} validate={validateTerritoryForm}>
        <TerritoryEditForm />
      </SimpleForm>
    </Edit>
  );
};

export default TerritoryEdit;
