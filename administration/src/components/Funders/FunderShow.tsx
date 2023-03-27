/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable */

import { Box, Chip, Divider } from '@material-ui/core';
import {
  BooleanField,
  Labeled,
  NumberField,
  Show,
  ShowController,
  SimpleShowLayout,
  TextField,
  useNotify,
  useRedirect,
  useRefresh,
} from 'react-admin';

import { FUNDER_TYPE } from '../../utils/constant';

const FunderShow = (props) => {
  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const onFailure = (error) => {
    notify(`Impossible de charger le financeur: ${error.message}`);
    redirect('/financeurs');
    refresh();
  };

  const FunderTitle = (props) => {
    return (
      <span>Financeur {props.record ? `"${props.record?.name}"` : ''}</span>
    );
  };

  return (
    <ShowController {...props}>
      {(controllerProps) => (
        <Show
          title={<FunderTitle />}
          onFailure={onFailure}
          {...props}
          {...controllerProps}
        >
          <SimpleShowLayout>
            <h5>Informations du financeur</h5>
            <TextField source="id" label="id" />
            <TextField source="name" label="Nom du financeur" />
            <TextField source="type" label="Type de financeur" />
            {controllerProps.record?.type !== FUNDER_TYPE.NATIONAL && (
              <Box>
                <Divider />
                <h6>Informations complémentaires du financeur</h6>
                <Box display="flex" justifyContent="space-between" width="50%">
                  <Labeled label="Numéro SIRET">
                    <NumberField source="siretNumber" />
                  </Labeled>
                  <Labeled label="Nombre de citoyens">
                    <NumberField source="citizensCount" />
                  </Labeled>
                  <Labeled label="Montant du budget mobilité">
                    <NumberField source="mobilityBudget" />
                  </Labeled>
                </Box>
              </Box>
            )}
            {controllerProps.record?.type === FUNDER_TYPE.ENTERPRISE &&
              controllerProps.record?.enterpriseDetails && (
                <>
                  <Divider />
                  <h6>Détails de l'entreprise</h6>
                  <Labeled label="Formats d'adresse acceptés">
                    <>
                      {controllerProps.record?.enterpriseDetails?.emailDomainNames.map(
                        (email) => {
                          return <Chip label={email} />;
                        }
                      )}{' '}
                    </>
                  </Labeled>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    width="30%"
                  >
                    <Labeled label="SI RH">
                      <BooleanField
                        source="enterpriseDetails.isHris"
                        label="SI RH"
                      />
                    </Labeled>
                    <Labeled label="Validation affiliation par le gestionnaire">
                      <BooleanField source="enterpriseDetails.hasManualAffiliation" />
                    </Labeled>
                  </Box>
                </>
              )}
          </SimpleShowLayout>
        </Show>
      )}
    </ShowController>
  );
};
export default FunderShow;
