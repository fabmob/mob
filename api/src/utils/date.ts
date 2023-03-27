import {formatInTimeZone} from 'date-fns-tz';
import {differenceInMinutes, add} from 'date-fns';
import {datePattern} from '../constants';

export const TIMEZONE = 'Europe/Paris';

export const formatDateInTimezone = (date: Date, dateFormat: string) => {
  return formatInTimeZone(date.getTime(), TIMEZONE, dateFormat);
};

/**
 * Check if date value + hoursIntervale is after this instant
 * @param dateValue date to compare
 * @param hoursIntervale numbre of hour to add to dateValue
 * @returns boolean
 */
export const isAfterDate = (dateValue: Date, hoursIntervale: number) => {
  const futureDate = add(dateValue, {
    hours: hoursIntervale,
  });
  return differenceInMinutes(new Date(), futureDate) > 0;
};

/**
 * Check if date to verify is before reference date
 * @param dateToVerify date to verify
 * @param referenceDate reference date
 * @returns boolean
 */
export const isExpired = (dateToVerify: Date, referenceDate: Date) => {
  const dateToVerifyTime = dateToVerify.getTime();
  const referenceDateTime = referenceDate.getTime();
  return dateToVerifyTime < referenceDateTime;
};

/**
 * Format Date as Day/Month/Year
 */
export const formatDateInFrenchNotation = (date: Date) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

/**
 * Validate date like dd/mm/yyyy Or dd-mm-yyyy
 * @param dateString : string date
 */
export const isValidDate = (dateString: string) => {
  return datePattern.test(dateString);
};

/**
 * Converts date like dd/mm/yyyy Or dd-mm-yyyy to ISO Date
 * @param dateString : string date
 * @returns an ISO 8601 string Or undefined id date not valid
 */
export const convertToISODate = (dateString: string): string | undefined => {
  if (isValidDate(dateString)) {
    // Split the date string into day,year and month
    const dateParts = dateString.split(/[\/-]/);
    const ISODate = dateParts[2] + '-' + dateParts[1].padStart(2, '0') + '-' + dateParts[0].padStart(2, '0');

    // Returns an ISO 8601 formatted string
    return new Date(ISODate).toISOString();
  }
};

/**
 * Convert Date object to String
 */
export const convertDateToString = (value: Date) => {
  if (!(value instanceof Date) || isNaN(value.getDate())) return '';
  const pad = '00';
  const yyyy = value.getFullYear().toString();
  const MM = (value.getMonth() + 1).toString();
  const dd = value.getDate().toString();
  return `${yyyy}-${(pad + MM).slice(-2)}-${(pad + dd).slice(-2)}`;
};
