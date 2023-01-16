import {
  convertPhoneNumber,
  removeWhiteSpace,
  truncateName,
} from '../controllers/utils/helpers';
import {convertToISODate} from './date';
import {OperatorData} from './interface';

/**
 * Convert specific fields to the format requested by RPC
 * @param specificFields: Specific fields to transform
 * @param lastname: Lastname to truncate
 */
const convertSpecificFields = (
  specificFields: {[key: string]: any} | undefined,
  lastname: string,
  application_timestamp: string,
): OperatorData => {
  const lowerCaseKeys: {[key: string]: any} = {};
  for (const key in specificFields) {
    const newKey = removeWhiteSpace(key.toLowerCase());
    lowerCaseKeys[newKey] = specificFields[key];
  }

  let operatorData = <OperatorData>{
    last_name_trunc: truncateName(lastname),
    driving_license: lowerCaseKeys['numéro de permis de conduire'],
  };

  const journeyType = lowerCaseKeys['type de trajet']?.[0]?.toLowerCase();
  if (journeyType === 'long') {
    operatorData = {
      ...operatorData,
      journey_type: 'long',
      phone_trunc: convertPhoneNumber(lowerCaseKeys['numéro de téléphone']),
      datetime: convertToISODate(lowerCaseKeys['date de partage des frais'])!,
      application_timestamp,
    };
  } else if (journeyType === 'court') {
    operatorData = {
      ...operatorData,
      journey_type: 'short',
      operator_journey_id: lowerCaseKeys['identifiant du trajet'],
      application_timestamp,
    };
  }

  return operatorData;
};

export {convertSpecificFields};
