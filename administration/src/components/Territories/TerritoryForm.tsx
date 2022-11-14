/* eslint-disable */
import {
  Create,
  SimpleForm,
  useCreateContext,
  useNotify,
  useRedirect,
  useRefresh,
} from 'react-admin';

import TerritoryCreateForm from './TerritoryCreateForm';
import TerritoryMessages from '../../utils/Territory/fr.json';
import { errorFetching } from '../../utils/constant';

const TerritoryForm = (props) => {
  const { save, record } = useCreateContext();

  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const onFailure = ({ message }): void => {
    const result: string =
      message !== errorFetching.messageApi
        ? TerritoryMessages[message]
        : errorFetching.messageToDisplay;
    notify(result, 'error');
  };

  const onSuccess = ({ data }): void => {
    notify(`Création du territoire ${data.name} avec succès`, 'success');
    redirect('/territoires');
    refresh();
  };

  return (
    <Create
      title="Créer un territoire"
      {...props}
      onSuccess={onSuccess}
      onFailure={onFailure}
    >
      <SimpleForm>
        <TerritoryCreateForm save={save} record={record} />
      </SimpleForm>
    </Create>
  );
};
export default TerritoryForm;
