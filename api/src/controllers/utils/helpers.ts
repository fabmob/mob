import {Subscription} from '../../models';
import {FUNDER_TYPE, IDashboardCitizenIncentiveList, INCENTIVE_TYPE} from '../../utils';

/**
 * INTERFACES
 *
 *
 *
 *
 */
interface SearchQueryDate {
  startDate: Date;
  endDate: Date;
}

/**
 * get the percentage of the validated subscription
 */
export const calculatePercentage = (
  incentiveList: Array<IDashboardCitizenIncentiveList>,
  totalCitizensCount: number,
): Array<IDashboardCitizenIncentiveList> => {
  incentiveList.forEach((incentive: IDashboardCitizenIncentiveList) => {
    incentive.validatedSubscriptionPercentage = Math.round(
      (100 * incentive.totalSubscriptionsCount) / totalCitizensCount,
    );
  });

  return incentiveList;
};

/**
 * get valid date depending on the year and semester values
 */
export const setValidDate = (year: string, semester: string) => {
  const newValidDate: SearchQueryDate = {
    startDate: new Date(),
    endDate: new Date(),
  };

  /**
   * determine start and end Date for year
   */
  newValidDate.startDate = new Date(year);
  newValidDate.endDate = new Date(
    newValidDate.startDate.getFullYear() + 1,
    newValidDate.startDate.getMonth(),
    newValidDate.startDate.getDate(),
  );

  /**
   * determine start and end Date for semester additional filter
   * set the first semester
   */
  if (Number(semester) === 1) {
    newValidDate.endDate = new Date(
      newValidDate.startDate.getFullYear(),
      newValidDate.startDate.getMonth() + 6,
      newValidDate.startDate.getDate(),
    );
  }

  /**
   * set the second semester
   */
  if (Number(semester) === 2) {
    newValidDate.endDate = new Date(
      newValidDate.startDate.getFullYear() + 1,
      newValidDate.startDate.getMonth(),
      newValidDate.startDate.getDate(),
    );

    newValidDate.startDate = new Date(
      newValidDate.startDate.getFullYear(),
      newValidDate.startDate.getMonth() + 6,
      newValidDate.startDate.getDate(),
    );
  }

  return newValidDate;
};

/**
 * sort the demands list by the total subscriptions count
 * @returns sorted list
 */
export const isFirstElementGreater = (
  a: {totalSubscriptionsCount: number},
  b: {totalSubscriptionsCount: number},
) => {
  if (a.totalSubscriptionsCount > b.totalSubscriptionsCount) {
    return -1;
  }
  return 0;
};

/**
 * Returns list of emails
 */
export const getListEmails = (subscription: Subscription) => {
  const listEmails: string[] = [subscription.email];

  if (subscription.incentiveType === INCENTIVE_TYPE.EMPLOYER_INCENTIVE) {
    if (
      subscription.enterpriseEmail &&
      subscription.email !== subscription.enterpriseEmail
    ) {
      listEmails.push(subscription.enterpriseEmail);
    }
  }
  return {listEmails: listEmails};
};

/**
 * Returns the string with white spaces removed
 */
export const removeWhiteSpace = (word: string): string => {
  /**
   * Regex for removing white spaces.
   * Exemple : "  Removing   white spaces  " returns "Removing white spaces".
   */
  const removeSpacesRegex: RegExp = new RegExp('^\\s+|\\s+$|\\s+(?=\\s)', 'g');
  const newWord: string = word.replace(removeSpacesRegex, '');
  return newWord;
};

/**
 * Returns the three first letters from name with white spaces if necessary
 */
export const truncateName = (name: string) => {
  let prenom = name.toUpperCase().substring(0, 3); // Get the first three letters of the name

  // Complete with spaces until the name got 3 letters
  while (prenom.length < 3) {
    prenom += ' ';
  }
  return prenom;
};

/**
 * Checks if the phone Number is on the ITU-T E.164 format for France
 */
export const isE164ForFrance = (phoneNumber: string): Boolean => {
  const pattern = /^\+33[0-9]{6,10}$/;
  return pattern.test(phoneNumber);
};

/**
 * Check if phone number is already converted
 * IF NOT convert it to the ITU-T E.164 format for France
 * At the end, Check if the area code is starting with 0, if yes remove it
 * Then slice the 10 caracters
 */
export const convertPhoneNumber = (phoneNumber: string): string => {
  if (isE164ForFrance(phoneNumber)) {
    const formattedNumber = phoneNumber.replace(/^\+33(0)/, '+33');
    return formattedNumber.substring(0, 10);
  } else if (/^[0].{7,9}$/.test(phoneNumber)) {
    const formattedNumber = '+33' + phoneNumber.substring(1);
    return formattedNumber.substring(0, 10);
  } else {
    return phoneNumber;
  }
};
