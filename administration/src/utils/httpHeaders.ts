/* eslint-disable */
export const getAuthHeader = (): any => {
  try {
    let authHeader = null;
    const token = localStorage.getItem('token');

    if (token != null) {
      authHeader = { Authorization: `Bearer ${token}` };
    }
    return authHeader;
  } catch (error) {
    throw new Error(error);
  }
};
