import {
  createStubInstance,
  expect,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';

import {EnterpriseRepository} from '../../repositories';
import {EnterpriseController} from '../../controllers';
import {KeycloakService} from '../../services';
import {ValidationError} from '../../validationError';
import {Enterprise} from '../../models';

describe('EnterpriseController (unit)', () => {
  let repository: StubbedInstanceWithSinonAccessor<EnterpriseRepository>,
    kcService: StubbedInstanceWithSinonAccessor<KeycloakService>,
    controller: EnterpriseController;
  const input = {
    id: 'randomInputId',
    firstName: 'testName',
    lastName: 'testLastName',
    email: 'test@outlook.com',
    emailFormat: ['@outlook.com', '@outlook.fr', '@outlook.xxx'],
    password: 'password12345@!',
    name: 'test',
    siretNumber: 50,
    employeesCount: 2345,
    budgetAmount: 102,
    isHris: false,
    getId: () => {},
    getIdObject: () => ({id: 'random'}),
    toJSON: () => ({id: 'random'}),
    toObject: () => ({id: 'random'}),
  };
  const inputBadEmailFormat = {
    ...input,
    emailFormat: ['err@outlook.com', 'err', '@err'],
  };

  beforeEach(() => {
    givenStubbedRepository();
    givenStubbedService();
    controller = new EnterpriseController(repository, kcService);
  });

  describe('EnterpriseController', () => {
    it('EnterpriseController failing case (createGroupKc) error', async () => {
      const errorKc = new ValidationError(`funders.error.topgroup`, '/funder');
      try {
        kcService.stubs.createGroupKc.rejects(errorKc);

        await controller.create(input);
      } catch (error) {
        expect(error.message).to.equal(errorKc.message);
      }
      kcService.stubs.createGroupKc.restore();
    });

    it('EnterpriseController create : fails because of createUserkc error', async () => {
      const errorKc = new ValidationError(`email.error.unique`, '/email');
      try {
        kcService.stubs.createGroupKc.resolves({id: 'randomId'});
        kcService.stubs.createUserKc.rejects(errorKc);
        kcService.stubs.deleteGroupKc.resolves();

        await controller.create(input);
      } catch (error) {
        expect(error.message).to.equal(errorKc.message);
      }

      kcService.stubs.createGroupKc.restore();
      kcService.stubs.createUserKc.restore();
      kcService.stubs.deleteGroupKc.restore();
    });
    it('EnterpriseController create : fails because of createEnterprise error', async () => {
      const errorRepository = 'can not add user to database';
      try {
        kcService.stubs.createGroupKc.resolves({id: 'randomId'});
        kcService.stubs.createUserKc.resolves({id: 'randomId'});
        repository.stubs.create.rejects(errorRepository);
        kcService.stubs.deleteGroupKc.resolves();
        kcService.stubs.deleteUserKc.resolves();

        await controller.create(input);
      } catch (err) {
        expect(err.name).to.equal(errorRepository);
      }

      kcService.stubs.createGroupKc.restore();
      kcService.stubs.createUserKc.restore();
      repository.stubs.create.restore();
      kcService.stubs.deleteGroupKc.restore();
      kcService.stubs.deleteUserKc.restore();
    });

    it('EnterpriseController create : successful', async () => {
      kcService.stubs.createGroupKc.resolves({id: 'randomId'});
      kcService.stubs.createUserKc.resolves({id: 'randomId'});
      repository.stubs.create.resolves(input);

      const result = await controller.create(input);
      expect(result).to.deepEqual(input);

      kcService.stubs.createGroupKc.restore();
      kcService.stubs.createUserKc.restore();
      repository.stubs.create.restore();
    });

    it('EnterpriseController count: Successful', async () => {
      const countRes = {
        count: 10,
      };

      repository.stubs.count.resolves(countRes);
      const result = await controller.count();

      expect(result).to.deepEqual(countRes);
    });

    it('EnterpriseController find: successful', async () => {
      repository.stubs.find.resolves([input]);
      const result = await controller.find();

      expect(result).to.deepEqual([input]);
    });

    it('EnterpriseController find emailFormatList: successful', async () => {
      repository.stubs.find.resolves([
        new Enterprise({id: 'id', name: 'name', emailFormat: ['@format.com']}),
      ]);
      const result = await controller.findEmailFormat();
      expect(result).to.deepEqual([
        new Enterprise({id: 'id', name: 'name', emailFormat: ['@format.com']}),
      ]);
    });
  });

  function givenStubbedRepository() {
    repository = createStubInstance(EnterpriseRepository);
  }

  function givenStubbedService() {
    kcService = createStubInstance(KeycloakService);
  }
});
