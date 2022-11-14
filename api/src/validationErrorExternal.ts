import {HttpErrors} from '@loopback/rest';
import {ResourceName, StatusCode} from './utils';
import {ValidationError} from './validationError';
import Ajv from 'ajv';

interface Error {
  code?: string;
  entityName?: string;
  entityId?: string;
}

export const validationErrorExternalHandler = (error: Error): HttpErrors.HttpError => {
  const {code, entityName, entityId} = error;

  if (code === 'ENTITY_NOT_FOUND' && entityName && entityId) {
    throw new HttpErrors.NotFound(
      `The Id '${entityId}' does not exists in the entity '${entityName}'`,
    );
  }
  throw error;
};

export const validator = (data: object, validate: Ajv.ValidateFunction) => {
  if (!validate(data)) {
    throw new ValidationError(
      validate.errors![0].message!,
      validate.errors![0].dataPath.toString(),
      StatusCode.UnprocessableEntity,
      ResourceName.Subscription,
    );
  }
};
