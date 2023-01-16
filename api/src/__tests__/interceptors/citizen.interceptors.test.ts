import {
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
  createStubInstance,
} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {Citizen, Enterprise, User} from '../../models';
import {CitizenService} from '../../services';
import {CitizenInterceptor} from '../../interceptors';
import {EnterpriseRepository, UserRepository} from '../../repositories';
import {ValidationError} from '../../validationError';
import {AFFILIATION_STATUS, IUser, ResourceName, StatusCode} from '../../utils';
import {AffiliationService} from '../../services/affiliation.service';

describe('CitizenInterceptor', () => {
  let interceptor: any = null;
  let secondInterceptor: any = null;
  let thirdInterceptor: any = null;
  let citizenService: StubbedInstanceWithSinonAccessor<CitizenService>,
    userRepository: StubbedInstanceWithSinonAccessor<UserRepository>,
    enterpriseRepository: StubbedInstanceWithSinonAccessor<EnterpriseRepository>,
    affiliationService: StubbedInstanceWithSinonAccessor<AffiliationService>,
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

  const errorCitizenNotFound: any = new ValidationError(
    `Citizen not found`,
    '/citizenNotFound',
    StatusCode.NotFound,
    ResourceName.Citizen,
  );

  const errorEnterpriseNotExist: any = new ValidationError(
    `Enterprise does not exist`,
    '/affiliation',
    StatusCode.NotFound,
    ResourceName.Affiliation,
  );

  const errorBadEmailFormat: any = new ValidationError(
    'citizen.email.professional.error.format',
    '/professionnalEmailBadFormat',
    StatusCode.PreconditionFailed,
    ResourceName.ProfessionalEmail,
  );

  const errorEmailUnique: any = new ValidationError(
    'citizen.email.error.unique',
    '/affiliation.enterpriseEmail',
    StatusCode.UnprocessableEntity,
    ResourceName.UniqueProfessionalEmail,
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

  const invocationContextUpdateById = {
    target: {},
    methodName: 'updateById',
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
        affiliation: {
          status: AFFILIATION_STATUS.AFFILIATED,
          enterpriseId: 'c3234ee6-a932-40bf-8a46-52d694cf61ff',
          enterpriseEmail: 'mail@example.com',
        },
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
      userRepository,
      enterpriseRepository,
      affiliationService,
      currentUser,
    );
    secondInterceptor = new CitizenInterceptor(
      citizenService,
      userRepository,
      enterpriseRepository,
      affiliationService,
      otherUser,
    );

    thirdInterceptor = new CitizenInterceptor(
      citizenService,
      userRepository,
      enterpriseRepository,
      affiliationService,
      citizenUser,
    );
  });

  it('CitizenInterceptor creates: error tos', async () => {
    const tosError = new ValidationError(
      `Citizen must agree to terms of services`,
      '/tos',
      StatusCode.UnprocessableEntity,
      ResourceName.Account,
    );
    const ctxCreateTosFalse = {
      target: {},
      methodName: 'create',
      args: [
        {
          tos1: false,
          tos2: true,
        },
      ],
    };
    try {
      await interceptor.intercept(ctxCreateTosFalse);
      sinon.assert.fail();
    } catch (error) {
      expect(error.message).to.equal(tosError.message);
    }
  });

  it('CitizenInterceptor creates: error enterprise not found', async () => {
    const enterpriseNotFoundError = new ValidationError(
      `Enterprise does not exist`,
      '/affiliation',
      StatusCode.NotFound,
      ResourceName.Affiliation,
    );
    const ctxCreateWrongEnterprise = {
      target: {},
      methodName: 'create',
      args: [
        {
          tos1: true,
          tos2: true,
          affiliation: Object.assign({
            enterpriseId: 'wrongId',
            enterpriseEmail: null,
          }),
        },
      ],
    };
    try {
      enterpriseRepository.stubs.findOne.resolves(null);
      await interceptor.intercept(ctxCreateWrongEnterprise);
      sinon.assert.fail();
    } catch (error) {
      expect(error.message).to.equal(enterpriseNotFoundError.message);
    }
  });

  it('CitizenInterceptor creates: error email unique', async () => {
    try {
      const ctxCreateEmailUnique = {
        target: {},
        methodName: 'create',
        args: [
          {
            tos1: true,
            tos2: true,
            affiliation: Object.assign({
              enterpriseId: 'enterpriseId',
              enterpriseEmail: 'mail@example.com',
            }),
          },
        ],
      };
      const enterprise = new Enterprise({emailFormat: ['@example.com']});
      enterpriseRepository.stubs.findOne.resolves(enterprise);
      affiliationService.stubs.isValidEmailProPattern.returns(true);
      affiliationService.stubs.isEmailProExisting.resolves(true);
      await interceptor.intercept(ctxCreateEmailUnique);
    } catch (error) {
      expect(error.message).to.equal(errorEmailUnique.message);
    }
  });

  it('CitizenInterceptor creates: error bad email format', async () => {
    try {
      const ctxCreateEmailBadFormat = {
        target: {},
        methodName: 'create',
        args: [
          {
            tos1: true,
            tos2: true,
            affiliation: Object.assign({
              enterpriseId: 'enterpriseId',
              enterpriseEmail: 'mail@badformat.com',
            }),
          },
        ],
      };
      const enterprise = new Enterprise({emailFormat: ['@exemple.com']});
      enterpriseRepository.stubs.findOne.resolves(enterprise);
      affiliationService.stubs.isValidEmailProPattern.returns(false);
      await interceptor.intercept(ctxCreateEmailBadFormat);
    } catch (error) {
      expect(error.message).to.equal(errorBadEmailFormat.message);
    }
  });

  it('CitizenInterceptor creates: error password', async () => {
    try {
      await interceptor.intercept(invocationContextCreates);
    } catch (error) {
      expect(error.message).to.equal(errorPassword.message);
    }
  });

  it('CitizenInterceptor UpdateById: error citizen not found', async () => {
    try {
      citizenService.stubs.getCitizenWithAffiliationById.resolves();
      await interceptor.intercept(invocationContextUpdateById);
    } catch (error) {
      expect(error.message).to.equal(errorCitizenNotFound.message);
    }
  });

  it('CitizenInterceptor UpdateById: error enterprise does not exist', async () => {
    try {
      const citizen: any = {
        id: 'randomId',
        affiliation: {
          status: AFFILIATION_STATUS.AFFILIATED,
          enterpriseId: 'c3234ee6-a932-40bf-8a46-52d694cf61ff',
        },
      };
      citizenService.stubs.getCitizenWithAffiliationById.resolves(citizen);
      enterpriseRepository.stubs.findOne.resolves(null);
      await interceptor.intercept(invocationContextUpdateById);
    } catch (error) {
      expect(error.message).to.equal(errorEnterpriseNotExist.message);
    }
  });

  it('CitizenInterceptor UpdateById: error email unique', async () => {
    try {
      const citizen: any = {
        id: 'randomId',
        affiliation: {
          status: AFFILIATION_STATUS.AFFILIATED,
          enterpriseId: 'c3234ee6-a932-40bf-8a46-52d694cf61ff',
          enterpriseEmail: 'maildifferent@example.com',
        },
      };
      const enterprise = new Enterprise({emailFormat: ['@example.com']});
      citizenService.stubs.getCitizenWithAffiliationById.resolves(citizen);
      enterpriseRepository.stubs.findOne.resolves(enterprise);
      affiliationService.stubs.isValidEmailProPattern.returns(true);
      affiliationService.stubs.isEmailProExisting.resolves(true);
      await interceptor.intercept(invocationContextUpdateById);
    } catch (error) {
      expect(error.message).to.equal(errorEmailUnique.message);
    }
  });

  it('CitizenInterceptor UpdateById: error bad email format', async () => {
    try {
      const citizen: any = {
        id: 'randomId',
        affiliation: {
          status: AFFILIATION_STATUS.AFFILIATED,
          enterpriseId: 'c3234ee6-a932-40bf-8a46-52d694cf61ff',
          enterpriseEmail: 'mail@badformat.com',
        },
      };
      const enterprise = new Enterprise({emailFormat: ['@badformat.com']});
      citizenService.stubs.getCitizenWithAffiliationById.resolves(citizen);
      enterpriseRepository.stubs.findOne.resolves(enterprise);
      affiliationService.stubs.isValidEmailProPattern.returns(false);
      await interceptor.intercept(invocationContextUpdateById);
    } catch (error) {
      expect(error.message).to.equal(errorBadEmailFormat.message);
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
        status: AFFILIATION_STATUS.AFFILIATED,
        enterpriseId: 'c3234ee6-a932-40bf-8a46-52d694cf61ff',
      },
    };
    try {
      userRepository.stubs.findById.resolves(mockUser);
      citizenService.stubs.getCitizenWithAffiliationById.resolves(citizen);
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
        status: AFFILIATION_STATUS.AFFILIATED,
        enterpriseId: 'c3234ee6-a932-40bf-8a46-52d694cf61ll',
      },
    };
    try {
      userRepository.stubs.findById.resolves(mockUser);
      citizenService.stubs.getCitizenWithAffiliationById.resolves(citizen);
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
      citizenService.stubs.getCitizenWithAffiliationById.resolves(mockAffiliatedCitizen);
      affiliationService.stubs.checkDisaffiliation.resolves(false);
      citizenService.stubs.findEmployees.resolves({
        employees: [mockAffiliatedCitizen],
        employeesCount: 1,
      });
      await interceptor.intercept(invocationContextDisaffiliation, () => {});
      sinon.assert.fail();
    } catch (err) {
      expect(err.message).to.deepEqual(errorAccess.message);
    }
  });

  it('CitizenInterceptor disaffiliation: error access denied', async () => {
    try {
      citizenService.stubs.getCitizenWithAffiliationById.resolves(mockAffiliatedCitizen);
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
      citizenService.stubs.getCitizenWithAffiliationById.resolves(mockAffiliatedCitizen);
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
      citizenService.stubs.getCitizenWithAffiliationById.resolves();

      await interceptor.intercept(invocationContextDisaffiliation, () => {});
    } catch (err) {
      expect(err.message).to.deepEqual(errorCitizenNotFound.message);
    }
  });

  it('CitizenInterceptor findCitizenById: error citizen not found', async () => {
    try {
      citizenService.stubs.getCitizenWithAffiliationById.resolves();

      await interceptor.intercept(invocationContextFindCitizenId, () => {});
    } catch (err) {
      expect(err.message).to.deepEqual(errorCitizenNotFound.message);
    }
  });

  /**
   * givenStubbedService without id
   */
  function givenStubbedService() {
    citizenService = createStubInstance(CitizenService);
    userRepository = createStubInstance(UserRepository);
    enterpriseRepository = createStubInstance(EnterpriseRepository);
    affiliationService = createStubInstance(AffiliationService);
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
    userRepository = createStubInstance(UserRepository);
    enterpriseRepository = createStubInstance(EnterpriseRepository);
    affiliationService = createStubInstance(AffiliationService);
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
    userRepository = createStubInstance(UserRepository);
    enterpriseRepository = createStubInstance(EnterpriseRepository);
    affiliationService = createStubInstance(AffiliationService);
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
    status: AFFILIATION_STATUS.AFFILIATED,
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
    status: AFFILIATION_STATUS.TO_AFFILIATE,
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
    status: AFFILIATION_STATUS.TO_AFFILIATE,
  }),
});

const mockUser = new User({
  id: 'c3234ee6-a932-40bf-8a46-52d694cf61ff',
  roles: ['gestionnaires'],
});
