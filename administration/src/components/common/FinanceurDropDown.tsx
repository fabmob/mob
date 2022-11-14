/* eslint-disable */
import { required, useNotify, AutocompleteInput } from 'react-admin';
import { useFormState } from 'react-final-form';
import { useQuery } from 'react-query';
import { getFunders } from '../../api/financeurs';

import FinanceurMessages from '../../utils/Financeur/fr.json';

interface FunderProps {
  disabled?: boolean;
}

export interface Enterprise {
  id?: string;
  emailFormat?: string[];
  funderType?: string;
  name?: string;
  hasManualAffiliation?: boolean;
}

const FinanceurDropDown = ({ disabled }: FunderProps) => {
  const notify = useNotify();
  const { values } = useFormState();

  const { data: funders } = useQuery(
    'funders',
    async (): Promise<any> => {
      return await getFunders();
    },
    {
      onError: () => {
        notify(FinanceurMessages['funders.error'], 'error');
      },
      enabled: true,
      retry: false,
      staleTime: Infinity,
    }
  );

  return (
    <AutocompleteInput
      label="Nom du financeur"
      source="funderId"
      fullWidth
      disabled={disabled}
      validate={[required()]}
      choices={
        funders &&
        funders.map(
          ({ id, name, funderType, emailFormat, hasManualAffiliation }) => ({
            id,
            name: `${name} (${funderType})`,
            emailFormat,
            hasManualAffiliation,
          })
        )
      }
      onInputValueChange={(_, data) =>
        (values.emailFormat = data?.selectedItem?.emailFormat) &&
        (values.hasManualAffiliation = data?.selectedItem?.hasManualAffiliation)
      }
    />
  );
};

export default FinanceurDropDown;
