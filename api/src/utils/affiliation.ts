import {Citizen, Enterprise} from '../models';
import {AFFILIATION_STATUS} from './enum';

const isEnterpriseAffilitation = ({
  citizen,
  enterprise,
}: {
  citizen: Citizen | null;
  enterprise: Enterprise | null;
}) => {
  return (
    enterprise &&
    !!citizen &&
    citizen.affiliation &&
    citizen.affiliation.enterpriseId === enterprise.id &&
    citizen.affiliation.status === AFFILIATION_STATUS.AFFILIATED
  );
};

export {isEnterpriseAffilitation};
