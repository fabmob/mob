const isValidityDateValid = (validityDate: string) => {
  const currentDateFormat = formatDate(new Date());

  const validityDateFormat = formatDate(new Date(validityDate));

  return validityDateFormat >= currentDateFormat;
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

const formatDateExcel = (date: Date) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const isEmailFormatValid = (email: string) => {
  const regex = new RegExp(
    /^@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  );
  return email.match(regex);
};

export {isValidityDateValid, formatDate, isAgeValid, formatDateExcel, isEmailFormatValid};
