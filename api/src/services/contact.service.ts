import {injectable, BindingScope} from '@loopback/core';
import {MailService} from '../services';

const LIB_KEYS_LABELS_ORDERER = {
  userType: 'Vous êtes',
  lastName: 'Nom',
  firstName: 'Prénom',
  email: 'Email',
  postcode: 'Code Postal',
  message: 'Message',
  tos: 'CGU',
};

const EMAIL_TO = process.env.SENDGRID_EMAIL_CONTACT;

@injectable({scope: BindingScope.TRANSIENT})
export class ContactService {
  public _to: string | undefined;

  /**
   * Envoie le mail de la demande de contact.
   *
   * @param contact
   */
  async sendMail(mailService: MailService, contact: any): Promise<any> {
    const to = this._to ? this._to : EMAIL_TO;
    if (to) {
      await mailService.sendMailAsHtml(to, 'Soumission de formulaire MOB', 'contact', {
        contact: contact,
        keys: LIB_KEYS_LABELS_ORDERER,
      });
    }
  }
}
