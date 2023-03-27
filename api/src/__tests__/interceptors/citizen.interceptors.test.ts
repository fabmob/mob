import {expect, sinon, StubbedInstanceWithSinonAccessor, createStubInstance} from '@loopback/testlab';
import {securityId} from '@loopback/security';

import {Citizen, Enterprise, EnterpriseDetails, Funder, User} from '../../models';
import {CitizenService} from '../../services';
import {CitizenInterceptor} from '../../interceptors';
import {FunderRepository, UserRepository} from '../../repositories';
import {AFFILIATION_STATUS, IUser, PartialCitizen, StatusCode} from '../../utils';
import {AffiliationService} from '../../services/affiliation.service';

describe('CitizenInterceptor', () => {
  let interceptor: any = null;
  let secondInterceptor: any = null;
  let thirdInterceptor: any = null;
  let citizenService: StubbedInstanceWithSinonAccessor<CitizenService>,
    userRepository: StubbedInstanceWithSinonAccessor<UserRepository>,
    funderRepository: StubbedInstanceWithSinonAccessor<FunderRepository>,
    affiliationService: StubbedInstanceWithSinonAccessor<AffiliationService>,
    currentUser: IUser,
    otherUser: IUser,
    citizenUser: IUser;

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

  beforeEach(() => {
    givenStubbedService();
    givenStubbedServiceId();
    givenStubbedServiceCitizen();
    interceptor = new CitizenInterceptor(
      citizenService,
      userRepository,
      funderRepository,
      affiliationService,
      currentUser,
    );
    secondInterceptor = new CitizenInterceptor(
      citizenService,
      userRepository,
      funderRepository,
      affiliationService,
      otherUser,
    );

    thirdInterceptor = new CitizenInterceptor(
      citizenService,
      userRepository,
      funderRepository,
      affiliationService,
      citizenUser,
    );
  });

  it('CitizenInterceptor creates: error tos', async () => {
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
    } catch (error) {
      expect(error.message).to.equal('Citizen must agree to terms of services');
      expect(error.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('CitizenInterceptor creates: error enterprise not found', async () => {
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
      funderRepository.stubs.getEnterpriseById.resolves(null);
      await interceptor.intercept(ctxCreateWrongEnterprise);
    } catch (error) {
      expect(error.message).to.equal('Enterprise does not exist');
      expect(error.statusCode).to.equal(StatusCode.BadRequest);
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
      const enterprise = new Enterprise({
        enterpriseDetails: new EnterpriseDetails({emailDomainNames: ['@example.com']}),
      });
      funderRepository.stubs.getEnterpriseById.resolves(enterprise);
      affiliationService.stubs.isValidEmailProPattern.returns(true);
      affiliationService.stubs.isEmailProExisting.resolves(true);
      await interceptor.intercept(ctxCreateEmailUnique);
    } catch (error) {
      expect(error.message).to.equal('citizen.email.error.unique');
      expect(error.statusCode).to.equal(StatusCode.Conflict);
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
      const enterprise = new Enterprise({
        enterpriseDetails: new EnterpriseDetails({emailDomainNames: ['@example.com']}),
      });
      funderRepository.stubs.getEnterpriseById.resolves(enterprise);
      affiliationService.stubs.isValidEmailProPattern.returns(false);
      await interceptor.intercept(ctxCreateEmailBadFormat);
    } catch (error) {
      expect(error.message).to.equal('citizen.email.professional.error.format');
      expect(error.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('CitizenInterceptor creates: error password', async () => {
    try {
      await interceptor.intercept(invocationContextCreates);
    } catch (error) {
      expect(error.message).to.equal('Password cannot be empty');
      expect(error.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('CitizenInterceptor UpdateById: error citizen not found', async () => {
    try {
      citizenService.stubs.getCitizenWithAffiliationById.resolves();
      await interceptor.intercept(invocationContextUpdateById);
    } catch (error) {
      expect(error.message).to.equal('Citizen not found');
      expect(error.statusCode).to.equal(StatusCode.NotFound);
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
      funderRepository.stubs.getEnterpriseById.resolves(null);
      await interceptor.intercept(invocationContextUpdateById);
    } catch (error) {
      expect(error.message).to.equal('Enterprise does not exist');
      expect(error.statusCode).to.equal(StatusCode.BadRequest);
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
      const enterprise = new Enterprise({
        enterpriseDetails: new EnterpriseDetails({emailDomainNames: ['@example.com']}),
      });
      citizenService.stubs.getCitizenWithAffiliationById.resolves(citizen);
      funderRepository.stubs.getEnterpriseById.resolves(enterprise);
      affiliationService.stubs.isValidEmailProPattern.returns(true);
      affiliationService.stubs.isEmailProExisting.resolves(true);
      await interceptor.intercept(invocationContextUpdateById);
    } catch (error) {
      expect(error.message).to.equal('citizen.email.error.unique');
      expect(error.statusCode).to.equal(StatusCode.Conflict);
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
      const enterprise = new Enterprise({
        enterpriseDetails: new EnterpriseDetails({emailDomainNames: ['@example.com']}),
      });
      citizenService.stubs.getCitizenWithAffiliationById.resolves(citizen);
      funderRepository.stubs.getEnterpriseById.resolves(enterprise);
      affiliationService.stubs.isValidEmailProPattern.returns(false);
      await interceptor.intercept(invocationContextUpdateById);
    } catch (error) {
      expect(error.message).to.equal('citizen.email.professional.error.format');
      expect(error.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('CitizenInterceptor validateAffiliation: affiliation not found', async () => {
    try {
      await interceptor.intercept(invocationContextvalidateAffiliation, () => {});
    } catch (err) {
      expect(err.message).to.deepEqual('citizens.affiliation.not.found');
      expect(err.statusCode).to.deepEqual(StatusCode.BadRequest);
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
      expect(err.message).to.equal('citizens.affiliation.not.found');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
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
      await secondInterceptor.intercept(invocationContextvalidateAffiliationWithId, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
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
      await thirdInterceptor.intercept(invocationContextvalidateAffiliationWithId, () => {});
    } catch (err) {
      expect(err.message).to.equal('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });

  it('CitizenInterceptor disaffiliation: error funder not found', async () => {
    try {
      funderRepository.stubs.getFunderByNameAndType.resolves(null);
      await interceptor.intercept(invocationContextDisaffiliation, () => {});
    } catch (err) {
      expect(err.message).to.equal('Funder not found');
      expect(err.statusCode).to.equal(StatusCode.BadRequest);
    }
  });

  it('CitizenInterceptor disaffiliation: error disaffiliation impossible', async () => {
    try {
      const funder: Funder = new Funder({
        enterpriseDetails: new EnterpriseDetails({hasManualAffiliation: true}),
      });
      funderRepository.stubs.getFunderByNameAndType.resolves(funder);
      citizenService.stubs.getCitizenWithAffiliationById.resolves(mockAffiliatedCitizen);
      affiliationService.stubs.checkDisaffiliation.resolves(false);
      citizenService.stubs.getEnterpriseEmployees.resolves([mockPartialCitizen]);
      await interceptor.intercept(invocationContextDisaffiliation, () => {});
    } catch (err) {
      expect(err.message).to.equal('citizen.disaffiliation.impossible');
      expect(err.statusCode).to.equal(StatusCode.UnprocessableEntity);
    }
  });

  it('CitizenInterceptor disaffiliation: error access denied', async () => {
    try {
      const funder: Funder = new Funder({
        enterpriseDetails: new EnterpriseDetails({hasManualAffiliation: true}),
      });
      funderRepository.stubs.getFunderByNameAndType.resolves(funder);
      citizenService.stubs.getCitizenWithAffiliationById.resolves(mockAffiliatedCitizen);
      citizenService.stubs.getEnterpriseEmployees.resolves([mockPartialCitizenDifferentId]);
      await interceptor.intercept(invocationContextDisaffiliat, () => {});
    } catch (err) {
      expect(err.message).to.deepEqual('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });

  it('CitizenInterceptor disaffiliation affiliated citizen: error access denied', async () => {
    try {
      const funder: Funder = new Funder({
        enterpriseDetails: new EnterpriseDetails({hasManualAffiliation: true}),
      });
      funderRepository.stubs.getFunderByNameAndType.resolves(funder);
      citizenService.stubs.getCitizenWithAffiliationById.resolves(mockAffiliatedCitizen);
      citizenService.stubs.getEnterpriseEmployees.resolves([mockPartialCitizenDifferentId]);
      await interceptor.intercept(invocationContextDisaffiliat, () => {});
    } catch (err) {
      expect(err.message).to.deepEqual('Access denied');
      expect(err.statusCode).to.equal(StatusCode.Forbidden);
    }
  });

  it('CitizenInterceptor disaffiliation: error citizen not found', async () => {
    try {
      const funder: Funder = new Funder({
        enterpriseDetails: new EnterpriseDetails({hasManualAffiliation: true}),
      });
      funderRepository.stubs.getFunderByNameAndType.resolves(funder);
      citizenService.stubs.getCitizenWithAffiliationById.resolves();

      await interceptor.intercept(invocationContextDisaffiliation, () => {});
    } catch (err) {
      expect(err.message).to.equal('Citizen not found');
      expect(err.statusCode).to.equal(StatusCode.NotFound);
    }
  });

  /**
   * givenStubbedService without id
   */
  function givenStubbedService() {
    citizenService = createStubInstance(CitizenService);
    userRepository = createStubInstance(UserRepository);
    funderRepository = createStubInstance(FunderRepository);
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
    funderRepository = createStubInstance(FunderRepository);
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
    funderRepository = createStubInstance(FunderRepository);
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

const mockPartialCitizen: PartialCitizen = {
  id: 'c3234ee6-a932-40bf-8a46-52d694cf61ff',
  lastName: 'lastName',
  firstName: 'firstName',
  birthdate: 'birthdate',
  email: 'email',
  enterpriseEmail: 'email@email.com',
  isCitizenDeleted: false,
};

const mockPartialCitizenDifferentId: PartialCitizen = {
  id: 'differentId',
  lastName: 'lastName',
  firstName: 'firstName',
  birthdate: 'birthdate',
  email: 'email',
  enterpriseEmail: 'email@email.com',
  isCitizenDeleted: false,
};

const mockUser = new User({
  id: 'c3234ee6-a932-40bf-8a46-52d694cf61ff',
  roles: ['gestionnaires'],
});
