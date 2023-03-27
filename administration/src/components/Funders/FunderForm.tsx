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
import { AsideFunder } from './FunderAside';


import FunderMessages from '../../utils/Funder/fr.json';
import { errorFetching } from '../../utils/constant';
import FunderCreateForm from './FunderCreateForm';


const FunderForm = (props) => {
  const { save, record } = useCreateContext();

  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const onFailure = ({ message }) => {
    const result =
      message !== errorFetching.messageApi
        ? FunderMessages[message]
        : errorFetching.messageToDisplay;
    notify(result, 'error');
  };

  const onSuccess = ({ data }) => {
    notify(
      `Création du compte financeur "${data.name}" avec scutes`,
      'success'
    );
    redirect('/financeurs');
    refresh();
  };

  return (
    <Create
      title="Créer un financeur"
      {...props} 
      onSuccess={onSuccess}
      onFailure={onFailure}
      aside={<AsideFunder />}
    >
      <SimpleForm destroyOnUnregister>
        <FunderCreateForm save={save} record={record} />
      </SimpleForm>
    </Create>
  );
};
export default FunderForm;
