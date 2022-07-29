/* eslint-disable */
import { useNotify, CheckboxGroupInput } from 'react-admin';
import { RadioButtonChecked, RadioButtonUnchecked } from '@material-ui/icons';
import { capitalize } from '@material-ui/core';
import { useQuery } from 'react-query';

import UtilisateursMessages from '../../utils/Utilisateur/fr.json';
import { getRoles } from '../../api/roles';

const RolesRadioButtons = () => {
  const notify = useNotify();

  const { data: roles } = useQuery(
    'roles',
    async (): Promise<any> => {
      return await getRoles();
    },
    {
      onError: () => {
        notify(UtilisateursMessages['users.roles.error'], 'error');
      },
      enabled: true,
      retry: false,
      staleTime: Infinity,
    }
  );

  const validateRoles = (roles) => {
    return roles && roles.length > 0
      ? undefined
      : 'Il faut cocher au moins un rôle';
  };

  return (
    <CheckboxGroupInput
      source={'roles'}
      label={'Rôles'}
      format={v =>( (typeof(v) === "string")? v.split(" ; ") : v)}
      choices={
        roles &&
        roles.map((role) => ({
          id: role,
          name: capitalize(role.replace(/s$/, '')),
        }))
      }
      options={{
        checkedIcon: <RadioButtonChecked />,
        icon: <RadioButtonUnchecked />,
      }}
      validate={[validateRoles]}
    />
  );
};

export default RolesRadioButtons;
