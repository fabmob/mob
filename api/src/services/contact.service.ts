import {injectable, BindingScope} from '@loopback/core';
import {Contact} from '../models';
import {MailService} from '../services';
import {capitalize} from 'lodash';

const EMAIL_TO = process.env.SENDGRID_EMAIL_CONTACT;

const LIB_KEYS_LABELS_ORDERER = {
  userType: 'Vous êtes',
  lastName: 'Nom',
  firstName: 'Prénom',
  email: 'Email',
  postcode: 'Code Postal',
  message: 'Message',
  tos: 'CGU',
};

@injectable({scope: BindingScope.TRANSIENT})
export class ContactService {
  public _to: string | undefined;
  /**
   * Envoie le mail de la demande de contact.
   *
   * @param mailService
   * @param contact
   * @param contactDate
   */

  async sendMailClient(mailService: MailService, contact: Contact, contactDate: string): Promise<any> {
    const to = this._to ? this._to : EMAIL_TO;

    await mailService.sendMailAsHtml(contact.email!, 'Nous traitons votre demande !', 'client-contact', {
      username: capitalize(contact.firstName),
      contactDate: contactDate,
    });

    if (to) {
      await mailService.sendMailAsHtml(to, 'Soumission de formulaire MOB', 'contact', {
        contact: contact,
        keys: LIB_KEYS_LABELS_ORDERER,
      });
    }
  }
}
