/* eslint-disable */
import {
  List,
  Datagrid,
  TextField,
  EditButton,
  DeleteButton,
  FunctionField,
  ReferenceField,
  downloadCSV,
  BooleanField,
  SearchInput,
  Filter
} from 'react-admin';
import {FC} from 'react';
import { MAPPING_FUNDER_TYPE } from '../../utils/constant';
import jsonExport from 'jsonexport/dist';
import { Incentive, IncentiveExport } from '../../utils/Aide/aideExport';
import { getTerritories } from '../../api/territories';
import { Territory } from '../../utils/helpers';
import { ListProps } from '@material-ui/core';

const exporter = (posts) => {
  getTerritories().then((data: Territory[]) => {
    const postsForExport: IncentiveExport[] = posts.map((post: Incentive) => {
      let territoryName: string;
      data.map((territory: Territory) => {
        if (territory.id === post.territoryIds[0]) {
          territoryName = territory.name;
        }
        return territoryName;
      }); //get TerritorieName with territoryIds

      const incentiveExport: IncentiveExport = {
        Nom_Aide: post.title,
        Proposition_de_valeur: post.description,
        Nom_du_territoire: territoryName,
        Type_de_financeur: post.incentiveType,
        Nom_du_financeur: post.funderName,
        Condition_obtention: post.conditions,
        Modalite_de_versement: post.paymentMethod,
        Montant: post.allocatedAmount,
        Montant_minimum: post.minAmount,
        Mode_de_transport: post.transportList,
        Justificatif: post.attachments,
        Bon_a_savoir: post.additionalInfos,
        Contact: post.contact,
        Duree_de_validite: post.validityDuration,
        Date_de_fin_de_validite: post.validityDate,
        Souscription_via_mcm: post.isMCMStaff,
        Date_de_creation: post.createdAt,
        Date_de_modification: post.updatedAt,
        Lien_Souscription: post.subscriptionLink,
      };

      return incentiveExport;
    });
    jsonExport(
      postsForExport,
      {
        headers: [
          'Nom_Aide',
          'Proposition_de_valeur',
          'Nom_du_territoire',
          'Type_de_financeur',
          'Nom_du_financeur',
          'Condition_obtention',
          'Modalite_de_versement',
          'Montant',
          'Montant_minimum',
          'Mode_de_transport',
          'Justificatif',
          'Bon_a_savoir',
          'Contact',
          'Duree_de_validite',
          'Date_de_fin_de_validite',
          'Souscription_via_mcm',
          'Date_de_creation',
          'Date_de_modification',
          'Lien_Souscription',
        ], // order fields in the export
      },
      (err, csv) => {
        downloadCSV(csv, 'Aides'); // download as 'Aides.csv` file
      }
    );
  });
};

const AideFilter: FC = (props) => (
  <Filter {...props}>
    <SearchInput 
      placeholder='Recherche Par Nom'
      source='title'
      resettable
      alwaysOn
    /> 
  </Filter>
);

const AideList: FC<ListProps> = (props) => {
  return (
    <List
      {...props}
      exporter={exporter}
      filters={<AideFilter />}
      sort={{ field: 'title', order: 'ASC' }}
    >
      <Datagrid>
        <TextField source="title" label="Nom de l'aide" />
        <TextField source="incentiveType" label="Type de l'aide" />
        <FunctionField
          label="Nom du financeur"
          sortBy="funderName"
          render={(record) => (
            <ReferenceField
              source="funderId"
              reference="financeurs"
              label="Nom du financeur"
              link="show"
            >
              <span>
                {`${record.funderName} (${
                  MAPPING_FUNDER_TYPE[record.incentiveType]
                })`}
              </span>
            </ReferenceField>
          )}
        />
        <ReferenceField
          label="Territoire"
          source="territoryIds"
          reference="territoires"
        >
          <TextField source="name" />
        </ReferenceField>
        <BooleanField
          source="isMCMStaff"
          valueLabelTrue="Oui"
          valueLabelFalse="Non"
          label="Dans moB"
        />
        <EditButton basePath="/aides" />
        <DeleteButton basePath="/aides" />
      </Datagrid>
    </List>
  );
};

export default AideList;
