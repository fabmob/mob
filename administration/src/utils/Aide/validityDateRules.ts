/* eslint-disable */
import { convertDateToString } from '../convertDateToString';
import AidesMessages from './fr.json';

// display only date to select  to input validityDate
export const startDateMin = () => {
  var someDate = new Date();
  return convertDateToString(
    new Date(someDate.setDate(someDate.getDate() + 1))
  );
};

// add validation to input validityDate
export const dateMinValidation = (value) => {
  if (value < startDateMin()) {
    return AidesMessages['incentives.error.validityDate.minDate'];
  }
  return undefined;
};
