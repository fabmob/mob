import {injectable, BindingScope} from '@loopback/core';
import {MailConfig} from '../config';
import {generateTemplateAsHtml, ResourceName, StatusCode} from '../utils';
import {ValidationError} from '../validationError';

@injectable({scope: BindingScope.TRANSIENT})
export class MailService {
  private mailConfig: MailConfig;

  /**
   * Constructeur.
   * Utilisation de l'API_KEY sendgrid
   */
  constructor() {
    this.mailConfig = new MailConfig();
  }

  /**
   * Envoi d'un mail dont le corps est en html.
   *
   * @param to destinataire du mail
   * @param subject sujet du mail
   * @param templateName nom du template de l'email
   * @param data variable data in email
   */
  async sendMailAsHtml(
    to: string,
    subject: string,
    templateName: string,
    data?: Object,
  ): Promise<any> {
    try {
      const html = await generateTemplateAsHtml(templateName, data);
      const mailerInfos = this.mailConfig.configMailer();
      await mailerInfos.mailer.sendMail({
        from: mailerInfos.from,
        to: to,
        subject: subject,
        html: html,
      });
    } catch (err) {
      throw new ValidationError(
        `email.server.error`,
        '/emailSend',
        StatusCode.InternalServerError,
        ResourceName.Email,
      );
    }
  }
}
