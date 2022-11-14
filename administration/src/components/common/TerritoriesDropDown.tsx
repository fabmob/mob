/* eslint-disable */
import { useEffect, useState, FC } from 'react';
import { required, useNotify, AutocompleteInput } from 'react-admin';
import { useFormState } from 'react-final-form';
import { useQuery } from 'react-query';
import { getTerritories } from '../../api/territories';
import { checkNamesLength } from '../../utils/checkNamesLength';
import { removeWhiteSpace } from '../../utils/helpers';
import TerritoryMessages from '../../utils/Territory/fr.json';

interface TerritoryProps {
  canCreate?: boolean;
}

interface TerritoryOption {
  id?: string;
  name: string;
  label: string;
}

const TerritoriesDropDown: FC<TerritoryProps> = ({ canCreate = true }) => {
  const notify = useNotify();
  const { values } = useFormState();

  const [territoriesList, setTerritoriesList] = useState<TerritoryOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<TerritoryOption>(null);

  const { data: territories } = useQuery(
    'territories',
    async (): Promise<any> => {
      return await getTerritories();
    },
    {
      onError: () => {
        notify(TerritoryMessages['territory.error'], 'error');
      },
      enabled: true,
    }
  );

  const checkExistingValue = (value: string): TerritoryOption | undefined =>
    territoriesList.find(
      (choice) => choice?.name?.toLowerCase() === value?.toLowerCase()
    );

  const handleInputChanged = (data: TerritoryOption): void => {
    setSelectedOption(data);
  };

  const handleOptionChange = (choice: TerritoryOption): string =>
    choice?.label ? choice.label : choice?.name;

  const handleCreateOption = (value: string): TerritoryOption => {
    if (value) {
      value = removeWhiteSpace(value);
      const foundValue = checkExistingValue(value);
      if (!foundValue) {
        const newTerritory = { name: value, label: value };
        setTerritoriesList([...territoriesList, newTerritory]);
        return newTerritory;
      }
      return foundValue;
    }
  };

  let createProp = {};
  if (canCreate) {
    createProp['onCreate'] = handleCreateOption;
  }

  useEffect(() => {
    setTerritoriesList(
      territories &&
        territories.map((elt: TerritoryOption) => {
          elt.label = `${elt.name} (créé)`;
          return elt;
        })
    );
  }, [territories]);

  useEffect(() => {
    // ID GENERATED WHEN CREATING A NEW ITEM ON LIST CHOICES
    if (selectedOption) {
      if (selectedOption?.id === '@@ra-create') {
        values.territoryName = values?.territory?.name; // TODO: REMOVING DEPRECATED territoryName.
        const foundValue = checkExistingValue(values?.territory?.name);
        if (foundValue) {
          values.territory.id = foundValue?.id;
        }
      } else {
        values.territory = {
          id: selectedOption?.id,
          name: selectedOption?.name,
        };
        values.territoryName = selectedOption?.name; // TODO: REMOVING DEPRECATED territoryName.
      }
    }
  }, [selectedOption, values]);

  return (
    <AutocompleteInput
      label="Nom du territoire"
      source="territory.name"
      optionValue="name"
      fullWidth
      validate={[required(), checkNamesLength]}
      choices={territoriesList}
      optionText={handleOptionChange}
      onSelect={handleInputChanged}
      {...createProp}
    />
  );
};

export default TerritoriesDropDown;
