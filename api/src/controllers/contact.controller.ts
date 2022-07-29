import {inject} from '@loopback/core';
import {getModelSchemaRef, post, requestBody} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';

import {Contact} from '../models';
import {ContactService, MailService} from '../services';
import {
  AUTH_STRATEGY,
  ResourceName,
  Roles,
  SECURITY_SPEC_API_KEY,
  StatusCode,
} from '../utils';
import {ValidationError} from '../validationError';

export class ContactController {
  constructor(
    @inject('services.ContactService')
    public contactService: ContactService,
    @inject('services.MailService')
    public mailService: MailService,
  ) {}

  /**
   * Send contact form
   * @param contact object from contact form
   */
  @authenticate(AUTH_STRATEGY.API_KEY)
  @authorize({allowedRoles: [Roles.API_KEY]})
  @post('v1/contact', {
    'x-controller-name': 'Contact',
    summary: "Envoi d'un formulaire de contact",
    security: SECURITY_SPEC_API_KEY,
    responses: {
      [StatusCode.Success]: {
        description: 'Formulaire de contact',
        content: {'application/json': {schema: getModelSchemaRef(Contact)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Contact),
        },
      },
    })
    contact: Contact,
  ): Promise<any> {
    if (!contact.tos) {
      throw new ValidationError(
        `User must agree to terms of services`,
        '/tos',
        StatusCode.UnprocessableEntity,
        ResourceName.Contact,
      );
    }
    try {
      return await this.contactService.sendMail(this.mailService, contact);
    } catch (error) {
      return error;
    }
  }
}
