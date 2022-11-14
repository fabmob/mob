import { https } from '@utils/https';

export interface Territory {
    id: string;
    name: string;
}

export const getTerritories = async (): Promise<Territory[]> => {
  const { data } = await https.get<Territory[]>(
    `/v1/territories`
  );
  return data;
};
