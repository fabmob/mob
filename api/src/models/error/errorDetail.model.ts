import {Model, model, property} from '@loopback/repository';

@model()
export class ErrorDetail extends Model {
  @property({
    required: true,
    description: `Localisation de l'erreur`,
  })
  path: string;

  @property({
    required: true,
    description: `Code identifiant le type d'erreur`,
  })
  code: string;

  @property({
    required: true,
    description: `Message décrivant le détail de l'erreur`,
  })
  message: string;

  @property({
    type: 'object',
    required: true,
    description: `Objet contenant des informations supplémentaires concernant l'erreur`,
  })
  info: Object;

  constructor(data?: Partial<ErrorDetail>) {
    super(data);
  }
}
