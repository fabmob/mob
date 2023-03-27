import {injectable, BindingScope} from '@loopback/core';
import {EligibilityCheck, Incentive} from '../models';
import {Logger} from '../utils';

@injectable({scope: BindingScope.TRANSIENT})
export class IncentiveService {
  /**
   * Convert specific fields into json schema
   * Specific Fields must not be empty else return empty object
   * Return object
   * @params title: string
   * @params specificFields: any[]
   */
  convertSpecificFields(title: string, specificFields: any[]): Object {
    const jsonSchema: any = {
      properties: {},
    };
    const requiredObj: string[] = [];
    if (specificFields.length > 0) {
      specificFields.forEach(
        (field: {
          inputFormat: string;
          title: string;
          isRequired: boolean;
          choiceList: {
            possibleChoicesNumber: number;
            inputChoiceList: [{inputChoice: string}];
          };
        }) => {
          const obj: any = {};
          if (field.inputFormat === 'Date') {
            obj[field.title] = field.isRequired
              ? {
                  type: 'string',
                  format: 'date',
                }
              : {
                  oneOf: [{type: 'string', format: 'date'}, {type: 'null'}],
                };
          } else if (field.inputFormat === 'Numerique') {
            obj[field.title] = {type: field.isRequired ? 'number' : ['number', 'null']};
          } else if (field.inputFormat === 'Texte') {
            obj[field.title] = {type: field.isRequired ? 'string' : ['string', 'null']};
            obj[field.title] = {...obj[field.title], minLength: 1};
          } else if (field.inputFormat === 'listeChoix') {
            obj[field.title] = {
              type: field.isRequired ? 'array' : ['array', 'null'],
              minItems: 1,
              maxItems: field.choiceList.possibleChoicesNumber,
              items: [{enum: []}],
            };
            field.choiceList.inputChoiceList.forEach(element => {
              obj[field.title].items[0].enum.push(element.inputChoice);
            });
          }
          if (obj[field.title]) {
            jsonSchema.properties[field.title] = obj[field.title];
            if (field.isRequired) {
              requiredObj.push(field.title);
            }
          }
        },
      );
      // jsonSchema["$schema"] = "http://json-schema.org/draft-07/schema#";
      // jsonSchema["$id"] = "http://yourdomain.com/schemas/myschema.json";
      jsonSchema['title'] = title;
      jsonSchema['type'] = 'object';
      jsonSchema['required'] = requiredObj;
      jsonSchema['additionalProperties'] = false;
      return jsonSchema;
    }
    return {};
  }

  /**
   * Add incentive to exclude Id to Exclusion Eligibility Check value field
   * Return updated eligibilityChecks
   * @params eligibilityChecks: EligibilityCheck[] | undefined
   * @params incentiveToExclude: Incentive
   * @params exclusionControlId: string
   * @params active: boolean
   */
  addIncentiveToExclusions(
    eligibilityChecks: EligibilityCheck[] | undefined,
    incentiveToExclude: Incentive,
    exclusionControlId: string,
    active: boolean,
  ): EligibilityCheck[] {
    Logger.debug(
      IncentiveService.name,
      this.addIncentiveToExclusions.name,
      'Eligibility checks data',
      eligibilityChecks,
    );
    Logger.debug(
      IncentiveService.name,
      this.addIncentiveToExclusions.name,
      'Incentive to exclude check data',
      incentiveToExclude,
    );
    Logger.debug(
      IncentiveService.name,
      this.addIncentiveToExclusions.name,
      'Exclusion control Id value',
      exclusionControlId,
    );
    if (!eligibilityChecks || eligibilityChecks.length === 0) {
      // Create eligibilityChecks field if don't exist
      eligibilityChecks = [
        new EligibilityCheck({
          id: exclusionControlId,
          value: [incentiveToExclude.id],
          active: active,
        }),
      ];
    } else if (
      !eligibilityChecks?.find(eligibilityCheck => {
        return eligibilityCheck.id === exclusionControlId;
      })
    ) {
      // Create exclusion control if don't exist and add current incentive in exclusion list
      eligibilityChecks?.push(
        new EligibilityCheck({
          id: exclusionControlId,
          value: [incentiveToExclude.id],
          active: active,
        }),
      );
    } else {
      // Add current incentive in exclusion list if exclusion list already exists
      eligibilityChecks = eligibilityChecks?.map(checkExclude => {
        if (checkExclude.id === exclusionControlId) {
          checkExclude.value.push(incentiveToExclude.id);
          checkExclude.active = active;
        }
        return checkExclude;
      });
    }
    return eligibilityChecks;
  }

  /**
   * Remove incentive to exclude Id from Exclusion Eligibility Check value field
   * Return updated incentive
   * @params incentiveToUpdate: Incentive
   * @params incentiveToExclude: Incentive
   * @params exclusionControlId: string
   */
  removeIncentiveFromExclusions(
    incentiveToUpdate: Incentive,
    incentiveToExclude: Incentive,
    exclusionControlId: string,
  ): Incentive {
    Logger.debug(
      IncentiveService.name,
      this.removeIncentiveFromExclusions.name,
      'Incentive ToUpdate data',
      incentiveToUpdate,
    );
    Logger.debug(
      IncentiveService.name,
      this.removeIncentiveFromExclusions.name,
      'Incentive to exclude check data',
      incentiveToExclude,
    );
    Logger.debug(
      IncentiveService.name,
      this.removeIncentiveFromExclusions.name,
      'Exclusion control Id value',
      exclusionControlId,
    );
    const exclusionCheck: EligibilityCheck | undefined = incentiveToUpdate.eligibilityChecks?.find(check => {
      return check.id === exclusionControlId;
    });

    if (exclusionCheck!.value.length > 1) {
      // Delete current incentive from exclusion list if at least 2 items in list
      incentiveToUpdate.eligibilityChecks = incentiveToUpdate.eligibilityChecks?.map(eligibilityCheck => {
        if (eligibilityCheck.id === exclusionCheck!.id) {
          eligibilityCheck.value = eligibilityCheck.value.filter((incentiveToDeleteId: string) => {
            return incentiveToDeleteId !== incentiveToExclude.id;
          });
        }
        return eligibilityCheck;
      });
    } else {
      if (incentiveToUpdate.eligibilityChecks && incentiveToUpdate.eligibilityChecks.length > 1) {
        // Delete exclusion control if only 1 item in list but other controls present
        incentiveToUpdate.eligibilityChecks = incentiveToUpdate.eligibilityChecks?.filter(
          eligibilityCheck => {
            return eligibilityCheck.id !== exclusionCheck?.id;
          },
        );
      } else {
        // Delete eligibilityChecks field if 1 item in exclusion and no other control
        delete incentiveToUpdate.eligibilityChecks;
      }
    }

    return incentiveToUpdate;
  }

  /**
   * Get Incentive Ids added to current Id list
   * Return list of added incentiveIds
   * @params currentList: string[]
   * @params updatedList: string[]
   */
  getIncentiveIdsToAdd(currentList: string[], updatedList: string[]): string[] {
    const incentiveIdsToAdd: string[] = updatedList.filter(
      (incentiveId: string) => !currentList.includes(incentiveId),
    );
    return incentiveIdsToAdd;
  }

  /**
   * Get Incentive Ids removed from current Id list
   * Return list of removed incentiveIds
   * @params currentList: string[]
   * @params updatedList: string[]
   */
  getIncentiveIdsToDelete(currentList: string[], updatedList: string[]): string[] {
    const incentiveIdsToRemove: string[] = currentList.filter(
      (incentiveId: string) => !updatedList.includes(incentiveId),
    );
    return incentiveIdsToRemove;
  }
}
