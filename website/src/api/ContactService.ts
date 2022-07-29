import { http } from '@utils/http';

export type Contact = {
  lastName: string;
  firstName: string;
  userType: string;
  email: string;
  postcode: string;
  message?: string;
  tos: boolean;
};

export const send = async (contactData: Contact): Promise<any> => {
  const { data } = await http.post<Contact>(`/v1/contact`, contactData);
  return data;
};
