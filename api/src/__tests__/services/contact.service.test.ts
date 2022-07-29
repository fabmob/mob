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

  it('should use mail service', () => {
    contactService.sendMail(mailService, mockBody);
    expect(mailService.sendMailAsHtml.calledOnce).true();
    expect(
      mailService.sendMailAsHtml.calledWith(
        'to',
        'Soumission de formulaire MOB',
        sinon.match.any,
      ),
    ).true();
  });
});

const mockBody = {
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'test@test.com',
  userType: USERTYPE.CITIZEN,
  postcode: '55555',
  message: 'Message test',
  tos: true,
};
