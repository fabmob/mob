/* eslint-disable */
import {
  TextInput,
  required,
  NumberInput,
  BooleanInput,
  AutocompleteArrayInput,
  useNotify,
  SelectInput,
  FormDataConsumer,
} from 'react-admin';
import { useForm } from 'react-final-form';
import { CardContent, Divider, Box } from '@material-ui/core';
import { InfoRounded } from '@material-ui/icons';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';

import { isEmailFormatValid } from '../../utils/helpers';
import { getClients } from '../../api/clients';
import FunderMessages from '../../utils/Funder/fr.json';
import { FUNDER_TYPE, FUNDER_TYPE_CHOICE } from '../../utils/constant';

import '../styles/DynamicForm.css';

const EMAIL_TAB = [{ id: '@exemple.com', name: '@exemple.com' }];

type checkboxParams = {
  source: string;
  label: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FunderCreateForm = (save, record) => {
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
        notify(FunderMessages['funders.error.clients.list'], 'error');
      },
      enabled: true,
      retry: false,
      staleTime: Infinity,
    }
  );
  useEffect(() => {
    if(clients && clients.length) {
      setClientChoice(
        clients.map((elt) => {
          elt.name = elt.clientId;
          return elt;
        })
      );
    } else {
      setClientChoice([])
    }

  }, [clients]);
  const checkBoxOptions: checkboxParams[] = [
    {
      source: 'enterpriseDetails.isHris',
      label: 'SI RH',
    },
    {
      source: 'enterpriseDetails.hasManualAffiliation',
      label: 'Validation affiliation par le gestionnaire',
    },
  ];

  const uncheckOtherOptions = (checkedOption: string) => {
    checkBoxOptions
      .filter((el) => el.source !== checkedOption)
      .forEach((option: checkboxParams) => form.change(option.source, false));
  };

  return (
    <Box flex="1" maxWidth={700}>
      <CardContent>
        <Box>
          <TextInput
            source="name"
            label="Nom du financeur"
            validate={[required()]}
            fullWidth
          />
        </Box>
        <Box>
          <SelectInput
            source="type"
            label="Type de financeur"
            fullWidth
            validate={[required()]}
            choices={FUNDER_TYPE_CHOICE}
          />
        </Box>
        <Box display="flex">
          <SelectInput
            source="clientId"
            label="Client"
            fullWidth
            allowEmpty
            choices={CLIENT_CHOICE}
          />
        </Box>

        <FormDataConsumer>
          {({ formData, ...rest }) =>
            (formData.type && formData.type !== FUNDER_TYPE.NATIONAL) && (
              <>
                <Box>
                  <NumberInput
                    source="siretNumber"
                    label="Numéro SIRET"
                    fullWidth
                  />
                </Box>
                <Box display="flex">
                  <NumberInput
                    source="citizensCount"
                    label="Nombre de citoyens"
                    fullWidth
                  />
                  <Spacer />
                  <NumberInput
                    source="mobilityBudget"
                    label="Montant du budget mobilité"
                    fullWidth
                  />
                </Box>
              </>
            )
          }
        </FormDataConsumer>

        <FormDataConsumer>
          {({ formData, ...rest }) =>
            formData.type === FUNDER_TYPE.ENTERPRISE && (
              <>
                <h3>Détails de l'entreprise</h3>
                <Box>
                  <AutocompleteArrayInput
                    source="enterpriseDetails.emailDomainNames"
                    label="Formats d'adresse acceptés"
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

                <Divider />

                {checkBoxOptions.map((checkBoxOption: checkboxParams) => (
                  <Box
                    key={checkBoxOption.source}
                    display="flex"
                    maxWidth={700}
                    height={40}
                  >
                    <BooleanInput
                      onClick={() => uncheckOtherOptions(checkBoxOption.source)}
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
              </>
            )
          }
        </FormDataConsumer>
      </CardContent>
    </Box>
  );
};

const Spacer = () => <Box width={20} component="span" />;

const validateFormatEmail = (value) => {
  return value.includes(undefined) || value.includes('@@ra-create')
    ? 'Ne doit pas être nul'
    : undefined;
};

export default FunderCreateForm;
