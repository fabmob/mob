import {Citizen} from '../models';
import {AFFILIATION_STATUS, FUNDER_TYPE} from './enum';

const isEnterpriseAffilitation = ({
  citizen,
  funderMatch,
  inputFunderId,
}: {
  citizen: Citizen | null;
  funderMatch:
    | ''
    | {
        funderType: FUNDER_TYPE;
        id?: string;
        name: string;
        siretNumber?: number | undefined;
        emailFormat?: string[];
        employeesCount?: number | undefined;
        budgetAmount?: number | undefined;
        isHris?: boolean;
      }
    | undefined;
  inputFunderId?: string | undefined;
}) => {
  return (
    funderMatch &&
    !!citizen &&
    !!inputFunderId &&
    citizen.affiliation &&
    citizen.affiliation.enterpriseId === inputFunderId &&
    citizen.affiliation.status === AFFILIATION_STATUS.AFFILIATED &&
    funderMatch.funderType === FUNDER_TYPE.enterprise
  );
};

export {isEnterpriseAffilitation};
