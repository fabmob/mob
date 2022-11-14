/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable */

import {
  Create,
  SimpleForm,
  useCreateContext,
  useNotify,
  useRedirect,
  useRefresh,
} from 'react-admin';

import EntrepriseCreateForm from './EntrepriseCreateForm';
import EntreprisesMessages from '../../utils/Entreprise/fr.json';
import { errorFetching } from '../../utils/constant';

const EntrepriseForm = (props) => {
  const { save, record } = useCreateContext();

  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const onFailure = ({ message }) => {
    const result =
      message !== errorFetching.messageApi
        ? EntreprisesMessages[message]
        : errorFetching.messageToDisplay;
    notify(result, 'error');
  };

  const onSuccess = ({ data }) => {
    notify(
      `Création du compte entreprise "${data.name}" avec succès`,
      'success'
    );
    redirect('/entreprises');
    refresh();
  };

  return (
    <Create
      title="Créer un compte entreprise"
      {...props}
      onSuccess={onSuccess}
      onFailure={onFailure}
    >
      <SimpleForm>
        <EntrepriseCreateForm save={save} record={record} />
      </SimpleForm>
    </Create>
  );
};
export default EntrepriseForm;
