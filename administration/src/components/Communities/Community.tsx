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
import CommunityCreateForm from './CommunityCreateForm';
import CommunityMessages from '../../utils/Community/fr.json';
import {AsideCommunity} from './CommunityAside'

const CommunityForm = (props) => {
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
        ? CommunityMessages[message]
        : errorFetching.messageToDisplay;
    notify(result, 'error');
  };

  return (
    <Create
      title="Créer une communauté"
      {...props}
      onSuccess={onSuccess}
      onFailure={onFailure}
      transform={(data) => {
        delete data.emailDomainNames;
        delete data.hasManualAffiliation;
        return data;
      }}
      aside={<AsideCommunity />}
    >
      <SimpleForm>
        <CommunityCreateForm save={save} record={record} />
      </SimpleForm>
    </Create>
  );
};

export default CommunityForm;
