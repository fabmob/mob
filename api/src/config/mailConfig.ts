import nodemailer from 'nodemailer';
export class MailConfig {
  /**
   * Check env before sending the email.
   */
  configMailer() {
    let mailer, from;
    const mailHog = {
      host: process.env.MAILHOG_HOST,
      port: 1025,
    };
    const sendGrid = {
      host: process.env.SENDGRID_HOST,
      port: 587,
      auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_API_KEY,
      },
    };
    const fromLocal = 'Mon Compte Mobilité <mcm.mailhog@gmail.com>';

    // check is FQDN is set
    if (process.env.IDP_FQDN) {
      // check landscape
      if (process.env.LANDSCAPE === 'preview' || process.env.LANDSCAPE === 'testing') {
        mailer = nodemailer.createTransport(mailHog);
        from = process.env.MAILHOG_EMAIL_FROM;
      } else {
        mailer = nodemailer.createTransport(sendGrid);
        from = process.env.SENDGRID_EMAIL_FROM;
      }
    } else {
      mailer = nodemailer.createTransport({
        port: 1025,
      });
      from = fromLocal;
    }
    return {mailer, from};
  }
}
