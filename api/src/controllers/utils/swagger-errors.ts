import {getModelSchemaRef, ResponsesObject} from '@loopback/openapi-v3';
import {Error} from '../../models';
import {StatusCode} from '../../utils';

export const defaultSwaggerError: ResponsesObject = {
  [StatusCode.BadRequest]: {
    description: 'La requête est incorrecte et ne peut être traitée',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Error),
        example: {
          error: {
            statusCode: StatusCode.BadRequest,
            name: 'Error',
            message: '',
            path: '',
            resourceName: '',
          },
        },
      },
    },
  },
  [StatusCode.Unauthorized]: {
    description: "L'authentification est manquante ou invalide",
    content: {
      'application/json': {
        schema: getModelSchemaRef(Error),
        example: {
          error: {
            statusCode: StatusCode.Unauthorized,
            name: 'Error',
            message: 'Authorization header not found or invalid',
            path: '/authorization',
          },
        },
      },
    },
  },
  [StatusCode.Forbidden]: {
    description: 'Accès refusé. Les droits associés sont insuffisants',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Error),
        example: {
          error: {
            statusCode: StatusCode.Forbidden,
            name: 'Error',
            message: 'Access denied',
            path: '/authorization',
          },
        },
      },
    },
  },
  [StatusCode.NotFound]: {
    description: 'La ressource est introuvable',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Error),
        example: {
          error: {
            statusCode: StatusCode.NotFound,
            name: 'Error',
            message: 'Resource not found',
            path: '',
            resourceName: '',
          },
        },
      },
    },
  },
  [StatusCode.Conflict]: {
    description: "Un conflit existe entre la requête et l'état de la ressource",
    content: {
      'application/json': {
        schema: getModelSchemaRef(Error),
        example: {
          error: {
            statusCode: StatusCode.Conflict,
            name: 'Error',
            message: '',
            path: '',
            resourceName: '',
          },
        },
      },
    },
  },
  [StatusCode.UnprocessableEntity]: {
    description:
      'La requête est correcte mais le traitement sur la ressource rencontre des erreurs sémantiques',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Error),
        example: {
          error: {
            statusCode: StatusCode.UnprocessableEntity,
            name: 'Error',
            message: '',
            path: '',
            resourceName: '',
          },
        },
      },
    },
  },
  [StatusCode.InternalServerError]: {
    description: 'Une erreur interne est survenue',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Error),
        example: {
          error: {
            statusCode: StatusCode.InternalServerError,
            name: 'Error',
            message: 'Error',
          },
        },
      },
    },
  },
};
