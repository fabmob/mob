/* eslint-disable */
import {
  Create,
  SimpleForm,
  useCreateContext,
  useNotify,
  useRedirect,
  useRefresh,
} from 'react-admin';

import { errorFetching } from '../../utils/constant';
import CommunauteCreateForm from './CommunauteCreateForm';
import CommunauteMessages from '../../utils/Communaute/fr.json';

const CommunauteForm = (props) => {
  const { save, record } = useCreateContext();

  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const onSuccess = ({ data }) => {
    notify(`Création de la communauté "${data.name}" avec succès`, 'success');
    redirect('/communautes');
    refresh();
  };

  const onFailure = ({ message }) => {
    const result =
      message !== errorFetching.messageApi
        ? CommunauteMessages[message]
        : errorFetching.messageToDisplay;
    notify(result, 'error');
  };

  return (
    <Create
      title="Créer une collectivité"
      {...props}
      onSuccess={onSuccess}
      onFailure={onFailure}
      transform={(data) => {
        delete data.emailFormat;
        return data;
      }}
    >
      <SimpleForm>
        <CommunauteCreateForm save={save} record={record} />
      </SimpleForm>
    </Create>
  );
};

export default CommunauteForm;
