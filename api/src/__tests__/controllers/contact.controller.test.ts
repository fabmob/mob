import {
  createStubInstance,
  expect,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import {ContactController} from '../../controllers/contact.controller';
import {ContactService, MailService} from '../../services';

import {Contact} from '../../models';
import {USERTYPE} from '../../utils';

describe('Contact Controller ', () => {
  let contactService: StubbedInstanceWithSinonAccessor<ContactService>,
    controller: ContactController,
    mailService: StubbedInstanceWithSinonAccessor<MailService>;
  beforeEach(() => {
    givenStubbedService();
    controller = new ContactController(contactService, mailService);
  });

  it('post(v1/contact)', async () => {
    contactService.stubs.sendMailClient.resolves(mockContact);
    const result = await controller.create(mockContact);

    expect(result).to.deepEqual(mockContact);
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
