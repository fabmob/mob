import {inject} from '@loopback/core';
import {getModelSchemaRef, post, requestBody} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';

import {Contact} from '../models';
import {ContactService, MailService} from '../services';
import {formatDateInTimezone} from '../utils/date';
import {AUTH_STRATEGY, Logger, ResourceName, Roles, SECURITY_SPEC_API_KEY, StatusCode} from '../utils';
import {UnprocessableEntityError} from '../validationError';
import {defaultSwaggerError} from './utils/swagger-errors';

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
  @authenticate(AUTH_STRATEGY.API_KEY, AUTH_STRATEGY.KEYCLOAK)
  @authorize({allowedRoles: [Roles.API_KEY, Roles.PLATFORM]})
  @post('v1/contact', {
    'x-controller-name': 'Contact',
    summary: "Envoi d'un formulaire de contact",
    security: SECURITY_SPEC_API_KEY,
    responses: {
      [StatusCode.NoContent]: {
        description: 'Formulaire de contact',
      },
      ...defaultSwaggerError,
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
  ): Promise<void> {
    if (!contact.tos) {
      throw new UnprocessableEntityError(
        ContactService.name,
        this.create.name,
        `User must agree to terms of services`,
        '/tos',
        ResourceName.Contact,
        !contact.tos,
        true,
      );
    }
    try {
      const contactDate = formatDateInTimezone(new Date(), 'dd/MM/yyyy');
      Logger.debug(ContactController.name, this.create.name, 'contact date', contactDate);
      return await this.contactService.sendMailClient(this.mailService, contact, contactDate);
    } catch (error) {
      Logger.error(ContactController.name, this.create.name, 'Error', error);
      throw error;
    }
  }
}
