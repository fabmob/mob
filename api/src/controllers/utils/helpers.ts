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
 * Returns list of emails and funderType based on incentive type
 */
export const getFunderTypeAndListEmails = (subscription: Subscription) => {
  const listEmails: string[] = [subscription.email];

  let funderType: FUNDER_TYPE;

  if (subscription.incentiveType === INCENTIVE_TYPE.EMPLOYER_INCENTIVE) {
    funderType = FUNDER_TYPE.enterprise;
    if (subscription.enterpriseEmail) {
      listEmails.push(subscription.enterpriseEmail);
    }
  } else if (subscription.incentiveType === INCENTIVE_TYPE.TERRITORY_INCENTIVE) {
    funderType = FUNDER_TYPE.collectivity;
  }
  return {listEmails: listEmails, funderType: funderType!};
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
