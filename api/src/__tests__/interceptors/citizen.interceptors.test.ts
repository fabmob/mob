import {intercept} from '@loopback/core';
import {
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
  createStubInstance,
} from '@loopback/testlab';

import {Citizen} from '../../models';
import {CitizenService} from '../../services';
import {CitizenInterceptor} from '../../interceptors';
import {CitizenRepository} from '../../repositories';
import {ValidationError} from '../../validationError';
import {ResourceName, StatusCode} from '../../utils';

describe('CitizenInterceptor', () => {
  let interceptor: any = null;
  let citizenService: StubbedInstanceWithSinonAccessor<CitizenService>,
    citizenRepository: StubbedInstanceWithSinonAccessor<CitizenRepository>;

  const err: any = new ValidationError(`citizens.error.birthdate.age`, '/birthdate');

  const errorAccess: any = new ValidationError(
    `citizen.disaffiliation.impossible`,
    '/citizenDisaffiliationImpossible',
  );

  const errorNotFound: any = new ValidationError(
    `Citizen not found`,
    '/citizenNotFound',
    StatusCode.NotFound,
    ResourceName.Citizen,
  );

  const invocationContextCreates = {
    target: {},
    methodName: 'create',
    args: [
      {
        lastName: 'lastName',
        firstName: 'firstName',
        email: 'test@gmail.com',
        city: 'city',
        status: 'salarie',
        password: 'pass123123123!',
        birthdate: '3000-11-17',
        postcode: '31000',
        tos1: true,
        tos2: true,
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
    ],
  };

  const invocationContextCreatesuccessful = {
    target: {},
    methodName: 'create',
    args: [
      {
        lastName: 'lastName',
        firstName: 'firstName',
        email: 'test@gmail.com',
        city: 'city',
        status: 'salarie',
        password: 'pass123123123!',
        birthdate: '1991-11-17',
        postcode: '31000',
        tos1: true,
        tos2: true,
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
    ],
  };

  const invocationContextReplaceById = {
    target: {},
    methodName: 'replaceById',
    args: [
      'id',
      {
        lastName: 'lastName',
        firstName: 'firstName',
        email: 'test@gmail.com',
        city: 'city',
        status: 'salarie',
        password: 'pass123123123!',
        birthdate: '3000-11-17',
        postcode: '31000',
        tos1: true,
        tos2: true,
        getId: () => {},
        getIdObject: () => ({id: 'random'}),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      },
    ],
  };

  const invocationContextDisaffiliation = {
    target: {},
    methodName: 'disaffiliation',
    args: ['c3234ee6-a932-40bf-8a46-52d694cf61ff'],
  };

  const invocationContextFindCitizenId = {
    target: {},
    methodName: 'findCitizenId',
    args: ['c3234ee6-a932-40bf-8a46-52d694cf61ff'],
  };

  beforeEach(() => {
    givenStubbedService();
    interceptor = new CitizenInterceptor(citizenService, citizenRepository);
  });

  it('CitizenInterceptor creates: error date', async () => {
    try {
      await interceptor.intercept(invocationContextCreates);
    } catch (error) {
      expect(error.message).to.equal(err.message);
    }
  });

  it('CitizenInterceptor creates: successful', async () => {
    const result = await interceptor.intercept(
      invocationContextCreatesuccessful,
      () => {},
    );
    expect(result).to.Null;
  });

  it('CitizenInterceptor ReplaceById: error date', async () => {
    try {
      await interceptor.intercept(invocationContextReplaceById);
    } catch (error) {
      expect(error.message).to.equal(err.message);
    }
  });

  it('CitizenInterceptor value', async () => {
    const res = 'successful binding';
    sinon.stub(interceptor.intercept, 'bind').resolves(res);
    const result = await interceptor.value();

    expect(result).to.equal(res);
    interceptor.intercept.bind.restore();
  });

  it('CitizenInterceptor disaffiliation: error access denied', async () => {
    try {
      citizenRepository.stubs.findOne.resolves(mockCitizen);
      citizenService.stubs.findEmployees.resolves({
        employees: [mockCitizen],
        employeesCount: 1,
      });

      await interceptor.intercept(invocationContextDisaffiliation, () => {});
    } catch (err) {
      expect(err.message).to.deepEqual(errorAccess.message);
    }
  });

  it('CitizenInterceptor disaffiliation: error citizen not found', async () => {
    try {
      citizenRepository.stubs.findOne.resolves(null);

      await interceptor.intercept(invocationContextDisaffiliation, () => {});
    } catch (err) {
      expect(err.message).to.deepEqual(errorNotFound.message);
    }
  });

  it('CitizenInterceptor findCitizenById: error citizen not found', async () => {
    try {
      citizenRepository.stubs.findOne.resolves(null);

      await interceptor.intercept(invocationContextFindCitizenId, () => {});
    } catch (err) {
      expect(err.message).to.deepEqual(errorNotFound.message);
    }
  });

  function givenStubbedService() {
    citizenService = createStubInstance(CitizenService);
    citizenRepository = createStubInstance(CitizenRepository);
  }
});

const mockCitizen = new Citizen({
  id: 'c3234ee6-a932-40bf-8a46-52d694cf61ff',
  firstName: 'Xina',
  lastName: 'Zhong',
});
