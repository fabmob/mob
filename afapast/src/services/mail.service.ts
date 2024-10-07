import {injectable, BindingScope} from '@loopback/core';
import {MailConfig} from '../config/mailConfig';
import ejs from 'ejs';

export const generateTemplateAsHtml = async (
    templateName: string,
    data?: Object | undefined,
  ): Promise<string> => {
    return await ejs.renderFile(
    `./templates/${templateName}.ejs`,
    data ?? {},
    );
  };

@injectable({scope: BindingScope.TRANSIENT})
export class MailService {
  private mailConfig: MailConfig;

  constructor() {
    this.mailConfig = new MailConfig();
  }

  /**
   * Sending mail with html content
   *
   * @param to 
   * @param subject 
   * @param templateName ejs template to be used
   * @param data dict with params used in template
   */
  async sendMailAsHtml(to: string, subject: string, templateName: string, data?: Object): Promise<any> {
    const html = await generateTemplateAsHtml(templateName, data);
    const mailerInfos = this.mailConfig.configMailer();
    await mailerInfos.mailer.sendMail({
        from: mailerInfos.from,
        to: to,
        subject: subject,
        html: html,
    });
  }
}
