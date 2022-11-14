/* eslint-disable */
import CollectiviteCreateForm from './CollectiviteCreateForm';
import {
  Create,
  SimpleForm,
  useCreateContext,
  useNotify,
  useRedirect,
  useRefresh,
} from 'react-admin';

import CollectivitesMessages from '../../utils/Collectivite/fr.json';
import { errorFetching } from '../../utils/constant';

const CollectiviteForm = (props) => {
  const { save, record } = useCreateContext();

  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const onSuccess = ({ data }) => {
    notify(`Création de la collectivité "${data.name}" avec succès`, 'success');
    redirect('/collectivites');
    refresh();
  };

  const onFailure = ({ message }) => {
    const result =
      message !== errorFetching.messageApi
        ? CollectivitesMessages[message]
        : errorFetching.messageToDisplay;
    notify(result, 'error');
  };

  return (
    <Create
      title="Créer une collectivité"
      {...props}
      onSuccess={onSuccess}
      onFailure={onFailure}
    >
      <SimpleForm>
        <CollectiviteCreateForm save={save} record={record} />
      </SimpleForm>
    </Create>
  );
};

export default CollectiviteForm;
