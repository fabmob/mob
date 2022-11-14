import React, { FC } from 'react';

import Image from '@components/Image/Image';

interface UserNameProps {
  userName: string;
}

const UserName: FC<UserNameProps> = ({ userName }) => {
  return (
    <div className="mcm-citizen-card__name">
      <Image filename="illus-profile.svg" verticalAlign="bottom" size="mini" />
      {userName}
    </div>
  );
};

export default UserName;
