/* eslint-disable */
import { useNotify, CheckboxGroupInput } from 'react-admin';
import { useFormState } from 'react-final-form';
import { useQuery } from 'react-query';

import CommunautesMessages from '../../utils/Communaute/fr.json';
import { ROLES } from '../../utils/constant';
import { getFunderCommunityList } from '../../api/communautes';

const CommunauteCheckBox = () => {
  const notify = useNotify();
  const { values } = useFormState();

  const enabled =
    !!values &&
    !!values.funderId &&
    !!values.roles &&
    (typeof values.roles === 'string'
      ? values.roles.split(' ; ').some((role) => role === ROLES.gestionnaires)
      : values.roles.some((role) => role === ROLES.gestionnaires));
  const { data: communities } = useQuery(
    `funders/${values.funderId}/communities`,
    async (): Promise<any> => {
      return await getFunderCommunityList(values.funderId);
    },
    {
      onError: () => {
        notify(CommunautesMessages['communautés.error'], 'error');
      },
      enabled,
      staleTime: 300000,
    }
  );

  const validateCommunities = (communityIds) => {
    const condition =
      communityIds &&
      communityIds.length > 0 &&
      communities &&
      communities.length > 0;

    return condition ? undefined : 'Il faut cocher au moins une communauté';
  };

  if (enabled && communities && communities.length > 0)
    return (
      <CheckboxGroupInput
        label="Liste des communautés"
        source="communityIds"
        choices={communities}
        validate={[validateCommunities]}
      />
    );
  if (enabled && communities)
    return (
      <span>
        Aucune communauté n'est créée pour ce financeur. Les droits seront
        appliqués pour l'ensemble du périmètre financeur
      </span>
    );
  return null;
};

export default CommunauteCheckBox;
