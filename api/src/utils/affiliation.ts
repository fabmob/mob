import {Citizen} from '../models';
import {AFFILIATION_STATUS, FUNDER_TYPE} from './enum';

const isEnterpriseAffilitation = ({
  citizen,
  funderMatch,
  inputFunderId,
}: {
  citizen: Citizen | null;
  funderMatch: any;
  inputFunderId: string | undefined;
}) => {
  return (
    funderMatch &&
    !!citizen &&
    !!inputFunderId &&
    citizen.affiliation &&
    citizen.affiliation.enterpriseId === inputFunderId &&
    citizen.affiliation.affiliationStatus === AFFILIATION_STATUS.AFFILIATED &&
    funderMatch.funderType === FUNDER_TYPE.enterprise
  );
};

export {isEnterpriseAffilitation};
