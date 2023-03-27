/* eslint-disable */
import { required, useNotify, AutocompleteInput } from 'react-admin';
import { useFormState } from 'react-final-form';

import { useQuery } from 'react-query';
import { getFunders } from '../../api/funders';
import { FUNDER_TYPE, IFunders, INCENTIVE_TYPE } from '../../utils/constant';
import FunderMessages from '../../utils/Funder/fr.json';

interface FunderProps {
  disabled?: boolean;
}

const FunderDropDown = ({ disabled }: FunderProps) => {
  const notify = useNotify();
  const { values } = useFormState();

  const { data: funders } = useQuery(
    'funders',
    async (): Promise<IFunders[]> => {
      return await getFunders();
    },
    {
      onError: () => {
        notify(FunderMessages['funders.error'], 'error');
      },
      enabled: true,
      retry: false,
    }
  );

  const setFunderChoices = () => {
    let fundersChoices: IFunders[] = funders;
    if (values.incentiveType === INCENTIVE_TYPE.TERRITORY_INCENTIVE) {
      fundersChoices = fundersChoices.filter(
        (funder) => funder.type === FUNDER_TYPE.COLLECTIVITY
      );
    }
    if (values.incentiveType === INCENTIVE_TYPE.EMPLOYER_INCENTIVE) {
      fundersChoices = fundersChoices.filter(
        (funder) => funder.type === FUNDER_TYPE.ENTERPRISE
      );
    }
    return fundersChoices?.map(({ id, name, type, enterpriseDetails }) => ({
      id,
      name: `${name} (${type})`,
      emailDomainNames: enterpriseDetails?.emailDomainNames,
      hasManualAffiliation: enterpriseDetails?.hasManualAffiliation,
    }));
  };

  return (
    <AutocompleteInput
      label="Nom du financeur"
      source="funderId"
      fullWidth
      disabled={disabled}
      validate={[required()]}
      choices={setFunderChoices()}
      onInputValueChange={(_, data) => {
        values.emailDomainNames = data?.selectedItem?.emailDomainNames;
        values.hasManualAffiliation = data?.selectedItem?.hasManualAffiliation;
      }}
    />
  );
};

export default FunderDropDown;
