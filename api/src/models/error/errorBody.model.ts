import {Model, model, property} from '@loopback/repository';
import {ErrorDetail} from './errorDetail.model';

@model()
export class ErrorBody extends Model {
  @property({
    required: true,
    description: `Code HTTP`,
  })
  statusCode: number;

  @property({
    required: true,
    description: `Message décrivant l'erreur`,
  })
  message: string;

  @property({
    required: true,
    description: `Nom de l'erreur`,
  })
  name: string;

  @property({
    description: `Code identifiant le type d'erreur`,
  })
  code?: string;

  @property({
    description: `Localisation de l'erreur`,
  })
  path?: string;

  @property.array(ErrorDetail)
  details?: ErrorDetail[];

  constructor(data?: Partial<ErrorBody>) {
    super(data);
  }
}
