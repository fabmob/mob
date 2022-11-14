import {
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
  createStubInstance,
} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {Citizen, User} from '../../models';
import {CitizenService} from '../../services';
import {CitizenInterceptor} from '../../interceptors';
import {CitizenRepository, UserRepository} from '../../repositories';
import {ValidationError} from '../../validationError';
import {AFFILIATION_STATUS, IUser, ResourceName, StatusCode} from '../../utils';
import {CitizenController} from '../../controllers';

describe('CitizenInterceptor', () => {
  let interceptor: any = null;
  let secondInterceptor: any = null;
  let thirdInterceptor: any = null;
  let citizenService: StubbedInstanceWithSinonAccessor<CitizenService>,
    citizenRepository: StubbedInstanceWithSinonAccessor<CitizenRepository>,
    userRepository: StubbedInstanceWithSinonAccessor<UserRepository>,
    currentUser: IUser,
    otherUser: IUser,
    citizenUser: IUser;

  const err: any = new ValidationError(`citizens.error.birthdate.age`, '/birthdate');

  const errorAffiliationNotFound: any = new ValidationError(
    'citizens.affiliation.not.found',
    '/citizensAffiliationNotFound',
    StatusCode.NotFound,
    ResourceName.Affiliation,
  );

  const errorAffiliationImpossible: any = new ValidationError(
    'citizen.affiliation.impossible',
    '/citizenAffiliationImpossible',
    StatusCode.PreconditionFailed,
    ResourceName.Affiliation,
  );

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

  const errorPassword: any = new ValidationError(
    `Password cannot be empty`,
    '/password',
    StatusCode.PreconditionFailed,
    ResourceName.Account,
  );
  const AccessDenied: any = new ValidationError(
    'Access denied',
    '/authorization',
    StatusCode.Forbidden,
  );

  const invocationContextCreates = {
    target: {},
    methodName: 'create',
    args: [
      {
        identity: Object.assign({
          firstName: Object.assign({
            value: 'firstName',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date(),
          }),
          lastName: Object.assign({
            value: 'lastName',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date(),
          }),
          birthDate: Object.assign({
            value: '3000-11-17',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date(),
          }),
        }),
        email: 'test@gmail.com',
        city: 'city',
        status: 'salarie',
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
        identity: Object.assign({
          firstName: Object.assign({
            value: 'firstName',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date(),
          }),
          lastName: Object.assign({
            value: 'lastName',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date(),
          }),
          birthDate: Object.assign({
            value: '1991-11-17',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date(),
          }),
        }),
        email: 'test@gmail.com',
        city: 'city',
        status: 'salarie',
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
        identity: Object.assign({
          firstName: Object.assign({
            value: 'firstName',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date(),
          }),
          lastName: Object.assign({
            value: 'lastName',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date(),
          }),
          birthDate: Object.assign({
            value: '3000-11-17',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date(),
          }),
        }),
        email: 'test@gmail.com',
        city: 'city',
        status: 'salarie',
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

  const invocationContextvalidateAffiliation = {
    target: {},
    methodName: 'validateAffiliation',
    args: ['', {token: ''}],
  };

  const invocationContextvalidateAffiliationWithId = {
    target: {},
    methodName: 'validateAffiliation',
    args: ['c3234ee6-a932-40bf-8a46-52d694cf61ff', {token: ''}],
  };

  const invocationContextDisaffiliat = {
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
    givenStubbedServiceId();
    givenStubbedServiceCitizen();
    interceptor = new CitizenInterceptor(
      citizenService,
      citizenRepository,
      userRepository,
      currentUser,
    );
    secondInterceptor = new CitizenInterceptor(
      citizenService,
      citizenRepository,
      userRepository,
      otherUser,
    );

    thirdInterceptor = new CitizenInterceptor(
      citizenService,
      citizenRepository,
      userRepository,
      citizenUser,
    );
  });

  it('CitizenInterceptor creates: error password', async () => {
    try {
      await interceptor.intercept(invocationContextCreates);
    } catch (error) {
      expect(error.message).to.equal(errorPassword.message);
    }
  });

  it('CitizenInterceptor ReplaceById: error date', async () => {
    try {
      await interceptor.intercept(invocationContextReplaceById);
    } catch (error) {
      expect(error.message).to.equal(err.message);
    }
  });

  it('CitizenInterceptor find: findCitizenId', async () => {
    try {
      await interceptor.intercept(invocationContextvalidateAffiliation, () => {});
    } catch (err) {
      expect(err.message).to.deepEqual(errorAffiliationNotFound.message);
    }
  });

  it('CitizenInterceptor value', async () => {
    const res = 'successful binding';
    sinon.stub(interceptor.intercept, 'bind').resolves(res);
    const result = await interceptor.value();

    expect(result).to.equal(res);
    interceptor.intercept.bind.restore();
  });

  it('CitizenInterceptor validateAffiliation: ValidationError', async () => {
    try {
      await interceptor.intercept(invocationContextvalidateAffiliation, () => {});
    } catch (err) {
      expect(err.message).to.deepEqual(errorAffiliationNotFound.message);
    }
  });

  it('CitizenInterceptor validateAffiliation: impossible affiliation ', async () => {
    const citizen: any = {
      id: 'randomId',
      affiliation: {
        affiliationStatus: AFFILIATION_STATUS.AFFILIATED,
        entrepriseId: 'c3234ee6-a932-40bf-8a46-52d694cf61ff',
      },
    };
    try {
      userRepository.stubs.findById.resolves(mockUser);
      citizenRepository.stubs.findOne.resolves(citizen);
      await secondInterceptor.intercept(
        invocationContextvalidateAffiliationWithId,
        () => {},
      );
    } catch (err) {
      expect(err.message).to.deepEqual(errorAffiliationImpossible.message);
    }
  });

  it('CitizenInterceptor validateAffiliation: impossible affiliation if not same citizen ', async () => {
    const citizen: any = {
      id: 'randomId',
      affiliation: {
        affiliationStatus: AFFILIATION_STATUS.AFFILIATED,
        entrepriseId: 'c3234ee6-a932-40bf-8a46-52d694cf61ll',
      },
    };
    try {
      userRepository.stubs.findById.resolves(mockUser);
      citizenRepository.stubs.findOne.resolves(citizen);
      await thirdInterceptor.intercept(
        invocationContextvalidateAffiliationWithId,
        () => {},
      );
    } catch (err) {
      expect(err.message).to.deepEqual(errorAffiliationImpossible.message);
    }
  });

  it('CitizenInterceptor disaffiliation: error disaffiliation impossible', async () => {
    try {
      citizenRepository.stubs.findOne.resolves(mockAffiliatedCitizen);
      citizenService.stubs.findEmployees.resolves({
        employees: [mockAffiliatedCitizen],
        employeesCount: 1,
      });
      await interceptor.intercept(invocationContextDisaffiliation, () => {});
    } catch (err) {
      expect(err.message).to.deepEqual(errorAccess.message);
    }
  });

  it('CitizenInterceptor disaffiliation: error access denied', async () => {
    try {
      citizenRepository.stubs.findOne.resolves(mockAffiliatedCitizen);
      citizenService.stubs.findEmployees.resolves({
        employees: [mockCitizenDisaffiliation],
        employeesCount: 1,
      });
      await interceptor.intercept(invocationContextDisaffiliat, () => {});
    } catch (err) {
      expect(err.message).to.deepEqual(AccessDenied.message);
    }
  });

  it('CitizenInterceptor disaffiliation affiliated citizen: error access denied', async () => {
    try {
      citizenRepository.stubs.findOne.resolves(mockAffiliatedCitizen);
      citizenService.stubs.findEmployees.resolves({
        employees: [mockCitizenToAffiliate],
        employeesCount: 1,
      });
      await interceptor.intercept(invocationContextDisaffiliat, () => {});
    } catch (err) {
      expect(err.message).to.deepEqual(AccessDenied.message);
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

  /**
   * givenStubbedService without id
   */
  function givenStubbedService() {
    citizenService = createStubInstance(CitizenService);
    citizenRepository = createStubInstance(CitizenRepository);
    userRepository = createStubInstance(UserRepository);
    currentUser = {
      id: '',
      emailVerified: true,
      maas: undefined,
      membership: ['/entreprises/Capgemini'],
      roles: ['gestionnaires'],
      [securityId]: 'idEnterprise',
    };
  }

  /**
   * givenStubbedService with id
   */
  function givenStubbedServiceId() {
    citizenService = createStubInstance(CitizenService);
    citizenRepository = createStubInstance(CitizenRepository);
    userRepository = createStubInstance(UserRepository);
    otherUser = {
      id: 'c3234ee6-a932-40bf-8a46-52d694cf61ff',
      emailVerified: true,
      maas: undefined,
      membership: ['/entreprises/Capgemini'],
      roles: ['gestionnaires'],
      [securityId]: 'idEnterprise',
    };
  }

  /**

   * givenStubbedService with citizen as user

   */
  function givenStubbedServiceCitizen() {
    citizenService = createStubInstance(CitizenService);
    citizenRepository = createStubInstance(CitizenRepository);
    userRepository = createStubInstance(UserRepository);
    citizenUser = {
      id: 'c3234ee6-a932-40bf-8a46-52d694cf61ff',
      emailVerified: true,
      clientName: undefined,
      funderType: undefined,
      funderName: undefined,
      incentiveType: undefined,
      roles: ['citoyens'],
      [securityId]: 'c3234ee6-a932-40bf-8a46-52d694cf61ff',
    };
  }
});

const mockAffiliatedCitizen = new Citizen({
  id: 'c3234ee6-a932-40bf-8a46-52d694cf61ff',
  identity: Object.assign({
    firstName: Object.assign({
      value: 'Xina',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
    lastName: Object.assign({
      value: 'Zhong',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
  }),
  affiliation: Object.assign({
    affiliationStatus: AFFILIATION_STATUS.AFFILIATED,
  }),
});

const mockCitizenDisaffiliation = new Citizen({
  id: '123',
  identity: Object.assign({
    firstName: Object.assign({
      value: 'Xina',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
    lastName: Object.assign({
      value: 'Zhong',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
  }),
  affiliation: Object.assign({
    affiliationStatus: AFFILIATION_STATUS.TO_AFFILIATE,
  }),
});

const mockCitizenToAffiliate = new Citizen({
  id: '123',
  identity: Object.assign({
    firstName: Object.assign({
      value: 'Xina',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
    lastName: Object.assign({
      value: 'Zhong',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
  }),
  affiliation: Object.assign({
    affiliationStatus: AFFILIATION_STATUS.TO_AFFILIATE,
  }),
});

const mockUser = new User({
  id: 'c3234ee6-a932-40bf-8a46-52d694cf61ff',
  roles: ['gestionnaires'],
});
