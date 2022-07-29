/* eslint-disable */
import { FC } from 'react';
import { Edit, EditProps, SimpleForm, useNotify, useRedirect, useRefresh } from 'react-admin';
import UtilisateurEditForm from './UtilisateurEditForm';
import { errorFetching } from '../../utils/constant';

const UtilisateurEdit: FC<EditProps> = (props) => {
  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const onSuccess = () => {
    notify(`Le profil de l'utilisateur est modifié`, 'success');
    redirect('/utilisateurs');
    refresh();
  };

  const onFailure = () => {
    notify(errorFetching.messageToDisplay, 'error');
  };

  return (
    <Edit  onSuccess={onSuccess} onFailure={onFailure} mutationMode="optimistic" title="Modification d'un utilisateur financeur" {...props}>
      <SimpleForm >
        <UtilisateurEditForm  />
      </SimpleForm>
    </Edit>
  );
};

export default UtilisateurEdit;
