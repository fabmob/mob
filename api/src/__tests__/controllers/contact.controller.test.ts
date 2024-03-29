import {createStubInstance, expect, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';
import {ContactController} from '../../controllers/contact.controller';
import {ContactService, MailService} from '../../services';

import {Contact} from '../../models';
import {StatusCode, USERTYPE} from '../../utils';

describe('Contact Controller ', () => {
  let contactService: StubbedInstanceWithSinonAccessor<ContactService>,
    controller: ContactController,
    mailService: StubbedInstanceWithSinonAccessor<MailService>;
  beforeEach(() => {
    givenStubbedService();
    controller = new ContactController(contactService, mailService);
  });

  it('post(v1/contact) ERROR', async () => {
    contactService.stubs.sendMailClient.rejects(new Error('Error'));
    try {
      await controller.create(mockContact);
    } catch (err) {
      expect(err.message).to.equal('Error');
    }
  });

  it('post(v1/contact) success', async () => {
    contactService.stubs.sendMailClient.resolves(mockContact);
    const result = await controller.create(mockContact);

    expect(result).to.deepEqual(mockContact);
  });

  it('post(v1/contact) tos ERROR', async () => {
    try {
      mockContact.tos = false;
      await controller.create(mockContact);
    } catch (err) {
      expect(err.message).to.equal('User must agree to terms of services');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  function givenStubbedService() {
    contactService = createStubInstance(ContactService);
  }
});

const mockContact = new Contact({
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'test@test.com',
  userType: USERTYPE.CITIZEN,
  postcode: '55555',
  message: 'Message test',
  tos: true,
});
