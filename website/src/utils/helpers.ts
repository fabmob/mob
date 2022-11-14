import { format } from 'date-fns';
import { transportMapping } from '@utils/aides';
import { AnyObject } from 'yup/lib/types';
import { capitalize } from 'lodash';

// Check if window is defined (so if in the browser or in node.js).
export const browser = typeof window !== 'undefined' && window;

// PS: there's a big security issue by using _blank in a href element so i prefer using this helper function
export const createPreviewURL = (binaryFile: any, mimeType: string): string => {
  const file = new Blob([binaryFile], { type: mimeType });
  return URL.createObjectURL(file);
};

/**
 * Revoke built preview url to free memory
 * @param url string
 */
export const revokePreviewURL = (url: string) => {
  URL.revokeObjectURL(url);
};

export const stringifyParams = (queryParams: {
  [key: string]: string[] | string | undefined | number;
}): string => {
  const keys = Object.keys(queryParams);
  if (!keys.length) {
    return '';
  }

  const stringifiedParams: string = keys
    .map((key) => {
      const value = queryParams[key];
      return value !== undefined && value !== ''
        ? `${key}=${value}`
        : undefined;
    })
    .filter((key) => !!key)
    .join('&');

  return stringifiedParams !== '' ? `?${stringifiedParams}` : '';
};

export const formattedDateFile = (date: Date) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return dd + mm + yyyy;
};

export const formattedBirthdate = (date: Date) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const compareObjects = (item1: any, item2: any, key: string) => {
  const obj1 = item1[key].toUpperCase();
  const obj2 = item2[key].toUpperCase();
  if (obj1 < obj2) {
    return -1;
  }
  if (obj1 > obj2) {
    return 1;
  }
  return 0;
};

// formater un string ex:(laUra => Laura)
export const firstCharUpper = (item: string = ''): string => {
  let separateWord = item?.toLowerCase().split(/[- ]+/);
  for (let i = 0; i < separateWord?.length; i++) {
    separateWord[i] = capitalize(separateWord[i]);
  }
  return separateWord?.join(' ');
};

export const setCompaniesList = (enterprisesList: []): [] => {
  /**
   * generate the companies options list
   */
  const companies: [] = [];

  enterprisesList.forEach(
    (item: { id: string; name: string; emailFormat: string }) =>
      companies.push({
        id: item.id,
        value: item.name,
        label: item.name,
        formats: item.emailFormat,
      })
  );

  /**
   * sort the companies options list
   */
  companies.sort((a: any, b: any) => compareObjects(a, b, 'label'));

  return companies;
};

/**
 * get year, day and month from date format [YYYY-MM-DD]
 */
export const formatInputDate = (date: string, dateFormat: string) => {
  if (date) {
    const [day, month, year] = date.split('-');
    const extractDate = new Date(
      parseInt(day),
      parseInt(month) - 1,
      parseInt(year)
    );
    return format(extractDate, dateFormat);
  }
};

/**
 * returns the list of transports under array of string.
 * @param transports The transport list.
 * @returns string[] Transport list under array :)
 */
export const flattenTransportList = (transports: string[]): string[] => {
  return transports.map((transport) => transportMapping[transport]);
};

/**
 * Returns Boolean based on value of nested properties
 * @param obj the object.
 * @param stringName string of nested properties.
 * @returns true or false.
 *
 */
export const getValueByString = (obj: AnyObject, stringName: string) => {
  if (!stringName) return false;
  else {
    let prop,
      nestedKeys = stringName.split('.'),
      objCopy = { ...obj };
    for (const key of nestedKeys) {
      prop = objCopy[key];
      if (prop !== undefined) {
        objCopy = prop;
      } else {
        break;
      }
    }

    return prop ? true : false;
  }
};

/**
 * Converts the first character of the string to a capital letter
 *
 */
export const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const isExpired = (dateToVerify: Date, referenceDate: Date) => {
  const dateToVerifyTime = dateToVerify.getTime();
  const referenceDateTime = referenceDate.getTime();
  return dateToVerifyTime < referenceDateTime;
};

/**
 * format datePicker value
 * @param date date to format (dd/mm/yyyy)
 * @returns formatted date yyyy-mm-dd
 */
export const formatDate = (date: string) => {
  const [day, month, year] = date.split('/');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

/**
 * Sort array alphabetically ignoring accents exp (i=î)
 * @param data array of object
 * @param label property in object to sort the array
 * @returns sorted array alphabetically ignoring accents exp (i=î)
 */
export const sortData = (data: Record<string, string>[], label: string) => {
  return data.sort((a, b) => {
    if (a[label].localeCompare(b[label], 'fr', { sensitivity: 'base' }) < 0) {
      return -1;
    }
    if (a[label].localeCompare(b[label], 'fr', { sensitivity: 'base' }) > 0) {
      return 1;
    }
    return 0;
  });
};
