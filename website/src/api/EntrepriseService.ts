import { http } from '@utils/http';

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
};

export type EnterpriseName = {
  id: string;
  name: string;
  emailFormat: string[];
};

export const getEntreprisesList = async (): Promise<{}> => {
  const { data } = await http.get<EnterpriseName[]>(
    'v1/enterprises/email_format_list'
  );
  return data;
};
