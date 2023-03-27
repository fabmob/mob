import { https } from '@utils/https';
import { stringifyParams, IFilter } from '@utils/api';
import { Citizen, ClientOfConsent, Consent } from '@utils/citoyens';
import { Count, PartialCitizen } from 'src/utils/citoyens';

export const createCitizen = async (userData: Citizen): Promise<{}> => {
  const { data } = await https.post<Citizen>(
    `v1/citizens`,
    JSON.stringify(userData)
  );
  return data;
};

export const searchSalaries = async (
  funderId: string,
  status?: string,
  lastName?: string,
  limit?: number,
  skip?: number
): Promise<PartialCitizen[]> => {
  const params: {
    [key: string]: string[] | string | undefined | number;
  } = {
    status,
    lastName,
    limit,
    skip,
  };

  const newUrl = `v1/funders/${funderId}/citizens${stringifyParams(params)}`;
  const { data } = await https.get<PartialCitizen[]>(newUrl);
  return data;
};

export const getCitizenById = async (
  id: string,
  filter?: IFilter<Citizen>
): Promise<Citizen> => {
  const params = { filter: JSON.stringify(filter) };

  const { data } = await https.get<Citizen>(
    `v1/citizens/${id}${stringifyParams(params)}`
  );
  return data;
};

export const getConsentsById = async (id: string): Promise<Consent[]> => {
  const { data } = await https.get<ClientOfConsent[]>(
    `v1/citizens/${id}/consents`
  );
  return data;
};

export const deleteConsent = async (
  id: string,
  clientId: string
): Promise<void> => {
  await https.delete<void>(`v1/citizens/${id}/consents/${clientId}`);
};

export const getCitizens = async (
  funderId: string,
  lastName: string,
  limit: number,
  skip: number
): Promise<PartialCitizen[]> => {
  const params: {
    [key: string]: string[] | string | undefined | number;
  } = {
    lastName,
    limit,
    skip,
  };

  const { data } = await https.get<PartialCitizen[]>(
    `/v1/funders/${funderId}/citizens${stringifyParams(params)}`
  );
  return data;
};

export const getCitizensCount = async (
  funderId: string,
  lastName?: string,
  status?: string
): Promise<Count> => {
  const params: {
    [key: string]: string[] | string | undefined | number;
  } = {
    lastName,
    status,
  };

  const { data } = await https.get<Count>(
    `/v1/funders/${funderId}/citizens/count${stringifyParams(params)}`
  );
  return data;
};

export const downloadRgpdFileXlsx = async (id: string): Promise<{}> => {
  const { data } = await https.get<Citizen>(`v1/citizens/${id}/export`, {
    responseType: 'blob',
  });
  return data;
};

export const updateCitizenById = async (
  id: string,
  citizenData: Partial<Citizen>
): Promise<void> => {
  await https.patch<Citizen>(`v1/citizens/${id}`, JSON.stringify(citizenData));
};

export const requestCitizenAffiliation = async (
  citizenId: string,
  token = ''
): Promise<{}> => {
  const { data } = await https.post(
    `v1/citizens/${citizenId}/affiliate`,
    JSON.stringify({ token })
  );
  return data;
};

export const requestCitizenDesaffiliation = async (
  citizenId: string
): Promise<{}> => {
  const { data } = await https.post(`/v1/citizens/${citizenId}/disaffiliate`);
  return data;
};

export const deleteCitizenAccount = async (citizenId: string): Promise<{}> => {
  const { data } = await https.delete(`v1/citizens/${citizenId}`);
  return data;
};
