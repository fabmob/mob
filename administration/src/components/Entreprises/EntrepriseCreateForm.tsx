/* eslint-disable */
import {
  TextInput,
  required,
  NumberInput,
  BooleanInput,
  AutocompleteArrayInput,
  useNotify,
  SelectInput,
} from 'react-admin';
import { useForm } from 'react-final-form';
import { Card, CardContent, Divider, Box } from '@material-ui/core';
import { InfoRounded } from '@material-ui/icons';

import { isEmailFormatValid } from '../../utils/helpers';

import '../styles/DynamicForm.css';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { getClients } from '../../api/financeurs';
import FinanceurMessages from '../../utils/Financeur/fr.json';

const EMAIL_TAB = [{ id: '@exemple.com', name: '@exemple.com' }];

type checkboxParams = {
  source: string;
  label: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EntrepriseCreateForm = (save, record) => {
  const notify = useNotify();
  const form = useForm();
  const [CLIENT_CHOICE, setClientChoice] = useState<
    { clientId: string; id: string }[]
  >([]);

  const { data: clients } = useQuery(
    'clients',
    async (): Promise<any> => {
      return await getClients();
    },
    {
      onError: () => {
        notify(FinanceurMessages['funders.error.clients.list'], 'error');
      },
      enabled: true,
      retry: false,
      staleTime: Infinity,
    }
  );
  useEffect(() => {
    setClientChoice(
      clients &&
        clients.map((elt) => {
          elt.name = elt.clientId;
          return elt;
        })
    );
  }, [clients]);
  const checkBoxOptions: checkboxParams[] = [
    {
      source: 'isHris',
      label: 'SI RH',
    },
    {
      source: 'hasManualAffiliation',
      label: 'Validation affiliation par le gestionnaire',
    },
  ];

  const uncheckOtherOptions = (checkedOption: string) => {
    checkBoxOptions
      .filter((el) => el.source !== checkedOption)
      .forEach((option: checkboxParams) => form.change(option.source, false));
  };

  return (
    <Box display="flex">
      <Box flex="1">
        <Card>
          <CardContent>
            <Box>
              <Box display="flex">
                <Box flex="1" mt={-1}>
                  <Box mt={2} maxWidth={700} display="flex">
                    <TextInput
                      source="name"
                      label="Nom de l'entreprise"
                      validate={[required()]}
                      fullWidth
                    />
                    <Spacer />
                    <NumberInput
                      source="siretNumber"
                      label="Numéro SIRET"
                      fullWidth
                    />
                  </Box>
                  <Box maxWidth={700}>
                    <AutocompleteArrayInput
                      source="emailFormat"
                      label="Format d'adresse email de l'entreprise"
                      onCreate={(value) => {
                        if (isEmailFormatValid(value)) {
                          const newFormat = { id: value, name: value };
                          EMAIL_TAB.push(newFormat);
                          return newFormat;
                        }
                        EMAIL_TAB.push({ id: '', name: '' });
                      }}
                      fullWidth
                      choices={EMAIL_TAB}
                      validate={[required(), validateFormatEmail]}
                    />
                  </Box>
                  <Spacer />
                  <Divider />
                  <Box display="flex" maxWidth={700}>
                    <NumberInput
                      source="employeesCount"
                      label="Nombre de salariés dans l'entreprise"
                      fullWidth
                    />
                    <Spacer />
                    <NumberInput
                      source="budgetAmount"
                      label="Montant du budget mobilité"
                      fullWidth
                    />
                  </Box>
                  <Divider />
                  {CLIENT_CHOICE && (
                    <Box display="flex" maxWidth={700}>
                      <SelectInput
                        source="clientId"
                        label="Client"
                        fullWidth
                        choices={CLIENT_CHOICE}
                      />
                    </Box>
                  )}
                  {checkBoxOptions.map((checkBoxOption: checkboxParams) => (
                    <Box
                      key={checkBoxOption.source}
                      display="flex"
                      maxWidth={700}
                      height={40}
                    >
                      <BooleanInput
                        onClick={() =>
                          uncheckOtherOptions(checkBoxOption.source)
                        }
                        defaultValue={false}
                        source={checkBoxOption.source}
                        label={checkBoxOption.label}
                      />
                    </Box>
                  ))}
                  <Box
                    display="flex"
                    alignItems="center"
                    maxWidth={700}
                    height={60}
                  >
                    <InfoRounded color="primary" />
                    <p
                      style={{
                        marginLeft: '8px',
                        fontWeight: 400,
                        fontFamily: 'Helvetica',
                      }}
                    >
                      <small>
                        Vous ne pouvez pas activer les 2 options pour une
                        entreprise
                      </small>
                    </p>
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
const Spacer = () => <Box width={20} component="span" />;

const validateFormatEmail = (value) => {
  return value.includes(undefined) || value.includes('@@ra-create')
    ? 'Ne doit pas être nul'
    : undefined;
};

export default EntrepriseCreateForm;
