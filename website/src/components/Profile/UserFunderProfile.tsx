import React, { FC } from 'react';

import { UserFunder } from '@api/UserFunderService';
import { InputFormat } from '@utils/table';

import Table from '@components/Table/Table';

import { FunderType } from '../../constants';
import { useGetFunder } from '@utils/keycloakUtils';
import { isManager, isSuperManager, isSupervisor } from '@utils/funders';

import Strings from './locale/fr.json';

interface UserFunderProfileProps {
  userFunder: UserFunder;
}

const UserFunderProfile: FC<UserFunderProfileProps> = ({ userFunder }) => {
  const { funderType } = useGetFunder();

  const identityList: InputFormat = [
    { label: Strings['profile.label.name'], json: 'lastName', type: 'text' },
    {
      label: Strings['profile.label.lastName'],
      json: 'firstName',
      type: 'text',
    },
    {
      label: Strings['profile.label.birthDate'],
      json: 'birthdate',
      type: 'date',
    },
    { label: Strings['profile.label.family.status'], json: '', type: 'text' },
    { label: Strings['profile.label.email'], json: 'email', type: 'text' },
  ];

  const managementRightsList: InputFormat = [
    {
      label:
        funderType === FunderType.ENTERPRISES
          ? Strings['profile.label.enterprise']
          : funderType === FunderType.COLLECTIVITIES ?
          Strings['profile.label.collectivity'] :
          Strings['profile.label.nationalAdministration'],
      json: 'funderName',
      type: 'text',
    },
    {
      label: Strings['profile.label.attributed.role'],
      json: 'rolesPhrase',
      type: 'text',
    },
    {
      label: Strings['profile.label.attributed.community'],
      json: 'communitiesPhrase',
      type: 'text',
    },
  ];

  return (
    <>
      <h2>{Strings['profile.form.title.identity']}</h2>
      <Table inputFormatList={identityList} data={userFunder} />
      <h2>{Strings['profile.form.title.management.rights']}</h2>
      <Table inputFormatList={managementRightsList} data={userFunder} />
      <div className="mcm-funder-info-block">
        {isSuperManager(userFunder)
          ? Strings['profile.funder-super-managers-role-info']
          : isManager(userFunder)
          ? Strings['profile.funder-managers-role-info']
          : isSupervisor(userFunder) &&
            Strings['profile.funder-supervisors-role-info']}
      </div>

      <div className="mcm-funder-role-rights-info">
        {Strings['profile.funder-role-rights-info']}
      </div>
    </>
  );
};

export default UserFunderProfile;
