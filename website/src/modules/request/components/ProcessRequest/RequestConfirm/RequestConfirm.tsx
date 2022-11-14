import React, { FC } from 'react';
import Button from '@components/Button/Button';
import { Link } from 'gatsby';
import Strings from '../locale/fr.json';

/**
 * @name RequestConfirm
 * @description This is the last step in the process of validating/rejecting request.
 * @type [Business Controller]
 */
const RequestConfirm: FC<any> = () => {
  return (
    <>
      <div className="mcm-demande__button-section">
        <Button>
          <Link id="request-admin-demandes" to="/administrer-demandes">
          {Strings['request.confirm.button.admin.another.helps']}
          </Link>
        </Button>
      </div>
    </>
  );
};

export default RequestConfirm;
