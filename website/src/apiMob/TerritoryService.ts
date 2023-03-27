import { https } from '@utils/https';
import { IFilter, stringifyParams } from '@utils/api';

export interface Territory {
    id: string;
    name: string;
}

export const getTerritories = async (): Promise<Territory[]> => {
  const filter: IFilter<Territory> = {
    fields: {
      "id": true,
      "name": true
    }
  }
 
  const { data } = await https.get<Territory[]>(
    `/v1/territories${stringifyParams({filter: JSON.stringify(filter)})}`
  );
  return data;
};
