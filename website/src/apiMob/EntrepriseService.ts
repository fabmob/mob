import { https } from '@utils/https';

export type Enterprise = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  emailFormat: string[];
  siretNumber: number;
  employeesCount: string;
  budgetAmount: number;
  hasManualAffiliation: boolean;
};

export type EnterpriseName = {
  id: string;
  name: string;
  emailFormat: string[];
};

export const getEntreprisesList = async (): Promise<{}> => {
  const { data } = await https.get<EnterpriseName[]>(
    'v1/enterprises/email_format_list'
  );
  return data;
};

export const getEntreprises = async (): Promise<{}> => {
  const { data } = await https.get<Enterprise[]>('v1/enterprises/');
  return data;
};
