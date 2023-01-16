const isValidityDateValid = (validityDate: string) => {
  return new Date(validityDate) >= new Date();
};

const formatDate = (date: Date) => {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
};

const isAgeValid = (birthdate: string) => {
  const currentDate = new Date();

  const lowelLimitDate = [
    currentDate.getFullYear() - 16,
    currentDate.getMonth() + 1,
    currentDate.getDate(),
  ].join('-');

  return formatDate(new Date(birthdate)) <= lowelLimitDate;
};

const isEmailFormatValid = (email: string) => {
  const regex = new RegExp(
    /^@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  );
  return email.match(regex);
};

export {isValidityDateValid, formatDate, isAgeValid, isEmailFormatValid};
