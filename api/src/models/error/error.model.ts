import {Model, model, property} from '@loopback/repository';
import {ErrorBody} from './errorBody.model';

@model()
export class Error extends Model {
  @property({
    required: true,
    description: `Enveloppe contenant les détails de l'erreur`,
  })
  error: ErrorBody;

  constructor(data?: Partial<Error>) {
    super(data);
  }
}

export interface ErrorRelations {
  // describe navigational properties here
}

export type ErrorWithRelations = Error & ErrorRelations;
