/* eslint-disable */
import { required, useNotify, AutocompleteInput } from 'react-admin';
import { useFormState } from 'react-final-form';
import { useQuery } from 'react-query';
import { getFunders } from '../../api/financeurs';

import FinanceurMessages from '../../utils/Financeur/fr.json';

const FinanceurDropDown = ({ disabled }: { disabled?: boolean }) => {
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
        funders.map(({ id, name, funderType, emailFormat }) => ({
          id,
          name: `${name} (${funderType})`,
          emailFormat,
        }))
      }
      onSelect={(elt) => (values.emailFormat = elt.emailFormat)}
    />
  );
};

export default FinanceurDropDown;
