import {AnyObject, Fields, Where, WhereBuilder} from '@loopback/repository';
import {Citizen, Incentive} from '../models';
import {AFFILIATION_STATUS, INCENTIVE_TYPE} from './enum';

const DEFAULT_ORDER_FILTER: {[key: string]: number} = {funderName: 1};

/**
 * Convert string or array of string order filter to an object
 * If no order filter is provided, {funderName: 1} is the default order
 * WARNING: This function in meant for aggregation
 * That's why we are converting lb4 order operators to mongodb order operators
 * which is usually made by lb4 function repository
 * @param order order: string | string[] | undefined
 * @returns { [key: string]: number } | DEFAULT_ORDER_FILTER
 */
export const convertOrderFilter = (order: string | string[] | undefined): {[key: string]: number} => {
  if (Array.isArray(order)) {
    return order
      .map((order: string) => {
        const splittedOrder: string[] = order.split(' ');
        return {[splittedOrder[0]]: splittedOrder[1] === 'ASC' ? 1 : -1};
      })
      .reduce((previousValue: {[key: string]: number}, currentValue: {[key: string]: number}) => {
        return {...previousValue, ...currentValue};
      }, {});
  }
  if (typeof order === 'string') {
    const splittedOrder: string[] = order.split(' ');
    return {[splittedOrder[0]]: splittedOrder[1] === 'ASC' ? 1 : -1};
  }
  return DEFAULT_ORDER_FILTER;
};

/**
 * Handle where filter to add incentive type mandatory match based on citizen
 * WARNING: This function in meant for aggregation
 * That's why we are converting lb4 where operators to mongodb where operators
 * which is usually made by lb4 function repository
 * This function does not handle/convert all lb4 where operators
 * @param textSearch string | undefined
 * @param where Where<Incentive> | undefined
 * @param citizen Citizen | undefined
 * @returns AnyObject | undefined
 */
export const handleWhereFilter = (
  textSearch: string | undefined,
  where: Where<Incentive> | undefined,
  citizen: Citizen | undefined,
): AnyObject | undefined => {
  const builder: WhereBuilder<Incentive> = new WhereBuilder<Incentive>();

  if (textSearch) {
    builder.impose({$text: {$search: textSearch, $language: 'fr'}} as any);
  }

  if (where) {
    builder.impose(where);
  }

  if (!where || (where && !('incentiveType' in where))) {
    if (citizen && citizen.affiliation?.status === AFFILIATION_STATUS.AFFILIATED) {
      builder.impose({
        $or: [
          {
            incentiveType: {
              $in: [INCENTIVE_TYPE.NATIONAL_INCENTIVE, INCENTIVE_TYPE.TERRITORY_INCENTIVE],
            },
          },
          {
            incentiveType: INCENTIVE_TYPE.EMPLOYER_INCENTIVE,
            funderId: citizen.affiliation.enterpriseId!,
          },
        ],
      } as any);
    } else {
      builder.impose({incentiveType: {$ne: INCENTIVE_TYPE.EMPLOYER_INCENTIVE} as any});
    }
  }

  const buildedWhere: AnyObject = builder.build();

  if ('transportList' in buildedWhere && 'inq' in buildedWhere['transportList']) {
    buildedWhere['transportList']['$in'] = buildedWhere['transportList']['inq'];
    delete buildedWhere['transportList']['inq'];
  }

  if ('territoryIds' in buildedWhere && 'inq' in buildedWhere['territoryIds']) {
    delete buildedWhere['territoryIds'];
  }

  if ('and' in buildedWhere) {
    buildedWhere['$and'] = buildedWhere.and;
    delete buildedWhere.and;
  }
  if ('or' in buildedWhere) {
    buildedWhere['$or'] = buildedWhere.or;
    delete buildedWhere.or;
  }

  return buildedWhere;
};

// List of inaccessible fields
export const MAAS_PURGED_FIELDS: Fields<Incentive> = {
  eligibilityChecks: false,
  isCertifiedTimestampRequired: false,
  subscriptionCheckMode: false,
};
