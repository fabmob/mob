import * as Excel from 'exceljs';
import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import {securityId} from '@loopback/security';
import {AnyObject} from '@loopback/repository';

import {
  CitizenRepository,
  EnterpriseRepository,
  CommunityRepository,
  UserRepository,
  IncentiveRepository,
  SubscriptionRepository,
} from '../../repositories';
import {CitizenController} from '../../controllers';
import {
  CitizenService,
  FunderService,
  KeycloakService,
  JwtService,
  MailService,
  SubscriptionService,
  IUser,
} from '../../services';
import {ValidationError} from '../../validationError';
import {
  AFFILIATION_STATUS,
  CITIZEN_STATUS,
  ResourceName,
  StatusCode,
  SUBSCRIPTION_STATUS,
  INCENTIVE_TYPE,
} from '../../utils';
import {Enterprise, Citizen, User, CitizenUpdate, Subscription} from '../../models';

describe('CitizenController (unit)', () => {
  let spy: any,
    citizenRepository: StubbedInstanceWithSinonAccessor<CitizenRepository>,
    communityRepository: StubbedInstanceWithSinonAccessor<CommunityRepository>,
    mailService: StubbedInstanceWithSinonAccessor<MailService>,
    enterpriseRepository: StubbedInstanceWithSinonAccessor<EnterpriseRepository>,
    kcService: StubbedInstanceWithSinonAccessor<KeycloakService>,
    funderService: StubbedInstanceWithSinonAccessor<FunderService>,
    citizenService: StubbedInstanceWithSinonAccessor<CitizenService>,
    subscriptionService: StubbedInstanceWithSinonAccessor<SubscriptionService>,
    userRepository: StubbedInstanceWithSinonAccessor<UserRepository>,
    currentUserProfile: IUser,
    jwtService: StubbedInstanceWithSinonAccessor<JwtService>,
    subscriptionsRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    incentivesRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    controller: CitizenController;

  const etudiant = Object.assign(new Citizen(), {
    id: 'randomInputId',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
    password: 'password123123!',
    city: 'test',
    status: CITIZEN_STATUS.STUDENT,
    birthdate: '1991-11-17',
    postcode: '31000',
    tos1: true,
    tos2: true,
    affiliation: Object.assign({
      enterpriseId: '',
      enterpriseEmail: '',
    }),
    getId: () => {},
    getIdObject: () => ({id: 'random'}),
    toJSON: () => ({id: 'random'}),
    toObject: () => ({id: 'random'}),
  });

  const createdEtudiant = Object.assign(new Citizen(), {
    id: 'randomInputId',
    lastName: 'lastname',
    firstName: 'firstname',
    email: 'email@gmail.com',
    password: 'password123123!',
    city: 'test',
    status: CITIZEN_STATUS.STUDENT,
    birthdate: '1991-11-17',
    postcode: '31000',
    tos1: true,
    tos2: true,
    affiliation: Object.assign({
      enterpriseId: null,
      enterpriseEmail: null,
      affiliationStatus: AFFILIATION_STATUS.UNKNOWN,
    }),
    getId: () => {},
    getIdObject: () => ({id: 'random'}),
    toJSON: () => ({id: 'random'}),
    toObject: () => ({id: 'random'}),
  });

  const salarie = Object.assign(new Citizen(), {
    id: 'randomInputId',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
    password: 'password123123!',
    city: 'test',
    status: CITIZEN_STATUS.EMPLOYEE,
    birthdate: '1991-11-17',
    postcode: '31000',
    tos1: true,
    tos2: true,
    affiliation: Object.assign({
      enterpriseId: 'enterpriseId',
      enterpriseEmail: 'enterpriseEmail@gmail.com',
    }),
    getId: () => {},
    getIdObject: () => ({id: 'random'}),
    toJSON: () => ({id: 'random'}),
    toObject: () => ({id: 'random'}),
  });

  const createdSalarie = Object.assign(new Citizen(), {
    id: 'randomInputId',
    email: 'email@gmail.com',
    firstName: 'firstname',
    lastName: 'lastname',
    birthdate: '1991-11-17',
    city: 'test',
    postcode: '31000',
    status: CITIZEN_STATUS.EMPLOYEE,
    tos1: true,
    tos2: true,
    affiliation: Object.assign({
      enterpriseId: 'enterpriseId',
      enterpriseEmail: 'enterpriseEmail@gmail.com',
      affiliationStatus: AFFILIATION_STATUS.TO_AFFILIATE,
    }),
  });

  const salarieNoEnterprise = Object.assign(new Citizen(), {
    id: 'randomInputId',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
    password: 'password123123!',
    city: 'test',
    status: CITIZEN_STATUS.EMPLOYEE,
    birthdate: '1991-11-17',
    postcode: '31000',
    tos1: true,
    tos2: true,
    affiliation: Object.assign({
      enterpriseId: '',
      enterpriseEmail: '',
    }),
  });

  const createdSalarieNoEnterprise = Object.assign(new Citizen(), {
    id: 'randomInputId',
    email: 'email@gmail.com',
    firstName: 'firstname',
    lastName: 'lastname',
    birthdate: '1991-11-17',
    city: 'test',
    postcode: '31000',
    status: CITIZEN_STATUS.EMPLOYEE,
    tos1: true,
    tos2: true,
    affiliation: Object.assign({
      enterpriseId: null,
      enterpriseEmail: null,
      affiliationStatus: AFFILIATION_STATUS.UNKNOWN,
    }),
  });

  const enterprise: Enterprise = new Enterprise({
    name: 'enterprise',
    emailFormat: ['@gmail.com', 'rr'],
  });

  beforeEach(() => {
    givenStubbedRepository();
    givenStubbedService();
    controller = new CitizenController(
      mailService,
      citizenRepository,
      communityRepository,
      kcService,
      funderService,
      enterpriseRepository,
      citizenService,
      subscriptionService,
      jwtService,
      userRepository,
      currentUserProfile,
      subscriptionsRepository,
      incentivesRepository,
    );
  });

  describe('CitizenController', () => {
    it('CitizenController create : fails because of createUserkc error', async () => {
      const errorKc = new ValidationError(
        `email.error.unique`,
        '/email',
        StatusCode.Conflict,
      );

      try {
        kcService.stubs.createUserKc.rejects(errorKc);
        await controller.create(salarie);
      } catch (err) {
        expect(err.message).to.equal(errorKc.message);
      }

      kcService.stubs.createUserKc.restore();
    }).timeout(4000);

    it('CitizenController create : fails because of create repository error', async () => {
      const errorRepository = 'can not add data in database';
      try {
        kcService.stubs.createUserKc.resolves({
          id: 'randomInputId',
        });
        citizenRepository.stubs.create.rejects(errorRepository);
        enterpriseRepository.stubs.findById.resolves(enterprise);
        kcService.stubs.deleteUserKc.resolves();
        citizenService.stubs.validateEmailPattern.resolves();

        await controller.create(salarie);
      } catch (err) {
        expect(err.name).to.equal(errorRepository);
      }

      kcService.stubs.createUserKc.restore();
      citizenRepository.stubs.create.restore();
      enterpriseRepository.stubs.findById.restore();
      kcService.stubs.deleteUserKc.restore();
      citizenService.stubs.validateEmailPattern.restore();
    });

    it('CitizenController create : fails because of sending email verification', async () => {
      const errorEmail = 'can not send email';
      try {
        kcService.stubs.createUserKc.resolves({
          id: 'randomInputId',
        });
        citizenRepository.stubs.create.resolves(salarie);
        enterpriseRepository.stubs.findById.resolves(enterprise);
        kcService.stubs.sendExecuteActionsEmailUserKc.rejects(errorEmail);
        kcService.stubs.deleteUserKc.resolves();

        await controller.create(salarie);
      } catch (err) {
        expect(err.name).to.equal(errorEmail);
      }

      kcService.stubs.createUserKc.restore();
      citizenRepository.stubs.create.restore();
      enterpriseRepository.stubs.findById.restore();
      kcService.stubs.sendExecuteActionsEmailUserKc.restore();
      kcService.stubs.deleteUserKc.restore();
    });

    it('CitizenController create salarie : successful', async () => {
      enterpriseRepository.stubs.findById.resolves(enterprise);
      citizenService.stubs.validateEmailPattern.resolves();
      kcService.stubs.createUserKc.resolves({
        id: 'randomInputId',
      });
      citizenRepository.stubs.create.resolves(createdSalarie);
      kcService.stubs.sendExecuteActionsEmailUserKc.resolves();
      citizenService.stubs.sendAffiliationMail.resolves();

      const result = await controller.create(salarie);

      expect(result).to.deepEqual({
        id: 'randomInputId',
      });

      sinon.assert.calledWithExactly(
        citizenService.stubs.validateEmailPattern,
        'enterpriseEmail@gmail.com',
        ['@gmail.com', 'rr'],
      );

      sinon.assert.calledWithExactly(
        citizenRepository.stubs.create,
        sinon.match(createdSalarie),
      );

      enterpriseRepository.stubs.findById.restore();
      citizenService.stubs.validateEmailPattern.restore();
      kcService.stubs.createUserKc.restore();
      citizenRepository.stubs.create.restore();
      kcService.stubs.sendExecuteActionsEmailUserKc.restore();
      citizenService.stubs.sendAffiliationMail.restore();
    });

    it('CitizenController create salarie no enterprise : successful', async () => {
      kcService.stubs.createUserKc.resolves({
        id: 'randomInputId',
      });
      citizenRepository.stubs.create.resolves(createdSalarieNoEnterprise);
      kcService.stubs.sendExecuteActionsEmailUserKc.resolves();

      const result = await controller.create(salarieNoEnterprise);

      expect(result).to.deepEqual({
        id: 'randomInputId',
      });

      sinon.assert.calledWithExactly(
        citizenRepository.stubs.create,
        sinon.match(createdSalarieNoEnterprise),
      );

      kcService.stubs.createUserKc.restore();
      citizenRepository.stubs.create.restore();
      kcService.stubs.sendExecuteActionsEmailUserKc.restore();
    });

    it('CitizenController create étudiant : successful', async () => {
      kcService.stubs.createUserKc.resolves({
        id: 'randomInputId',
      });
      citizenRepository.stubs.create.resolves(createdEtudiant);
      kcService.stubs.sendExecuteActionsEmailUserKc.resolves();

      const result = await controller.create(etudiant);

      expect(result).to.deepEqual({
        id: 'randomInputId',
      });

      const arg: any = {
        email: 'email@gmail.com',
        firstName: 'firstname',
        lastName: 'lastname',
        birthdate: '1991-11-17',
        city: 'test',
        postcode: '31000',
        status: CITIZEN_STATUS.STUDENT,
        tos1: true,
        tos2: true,
        id: 'randomInputId',
        affiliation: {
          enterpriseId: null,
          enterpriseEmail: null,
          affiliationStatus: AFFILIATION_STATUS.UNKNOWN,
        },
      };

      sinon.assert.notCalled(enterpriseRepository.stubs.findById);
      sinon.assert.notCalled(citizenService.stubs.validateEmailPattern);
      kcService.stubs.createUserKc.restore();
      sinon.assert.calledWithExactly(citizenRepository.stubs.create, sinon.match(arg));
      citizenRepository.stubs.create.restore();
      kcService.stubs.sendExecuteActionsEmailUserKc.restore();
    });

    it('CitizenController create etudiant keycloakResult undefined', async () => {
      kcService.stubs.createUserKc.resolves(undefined);

      const result = await controller.create(etudiant);

      expect(result).to.deepEqual(undefined);

      kcService.stubs.createUserKc.restore();
    });

    it('CitizenController findSalarie: error', async () => {
      try {
        citizenService.stubs.findEmployees.resolves({
          employees: [],
          employeesCount: 0,
        });
        await controller.findSalaries(AFFILIATION_STATUS.AFFILIATED);
      } catch (err) {
        expect(err).to.equal(true);
      }
    });

    it('CitizenController findSalarie: successful', async () => {
      citizenService.stubs.findEmployees.resolves({
        employees: [citizen],
        employeesCount: 1,
      });

      const result = await controller.findSalaries(AFFILIATION_STATUS.AFFILIATED);
      expect(result).to.deepEqual({employees: [citizen], employeesCount: 1});
    });

    it('CitizenController findById : successful', async () => {
      citizenRepository.stubs.findById.resolves(salarie);
      const result = await controller.findById('randomInputId');

      expect(result).to.deepEqual(salarie);
    });

    it('CitizenController findCitizenId : successful', async () => {
      userRepository.stubs.findById.resolves(user);
      citizenRepository.stubs.findById.resolves(mockCitizen);
      const result = await controller.findCitizenId('randomInputId');

      expect(result).to.deepEqual({lastName: 'Kenny', firstName: 'Gerard'});
    });

    it('CitizenController validateAffiliation : successful', async () => {
      const token = {token: 'montoken'};
      const citizen: any = {
        id: 'randomId',
        affiliation: {
          affiliationStatus: AFFILIATION_STATUS.TO_AFFILIATE,
        },
      };
      citizenService.stubs.checkAffiliation.resolves(citizen);
      citizenRepository.stubs.updateById.resolves();
      const result = await controller.validateAffiliation(token);

      expect(citizen.affiliation.affiliationStatus).to.equal(
        AFFILIATION_STATUS.AFFILIATED,
      );
      sinon.assert.calledOnceWithExactly(citizenRepository.stubs.updateById, citizen.id, {
        affiliation: citizen.affiliation,
      });
      expect(result).to.Null;
    });

    it('CitizenController validateAffiliation no token : error', async () => {
      const token: any = undefined;
      const expectedError = new ValidationError(
        'citizens.affiliation.not.found',
        '/citizensAffiliationNotFound',
        StatusCode.NotFound,
        ResourceName.Affiliation,
      );

      try {
        await controller.validateAffiliation(token);
        sinon.assert.fail();
      } catch (error) {
        expect(citizenRepository.stubs.updateById.notCalled).true();
        expect(citizenService.stubs.checkAffiliation.notCalled).true();
        expect(error).to.deepEqual(expectedError);
      }
    });

    it('CitizenController disaffiliation updateById : error', async () => {
      try {
        citizenRepository.stubs.findById.resolves(
          new Citizen({
            id: 'citizenId',
            affiliation: Object.assign({
              enterpriseEmail: 'user@example.com',
              enterpriseId: 'id',
              affiliationStatus: AFFILIATION_STATUS.AFFILIATED,
            }),
          }),
        );
        citizenRepository.stubs.updateById.rejects(new Error('Error'));
        await controller.disaffiliation('citizenId');
      } catch (error) {
        expect(citizenService.stubs.sendDisaffiliationMail.notCalled).true();
        expect(error).to.deepEqual(new Error('Error'));
      }
    });

    it('CitoyensController getCitizenWithDemandes : successful', () => {
      subscriptionService.stubs.getCitizensWithSubscription.resolves(mockSubscriptions);
      const citizensList = controller
        .getCitizensWithSubscriptions('', 0)
        .then(res => res)
        .catch(err => err);
      expect(citizensList).to.deepEqual(mockCitizens);
    });

    it('CitizenController disaffiliation : success', async () => {
      citizenRepository.stubs.findById.resolves(
        new Citizen({
          id: 'citizenId',
          affiliation: Object.assign({
            enterpriseEmail: 'user@example.com',
            enterpriseId: 'id',
            affiliationStatus: AFFILIATION_STATUS.AFFILIATED,
          }),
        }),
      );
      citizenRepository.stubs.updateById.resolves();
      citizenService.stubs.sendDisaffiliationMail.resolves();
      await controller.disaffiliation('citizenId');
      expect(citizenRepository.stubs.findById.called).true();
      expect(citizenRepository.stubs.updateById.called).true();
      expect(citizenService.stubs.sendDisaffiliationMail.called).true();
    });

    it('CitizenController updateById : successful', async () => {
      const newUserData: CitizenUpdate = {
        city: 'Paris',
        postcode: '75010',
        status: CITIZEN_STATUS.EMPLOYEE,
        affiliation: Object.assign({
          enterpriseId: '',
          enterpriseEmail: '',
        }),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      };

      citizenRepository.stubs.updateById.resolves();
      const result = await controller.updateById('randomInputId', newUserData);

      expect(result).to.deepEqual({
        id: 'randomInputId',
      });
    });

    it('CitizenController updateById user with affiliation data : successful', async () => {
      const newUserData: CitizenUpdate = {
        city: 'Paris',
        postcode: '75010',
        status: CITIZEN_STATUS.EMPLOYEE,
        affiliation: Object.assign({
          enterpriseId: 'enterpriseId',
          enterpriseEmail: 'enterpriseEmail@gmail.com',
          affiliationStatus: AFFILIATION_STATUS.TO_AFFILIATE,
        }),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      };

      enterpriseRepository.stubs.findById.resolves(enterprise);
      citizenRepository.stubs.updateById.resolves();
      citizenService.stubs.sendAffiliationMail.resolves();

      const result = await controller.updateById('randomInputId', newUserData);

      expect(result).to.deepEqual({
        id: 'randomInputId',
      });

      enterpriseRepository.stubs.findById.restore();
      citizenService.stubs.sendAffiliationMail.restore();
    });

    it('CitizenController updateById user with enterprise email only : successful', async () => {
      const newUserData: CitizenUpdate = {
        city: 'Paris',
        postcode: '75010',
        status: CITIZEN_STATUS.EMPLOYEE,
        affiliation: Object.assign({
          enterpriseId: '',
          enterpriseEmail: 'enterpriseEmail@gmail.com',
        }),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      };

      citizenRepository.stubs.updateById.resolves();

      const result = await controller.updateById('randomInputId', newUserData);

      expect(result).to.deepEqual({
        id: 'randomInputId',
      });
    });

    it('CitizenController updateById user with enterprise id only : successful', async () => {
      const newUserData: CitizenUpdate = {
        city: 'Paris',
        postcode: '75010',
        status: CITIZEN_STATUS.EMPLOYEE,
        affiliation: Object.assign({
          enterpriseId: 'enterpriseId',
          enterpriseEmail: '',
        }),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      };

      citizenRepository.stubs.updateById.resolves();

      const result = await controller.updateById('randomInputId', newUserData);

      expect(result).to.deepEqual({
        id: 'randomInputId',
      });
    });

    it('CitoyensController generateUserRGPDExcelFile : successful', async () => {
      const workbook = new Excel.Workbook();
      citizenService.stubs.generateExcelRGPD.resolves(await workbook.xlsx.writeBuffer());
      citizenRepository.stubs.findById.resolves(mockCitizen);
      enterpriseRepository.stubs.findById.resolves(mockEnterprise);
      incentivesRepository.stubs.find.resolves([]);
      subscriptionsRepository.stubs.find.resolves([]);
      const response: any = {
        status: function () {
          return this;
        },
        contentType: function () {
          return this;
        },
        send: (buffer: Buffer) => buffer,
      };
      try {
        const result = await controller.generateUserRGPDExcelFile(
          'randomInputId',
          response,
        );
        expect(result).to.be.instanceOf(Buffer);
      } catch (error) {
        sinon.assert.fail();
      }
    });

    it('CitizenController deleteCitizenAccount : successful', async () => {
      // Stub method
      citizenRepository.stubs.findById.withArgs('randomInputId').resolves(mockCitizen);
      citizenRepository.stubs.deleteById.resolves();
      kcService.stubs.deleteUserKc.resolves({
        id: 'randomInputId',
      });
      subscriptionsRepository.stubs.find.resolves([subscription]);
      subscriptionsRepository.stubs.updateById.resolves();
      citizenService.stubs.sendDeletionMail.resolves();
      const result = await controller.deleteCitizenAccount('randomInputId');
      // // Checks
      expect(citizenRepository.stubs.findById.called).true();
      expect(citizenRepository.stubs.deleteById.called).true();
      expect(kcService.stubs.deleteUserKc.called).true();
      expect(citizenService.stubs.sendDeletionMail.called).true();
      expect(result).to.Null;
    });

    it('CitizenController findConsentsById : successful', async () => {
      const expected = [
        {
          clientId: 'simulation-maas-client',
          name: 'simulation maas client',
        },
        {
          clientId: 'mulhouse-maas-client',
          name: 'mulhouse maas client',
        },
      ];
      kcService.stubs.listConsents.resolves(consents);
      citizenService.stubs.getClientList.resolves(clients);

      const result = await controller.findConsentsById('randomId');

      expect(result).to.deepEqual(expected);

      kcService.stubs.listConsents.restore();
      citizenService.stubs.getClientList.restore();
    });

    it('CitizenController deleteConsentById : successful', async () => {
      kcService.stubs.deleteConsent.resolves();

      await controller.deleteConsentById('randomId', 'randomClientId');

      expect(kcService.stubs.deleteConsent.onCall(1));

      kcService.stubs.deleteConsent.restore();
    });
  });

  function givenStubbedRepository() {
    citizenRepository = createStubInstance(CitizenRepository);
    funderService = createStubInstance(FunderService);
    enterpriseRepository = createStubInstance(EnterpriseRepository);
    userRepository = createStubInstance(UserRepository);
    incentivesRepository = createStubInstance(IncentiveRepository);
    subscriptionsRepository = createStubInstance(SubscriptionRepository);

    currentUserProfile = {
      id: 'idUser',
      clientName: 'testName-client',
      token: '',
      emailVerified: true,
      roles: ['gestionnaires'],
      [securityId]: 'testId',
    };
  }

  function givenStubbedService() {
    kcService = createStubInstance(KeycloakService);
    citizenService = createStubInstance(CitizenService);
    subscriptionService = createStubInstance(SubscriptionService);
  }
});

const consents = [
  {
    clientId: 'simulation-maas-client',
  },
  {
    clientId: 'mulhouse-maas-client',
  },
];

const clients = [
  {
    name: 'simulation maas client',
    clientId: 'simulation-maas-client',
  },
  {
    name: 'mulhouse maas client',
    clientId: 'mulhouse-maas-client',
  },
  {
    name: 'paris maas client',
    clientId: 'paris-maas-client',
  },
];

const user = new User({
  id: 'idUser',
  email: 'random@random.fr',
  firstName: 'firstName',
  lastName: 'lastName',
  funderId: 'someFunderId',
  roles: ['gestionnaires'],
  communityIds: ['id1', 'id2'],
});

const citizen = new Citizen({
  firstName: 'Xina',
  lastName: 'Zhong',
});

const mockCitizen = new Citizen({
  id: 'randomInputId',
  email: 'kennyg@gmail.com',
  firstName: 'Gerard',
  lastName: 'Kenny',
  birthdate: '1994-02-18T00:00:00.000Z',
  city: 'Mulhouse',
  postcode: '75000',
  status: CITIZEN_STATUS.EMPLOYEE,
  tos1: true,
  tos2: true,
  affiliation: Object.assign({
    enterpriseId: 'someFunderId',
    enterpriseEmail: 'walid.housni@adevinta.com',
    affiliationStatus: AFFILIATION_STATUS.AFFILIATED,
  }),
});

const mockEnterprise = new Enterprise({
  id: 'randomInputIdEntreprise',
  emailFormat: ['test@outlook.com', 'test@outlook.fr', 'test@outlook.xxx'],
  name: 'nameEntreprise',
  siretNumber: 50,
  budgetAmount: 102,
  employeesCount: 100,
});
const mockCitizens: Promise<AnyObject> = new Promise(() => {
  return [
    {
      citizensData: [
        {
          citizenId: '260a6356-3261-4335-bca8-4c1f8257613d',
          lastName: 'leYellow',
          firstName: 'Bob',
        },
      ],
      totalCitizens: 1,
    },
  ];
});

const mockSubscriptions: Record<string, unknown>[] = [
  {
    id: 'randomInputId',
    incentiveId: 'incentiveId',
    funderName: 'funderName',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    incentiveTitle: 'incentiveTitle',
    citizenId: 'email@gmail.com',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
    incentiveTransportList: ['vélo'],
    consent: true,
    specificFields: [
      {
        title: 'newField1',
        inputFormat: 'listeChoix',
        choiceList: {
          possibleChoicesNumber: 2,
          inputChoiceList: [
            {
              inputChoice: 'newField1',
            },
            {
              inputChoice: 'newField11',
            },
          ],
        },
      },
      {
        title: 'newField2',
        inputFormat: 'Texte',
      },
    ],
    status: SUBSCRIPTION_STATUS.VALIDATED,
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  },
  {
    id: 'randomInputId1',
    incentiveId: 'incentiveId',
    funderName: 'funderName',
    incentiveType: INCENTIVE_TYPE.TERRITORY_INCENTIVE,
    incentiveTitle: 'incentiveTitle',
    citizenId: 'email@gmail.com',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
    incentiveTransportList: ['vélo'],
    consent: true,
    specificFields: [
      {
        title: 'newField1',
        inputFormat: 'listeChoix',
        choiceList: {
          possibleChoicesNumber: 2,
          inputChoiceList: [
            {
              inputChoice: 'newField1',
            },
            {
              inputChoice: 'newField11',
            },
          ],
        },
      },
      {
        title: 'newField2',
        inputFormat: 'Texte',
      },
    ],
    status: SUBSCRIPTION_STATUS.VALIDATED,
    createdAt: new Date('2021-04-06T09:01:30.778Z'),
    updatedAt: new Date('2021-04-06T09:01:30.778Z'),
  },
];

const subscription = new Subscription({
  id: 'randomInputId',
  incentiveId: 'randomInputId',
  funderName: 'Capgemini',
  incentiveType: 'AideEmployeur',
  incentiveTitle: 'Covoiturez à Mulhouse',
  incentiveTransportList: ['covoiturage'],
  citizenId: 'randomInputId',
  lastName: 'térieur',
  firstName: 'alain',
  email: 'email.salarie@yopmail.com',
  city: "L'eau Sangèles",
  postcode: '99000',
  birthdate: '1970-01-01T00:00:00.000Z',
  communityId: 'randomInputId',
  consent: true,
  status: SUBSCRIPTION_STATUS.TO_PROCESS,
  attachments: undefined,
  createdAt: new Date('2022-04-26T15:17:23.531Z'),
  updatedAt: new Date('2022-04-26T15:17:30.672Z'),
  funderId: 'randomInputId',
  subscriptionValidation: undefined,
  subscriptionRejection: undefined,
  specificFields: undefined,
  isCitizenDeleted: false,
  enterpriseEmail: 'salarie.mcm.pro@yopmail.com',
});
