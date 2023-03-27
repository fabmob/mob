/* eslint-disable */
import { FC } from 'react';
import {
  required,
  ReferenceArrayInput,
  maxLength,
  AutocompleteArrayInput,
} from 'react-admin';
import IncentiveMessages from '../../utils/Aide/fr.json';

const TerritoriesDropDown: FC = () => {
  const filterToQuery = (searchText: string) => {
    if (searchText) {
      return {
        name: { like: searchText, options: 'i' },
      };
    }
  };

  return (
    <ReferenceArrayInput
      source="territoryIds"
      reference="territoires"
      filterToQuery={filterToQuery}
    >
      <AutocompleteArrayInput
        optionText="name"
        label="Territoire / Localisation *"
        validate={[
          required(),
          maxLength(1, IncentiveMessages['territory.error.maxItems']),
        ]}
        fullWidth
      />
    </ReferenceArrayInput>
  );
};

export default TerritoriesDropDown;
