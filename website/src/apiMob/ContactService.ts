import { https } from '@utils/https';

export type Contact = {
  lastName: string;
  firstName: string;
  userType: string;
  email: string;
  postcode: string;
  message?: string;
  tos: boolean;
};

export const send = async (contactData: Contact): Promise<{}> => {
  const { data } = await https.post<Contact>(`/v1/contact`, contactData);
  return data;
};
