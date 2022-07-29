import { http } from '@utils/http';
import { stringifyParams } from '@utils/helpers';
import { Citizen, ClientOfConsent, Consent } from '@utils/citoyens';

export const createCitizen = async (userData: Citizen): Promise<{}> => {
  const { data } = await http.post<Citizen>(
    `v1/citizens`,
    JSON.stringify(userData)
  );
  return data;
};

export const searchSalaries = async (
  status?: string,
  lastName?: string,
  skip?: number
): Promise<{}> => {
  const params: {
    [key: string]: string[] | string | undefined | number;
  } = {
    status,
    lastName,
    skip,
  };

  const newUrl = `v1/citizens${stringifyParams(params)}`;
  const { data } = await http.get<Citizen[]>(newUrl);
  return data;
};

export const getCitizenById = async (id: string): Promise<{}> => {
  const { data } = await http.get<Citizen>(`v1/citizens/profile/${id}`);
  return data;
};

export const getConsentsById = async (id: string): Promise<Consent[]> => {
  const { data } = await http.get<ClientOfConsent[]>(
    `v1/citizens/${id}/linkedAccounts`
  );
  return data;
};

export const deleteConsent = async (
  id: string,
  clientId: string
): Promise<void> => {
  await http.delete<void>(`v1/citizens/${id}/linkedAccounts/${clientId}`);
};

export const getCitizens = async (
  lastName: string,
  skip: number
): Promise<{}> => {
  let params = '?';
  params += lastName ? `lastName=${lastName}` : '';
  params += skip ? `&skip=${skip}` : '';
  const { data } = await http.get<Citizen>(
    `/v1/collectivitiesCitizens${params}`
  );
  return data;
};

export const getCitizenName = async (id: string): Promise<Citizen> => {
  const { data } = await http.get<Citizen>(`v1/citizens/${id}`);
  return data;
};

export const downloadRgpdFileXlsx = async (id: string): Promise<any> => {
  const { data } = await http.get<Citizen>(`v1/citizens/${id}/export`, {
    responseType: 'blob',
  });
  return data;
};

export const updateCitizenById = async (
  id: string,
  citizenData: Partial<Citizen>
): Promise<void> => {
  await http.patch<Citizen>(`v1/citizens/${id}`, JSON.stringify(citizenData));
};

export const putCitizenAffiliation = async (token: string): Promise<{}> => {
  const { data } = await http.put(
    `v1/citizens/affiliate`,
    JSON.stringify({ token })
  );
  return data;
};

export const putCitizenDesaffiliation = async (
  citizenId: string
): Promise<{}> => {
  const { data } = await http.put(`/v1/citizens/${citizenId}/disaffiliate`);
  return data;
};

export const deleteCitizenAccount = async (citizenId: string): Promise<{}> => {
  const { data } = await http.put(`v1/citizens/${citizenId}/delete`);
  return data;
};
