import { http } from '@utils/http';
import { STATUS } from '@utils/demandes';

export type CitoyenAideDashboard = {
  result: Array<{ status: STATUS; count: number }>;
  totalCount: number;
};

export type DemandeAideDashboard = {
  result: Array<{ status: STATUS; count: number }>;
  totalCount: number;
};

export const getCitoyensDashboard = async (
  year: number,
  semester: number
): Promise<any> => {
  const url = `v1/dashboards/citizens?year=${year}&semester=${semester}`;
  const { data } = await http.get<CitoyenAideDashboard>(url);
  return data;
};

export const getDemandesDashboard = async (
  year: string,
  semester: string
): Promise<any> => {
  let url = `v1/dashboards/subscriptions?year=${year}&semester=${semester}`;
  const { data } = await http.get<DemandeAideDashboard>(url);
  return data;
};
