import nodemailer from 'nodemailer';

export class MailConfig {
  /**
   * Check env before sending the email.
   */
  configMailer() {
    let mailer, from;

    // TODO, what params are here ?
    const production = {
      host: process.env.EMAIL_HOST!,
      port: parseInt(process.env.EMAIL_PORT!),
    };

    // check landscape
    if (process.env.NODE_ENV === 'production') {
      mailer = nodemailer.createTransport(production);
      from = process.env.EMAIL_FROM;
    } else {
      mailer = nodemailer.createTransport({
        port: 1025,
      });
      from = 'Mon Compte Mobilité <mcm.mailhog@gmail.com>';;
    }

    return {mailer, from};
  }
}
