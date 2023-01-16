/* eslint-disable */
/**
 * Convert Date object to String
 *
 * @param {Date} value value to convert
 * @returns {String} A standardized date (yyyy-MM-dd), to be passed to an <input type="date" />
 */
export const convertDateToString = (value: Date) => {
  if (!(value instanceof Date) || isNaN(value.getDate())) return '';
  const pad = '00';
  const yyyy = value.getFullYear().toString();
  const MM = (value.getMonth() + 1).toString();
  const dd = value.getDate().toString();
  return `${yyyy}-${(pad + MM).slice(-2)}-${(pad + dd).slice(-2)}`;
};

export const getDate = (value: string | Date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  // null, undefined and empty string values should not go through dateFormatter
  // otherwise, it returns undefined and will make the input an uncontrolled one.
  if (value == null || value === '') {
    return undefined;
  }
  
  if (value instanceof Date) {    
    return convertDateToString(value);
  }

  // valid dates should not be converted
  if (dateRegex.test(value)) {
    return value;
  }
  return convertDateToString(new Date(value));
};

export const startDateMin = () => {
  return convertDateToString(
    new Date(new Date().setDate(new Date().getDate() + 1))
  );
};
