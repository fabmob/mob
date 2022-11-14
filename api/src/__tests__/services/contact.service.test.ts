import {createStubInstance, expect, sinon} from '@loopback/testlab';
import {ContactService, MailService} from '../../services';
import {USERTYPE} from '../../utils';

describe('contact service', () => {
  let contactService: any = null;
  let mailService: any = null;

  beforeEach(() => {
    mailService = createStubInstance(MailService);
    contactService = new ContactService();
    contactService._to = 'to';
  });

  it('sendContactMail: successfull', async () => {
    contactService.sendMailClient(mailService, mockContact);
    mailService.stubs.sendMailAsHtml.resolves('success');
    expect(mailService.sendMailAsHtml.calledOnce).true();
    expect(
      mailService.sendMailAsHtml.calledWith(
        'test@test.com',
        'Nous traitons votre demande !',
        'client-contact',
        sinon.match.any,
      ),
    ).true();
  });
});

const mockContact = {
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'test@test.com',
  userType: USERTYPE.CITIZEN,
  postcode: '55555',
  message: 'Message test',
  tos: true,
};
