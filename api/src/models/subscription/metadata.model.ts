import {model, property, Entity} from '@loopback/repository';
import {AttachmentMetadata} from '.';

@model()
export class Metadata extends Entity {
  @property({
    id: true,
    description: `Identifiant des metadonnées`,
    generated: false,
    defaultFn: 'uuidv4',
    jsonSchema: {
      example: ``,
    },
  })
  id: string;

  @property({
    required: true,
    description: `Identifiant de l'aide pour laquelle on souhaite ajouter des métadonnées`,
    jsonSchema: {
      example: ``,
    },
  })
  incentiveId: string;

  @property({
    description: `Identifiant du citoyen souhaitant ajouter des métadonnées`,
    jsonSchema: {
      example: ``,
    },
  })
  citizenId: string;

  @property({
    required: true,
    description: `Metadonnées ou preuves d'achat fournies \
      sous format JSON devant respecter le contrat d'interface`,
  })
  attachmentMetadata: AttachmentMetadata;

  @property({
    type: 'date',
    hidden: true,
    description: `Date de création des métadonnées`,
    defaultFn: 'now',
    jsonSchema: {
      example: `2022-01-01 00:00:00.000Z`,
    },
  })
  createdAt: Date;

  constructor(data?: Partial<Metadata>) {
    super(data);
  }
}

export interface MetadataRelations {}

export type MetadataWithRelations = Metadata & MetadataRelations;
