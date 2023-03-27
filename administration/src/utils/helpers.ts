/* eslint-disable */
import AidesMessages from './Aide/fr.json';
import { TERRITORY_SCALE, TERRITORY_SCALE_INSEE_VALIDATION } from './constant';
import TerritoryMessages from './Territory/fr.json';

export const isEmailFormatValid = (email) => {
  const regex = new RegExp(
    /^@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
  return email.match(regex);
};

/**
 * Validation method for INSEE Code pattern
 * @param inseeValueList string[]
 * @returns string | undefined
 */
export const inseeCodePatternValidation = (inseeValueList: string[]): string | undefined => {
  const regex = new RegExp(
    /\d/
  );
  return inseeValueList?.find((inseeValue: string) => !inseeValue?.match(regex)) ? TerritoryMessages['territory.insee.error.format'] : undefined;
};

/**
 * Validation method for duplicated values
 * @param valueList string []
 * @returns string | undefined
 */
export const duplicatedValueValidation = (valueList: string[]): string | undefined => {
  if(!valueList) {
    return undefined;
  }
  const valueSet: Set<string> = new Set(valueList);
  return valueList?.length !== valueSet?.size ? TerritoryMessages['territory.insee.error.duplicated'] : undefined;
};

/**
 * Validation method between scale and INSEE Code 
 * @param scale TERRITORY_SCALE
 * @param inseeValueList string[]
 * @returns string | undefined
 */
export const scaleInseeCodeValidation = (scale: TERRITORY_SCALE, inseeValueList: string[]): string | undefined => {
  const scaleInsee: { minItems: number, maxItems: number | undefined, inseeValueLength: number[] } = TERRITORY_SCALE_INSEE_VALIDATION[scale];
  
  if (inseeValueList.length < scaleInsee.minItems || (scaleInsee.maxItems && inseeValueList.length > scaleInsee.maxItems)) {
    return TerritoryMessages['territory.scale.insee.error.minMaxItems'];
  }

  const inseeValueLengthList: number[] = inseeValueList.map((inseeValue: string) => { return inseeValue.length});

  if (inseeValueLengthList.filter((inseeValueLength: number) => !scaleInsee.inseeValueLength.includes(inseeValueLength)).length) {
    return TerritoryMessages['territory.scale.insee.error.inseeValueLength'];
  }
  return undefined;
};

/**
 * Validate territory edit and create forms
 * @param values { name: string, scale: TERRITORY_SCALE, inseeValueList: string[]}
 * @returns Record<string, unknown>
 */
export const validateTerritoryForm = (values: {name: string, scale: TERRITORY_SCALE, inseeValueList: string[]}) : Record<string, unknown> => {
  let errors: Record<string, unknown> = {};
  if (values.inseeValueList) {
    errors.inseeValueList = scaleInseeCodeValidation(values.scale, values.inseeValueList);
  }
  if ((values.scale !== TERRITORY_SCALE.NATIONAL) && !values.inseeValueList) {
    errors.scale = TerritoryMessages['territory.scale.insee.error.noValue']
  }
  return errors;
};


const duplicatedChecksErrors = (eligibilityChecks) => {
  const eligibilityChecksId = eligibilityChecks.map((item) => {
    if (item && item?.id !== undefined) return item?.id;
  });
  let errors = eligibilityChecksId.map((item, idx) => {
    const childErrors: Record<string, unknown> = {};
    if (item && eligibilityChecksId.indexOf(item) !== idx) {
      childErrors.id =
        AidesMessages['incentives.error.duplicated.eligibilityChecks'];
    }
    return childErrors;
  });
  return errors;
};

export const validateIncentiveForm = (values) => {
  const errors: Record<string, unknown> = {};
  if (values.eligibilityChecks && values.eligibilityChecks.length > 1) {
    errors.eligibilityChecks = duplicatedChecksErrors(values.eligibilityChecks);
  }
  return errors;
};

export const getFormData = (data) => {
  const newEligibilityChecks: EligibilityChecks = data.eligibilityChecks.map(
    (eligibilityCheck) => {
      if (!eligibilityCheck.value) {
        eligibilityCheck.value = [];
      }
      return eligibilityCheck;
    }
  );
  return { ...data, eligibilityChecks: newEligibilityChecks };
};

export interface IncentiveEligibilityChecks {
  id: string;
  name: string;
  label: string;
  description: string;
  type: string;
  motifRejet: string;
}

export interface Incentive {
  id: string;
  title: string;
  funderName: string;
  incentiveType: string;
  label?: string;
  name?: string;
}

export interface EligibilityChecks {
  id: string;
  active: boolean;
  value?: string[];
}

export interface Territory {
  scale: string;
  name: string;
  id: string;
}

