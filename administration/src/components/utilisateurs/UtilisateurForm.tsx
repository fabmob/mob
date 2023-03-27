/* eslint-disable */
import {
  Create,
  SimpleForm,
  useCreateContext,
  useNotify,
  useRedirect,
  useRefresh,
} from 'react-admin';

import UtilisateurCreateForm from './UtilisateurCreateForm';
import UtilisateurMessages from '../../utils/Utilisateur/fr.json';
import CompteMessages from '../../utils/Compte/fr.json';
import { errorFetching } from '../../utils/constant';
import { AsideUtilisateur } from './UtilisateurAside';


const UtilisateurForm = (props) => {
  const { save, record } = useCreateContext();

  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const onFailure = ({ message }) => {
    const result =
      message !== errorFetching.messageApi
        ? UtilisateurMessages[message]
          ? UtilisateurMessages[message]
          : CompteMessages[message]
        : errorFetching.messageToDisplay;
    notify(result, 'error');
  };

  const onSuccess = ({ data }) => {
    notify(`Création de l'utilisateur ${data.email} avec succès`, 'success');
    redirect('/utilisateurs');
    refresh();
  };

  return (
    <Create
      title="Créer un utilisateur financeur"
      {...props}
      onSuccess={onSuccess}
      onFailure={onFailure}
      transform={(data) => {
        delete data.emailDomainNames;
        delete data.hasManualAffiliation;
        return data;
      }}
      aside={<AsideUtilisateur />}  
    >
      <SimpleForm>
        <UtilisateurCreateForm save={save} record={record} />
      </SimpleForm>
    </Create>
  );
};
export default UtilisateurForm;
