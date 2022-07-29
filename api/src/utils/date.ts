import {formatInTimeZone} from 'date-fns-tz';
import {differenceInMinutes, add} from 'date-fns';

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
