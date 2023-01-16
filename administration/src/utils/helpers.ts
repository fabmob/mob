/* eslint-disable */
import AidesMessages from './Aide/fr.json';

export const isEmailFormatValid = (email) => {
  const regex = new RegExp(
    /^@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
  return email.match(regex);
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
