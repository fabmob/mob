/* eslint-disable */
export const isEmailFormatValid = (email) => {
  const regex = new RegExp(
    /^@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
  return email.match(regex);
};
