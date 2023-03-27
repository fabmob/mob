import {Fields, Filter, OrClause} from '@loopback/repository';
import {omit, has} from 'lodash';

import {Citizen, UserAttribute} from '../models';
import {DgfipInformation} from '../models/citizen/dgfipInformation.model';
import {Identity} from '../models/citizen/identity.model';
import {PersonalInformation} from '../models/citizen/personalInformation.model';

/**
 * Check if all provided fields are false
 * If yes, add the other properties that remain on the model
 * @param fields Fields to check. @example {"identity": false, "affiliation": false}
 * @returns Adjusted fields. @example {"identity": false, "affiliation": false, "status": true}
 */
export const preCheckFields = (fields: Fields<Citizen> = {}): Fields<Citizen> => {
  const allFalse: boolean = Object.values(fields).every(value => value === false);
  if (allFalse) {
    const citizenProperties: string[] = Object.keys(Citizen.definition.properties);
    const newFields: Record<string, boolean> = {};
    for (const property of citizenProperties) {
      if (!has(fields, property)) {
        newFields[property] = true;
      }
    }
    return {...fields, ...newFields};
  }

  return fields;
};

/**
 * Control access to identity, personalInformation and dgfipInformation
 * @param scopes citizen scopes. @example ["profile", "openid"]
 * @param fields Fields to check. @example {"identity": true, "personalInformation": true}
 * @returns Adjusted fields. @example {"identity": true, "personalInfomation": false}
 */
export const parseScopes = (scopes: string[], fields: Record<string, boolean> = {}): Fields<Citizen> => {
  if (!scopes.some(scope => IDENTITY_SCOPES.includes(scope))) {
    fields.identity = false;
  }
  if (!scopes.some(scope => PERSONAL_INFORMATION_SCOPES.includes(scope))) {
    fields.personalInformation = false;
  }
  if (!scopes.some(scope => DGFIP_INFORMATION_SCOPES.includes(scope))) {
    fields.dgfipInformation = false;
  }

  return fields;
};

/**
 * Compose a "where" condition based on the filter provided..
 * @param fields: provided fields. @example : {"identity": true, "personalInformation": false}
 * @returns a filter supported by the model userAttribute.
 * @example
 * ```ts
 * {
 * "where": {
 *   "or": [
 *     {
 *       "name": {
 *         "inq": [
 *           "identity.lastName",
 *           "identity.firstName",
 *           "identity.gender"
 *         ]
 *       }
 *     }
 *    ]
 *  }
 * }
 * ```
 */
export const composeWhere = (fields: Fields<Citizen> = {}): Filter<UserAttribute> => {
  // Initialization of the OR filter variable
  const where: OrClause<UserAttribute> = {or: []};

  // Omit fields that require special treatment
  const commonFields: Partial<Fields<Citizen>> = omit(fields, [
    'identity', // nested property
    'personalInformation', // nested property
    'dgfipInformation', // nested property
    'affiliation', // Collection exists on mongoDB
    'id', // Not in user Attributes
  ]);

  // Get the true fields from commonFields
  const trueFieldsArray: string[] = Object.entries(commonFields)
    .filter(([_, value]) => value === true)
    .map(([key, _]) => key);

  // Add the true fields to or clause
  // Example : ["city": true, "postcode": true]
  if (trueFieldsArray.length) {
    where.or.push({name: {inq: trueFieldsArray}});
  }

  // Check if fields contains "identity"
  if (fields['identity' as keyof Fields<Citizen>]) {
    const identityProperties = Object.keys(Identity.definition.properties).map(
      property => `identity.${property}`,
    );
    where.or.push({name: {inq: identityProperties}});
  }

  // Check if fields contains "personalInformation"
  if (fields['personalInformation' as keyof Fields<Citizen>]) {
    const personalInformationProperties = Object.keys(PersonalInformation.definition.properties).map(
      property => `personalInformation.${property}`,
    );
    where.or.push({name: {inq: personalInformationProperties}});
  }

  // Check if fields contains "dgfipInformation"
  if (fields['dgfipInformation' as keyof Fields<Citizen>]) {
    const dgfipInformationProperties = Object.keys(DgfipInformation.definition.properties).map(
      property => `dgfipInformation.${property}`,
    );
    where.or.push({name: {inq: dgfipInformationProperties}});
  }

  if (!where.or.length) {
    return {};
  }

  return {where};
};

export const IDENTITY_SCOPES = ['profile', 'urn:cms:identity:read'];
export const PERSONAL_INFORMATION_SCOPES = ['email', 'address', 'urn:cms:personal-information:read', 'phone'];
export const DGFIP_INFORMATION_SCOPES = ['urn:cms:fr-dgfip-information:read'];
