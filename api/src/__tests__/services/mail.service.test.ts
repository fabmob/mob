import {expect, sinon} from '@loopback/testlab';
import {MailService} from '../../services';
import ejs from 'ejs';
import nodemailer from 'nodemailer';
import {MailConfig} from '../../config';
import {StatusCode} from '../../utils';

describe('mail service', () => {
  let mailService: any = null;
  let mailConfig: any = null;

  beforeEach(() => {
    mailService = new MailService();
    mailConfig = new MailConfig();
  });

  const transport: any = {
    sendMail: () => {
      const err = new Error('No recipients defined');
      return Promise.reject(err);
    },
  };

  it('sendMailAsHtml should return error', async () => {
    const ejsStub = sinon.stub(ejs, 'renderFile').resolves('mymailtemplate');
    const nodemailerStub = sinon.stub(nodemailer, 'createTransport').returns(transport);
    const mailer = {
      mailer: nodemailerStub,
      from: 'test@gmal.com',
    };
    const mailerInfos = sinon.stub(mailConfig, 'configMailer').returns(mailer);

    try {
      await mailService.sendMailAsHtml('', '', '', '');
    } catch (error) {
      expect(error.message).to.equal('Error');
      expect(error.statusCode).to.equal(StatusCode.InternalServerError);
    }
    ejsStub.restore();
    mailerInfos.restore();
  });
});
