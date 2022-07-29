import {
  createStubInstance,
  expect,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';

import {CollectivityRepository} from '../../repositories';
import {CollectivityController} from '../../controllers';
import {KeycloakService} from '../../services';
import {ValidationError} from '../../validationError';

describe('CollectivityController (unit)', () => {
  let repository: StubbedInstanceWithSinonAccessor<CollectivityRepository>,
    kcService: StubbedInstanceWithSinonAccessor<KeycloakService>,
    controller: CollectivityController;
  const input = {
    id: 'randomInputId',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
    password: 'password123123!',
    name: 'name',
    citizensCount: 10,
    mobilityBudget: 12,
    getId: () => {},
    getIdObject: () => ({id: 'random'}),
    toJSON: () => ({id: 'random'}),
    toObject: () => ({id: 'random'}),
  };

  beforeEach(() => {
    givenStubbedRepository();
    givenStubbedService();
    controller = new CollectivityController(repository, kcService);
  });

  describe('CollectivityController', () => {
    it('CollectivityController create : fails because of creategroupkc error', async () => {
      const errorKc = new ValidationError(`funders.error.topgroup`, '/funder');
      try {
        kcService.stubs.createGroupKc.rejects(errorKc);

        await controller.create(input);
      } catch (err) {
        expect(err.message).to.equal(errorKc.message);
      }

      kcService.stubs.createGroupKc.restore();
    });

    it('CollectivityController create : fails because of createUserkc error', async () => {
      const errorKc = new ValidationError(`email.error.unique`, '/email');
      try {
        kcService.stubs.createGroupKc.resolves({id: 'randomId'});
        kcService.stubs.createUserKc.rejects(errorKc);
        kcService.stubs.deleteGroupKc.resolves();

        await controller.create(input);
      } catch (err) {
        expect(err.message).to.equal(errorKc.message);
      }

      kcService.stubs.createGroupKc.restore();
      kcService.stubs.createUserKc.restore();
      kcService.stubs.deleteGroupKc.restore();
    });

    it('CollectivityController create : fails because of creategCollectivity error', async () => {
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

    it('CollectivityController create : successful', async () => {
      kcService.stubs.createGroupKc.resolves({id: 'randomId'});
      kcService.stubs.createUserKc.resolves({id: 'randomId'});
      repository.stubs.create.resolves(input);

      const result = await controller.create(input);
      expect(result).to.deepEqual(input);

      kcService.stubs.createGroupKc.restore();
      kcService.stubs.createUserKc.restore();
      repository.stubs.create.restore();
    });

    it('CollectivityController count : successful', async () => {
      const countRes = {
        count: 10,
      };

      repository.stubs.count.resolves(countRes);
      const result = await controller.count();

      expect(result).to.deepEqual(countRes);
    });

    it('CollectivityController find : successful', async () => {
      repository.stubs.find.resolves([input]);
      const result = await controller.find();

      expect(result).to.deepEqual([input]);
    });
  });

  function givenStubbedRepository() {
    repository = createStubInstance(CollectivityRepository);
  }

  function givenStubbedService() {
    kcService = createStubInstance(KeycloakService);
  }
});
