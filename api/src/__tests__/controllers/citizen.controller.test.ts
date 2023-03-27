import * as Excel from 'exceljs';
import {createStubInstance, expect, sinon, StubbedInstanceWithSinonAccessor} from '@loopback/testlab';
import {securityId} from '@loopback/security';
import {AnyObject} from '@loopback/repository';

import {
  CommunityRepository,
  IncentiveRepository,
  SubscriptionRepository,
  AffiliationRepository,
  FunderRepository,
} from '../../repositories';
import {CitizenController} from '../../controllers';
import {
  CitizenService,
  KeycloakService,
  JwtService,
  MailService,
  SubscriptionService,
  AffiliationService,
} from '../../services';
import {
  AFFILIATION_STATUS,
  CITIZEN_STATUS,
  SUBSCRIPTION_STATUS,
  INCENTIVE_TYPE,
  IUser,
  StatusCode,
} from '../../utils';
import {Citizen, CitizenUpdate, Subscription, Affiliation, Enterprise, EnterpriseDetails} from '../../models';

describe('CitizenController (unit)', () => {
  let communityRepository: StubbedInstanceWithSinonAccessor<CommunityRepository>,
    mailService: StubbedInstanceWithSinonAccessor<MailService>,
    funderRepository: StubbedInstanceWithSinonAccessor<FunderRepository>,
    kcService: StubbedInstanceWithSinonAccessor<KeycloakService>,
    citizenService: StubbedInstanceWithSinonAccessor<CitizenService>,
    subscriptionService: StubbedInstanceWithSinonAccessor<SubscriptionService>,
    currentUserProfile: IUser,
    jwtService: StubbedInstanceWithSinonAccessor<JwtService>,
    subscriptionsRepository: StubbedInstanceWithSinonAccessor<SubscriptionRepository>,
    incentivesRepository: StubbedInstanceWithSinonAccessor<IncentiveRepository>,
    affiliationRepository: StubbedInstanceWithSinonAccessor<AffiliationRepository>,
    affiliationService: StubbedInstanceWithSinonAccessor<AffiliationService>,
    controller: CitizenController;

  const salarie = Object.assign(new Citizen(), {
    id: 'randomInputId',
    lastName: 'lastName',
    firstName: 'firstName',
    email: 'email@gmail.com',
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

  const enterprise: Enterprise = new Enterprise({
    name: 'enterprise',
    enterpriseDetails: new EnterpriseDetails({
      emailDomainNames: ['@gmail.com', 'rr'],
    }),
  });

  const response: any = {
    status: function () {
      return this;
    },
    contentType: function () {
      return this;
    },
    send: (body: any) => body,
  };

  beforeEach(() => {
    givenStubbedRepository();
    givenStubbedService();
    controller = new CitizenController(
      response,
      mailService,
      communityRepository,
      kcService,
      funderRepository,
      citizenService,
      subscriptionService,
      jwtService,
      currentUserProfile,
      subscriptionsRepository,
      incentivesRepository,
      affiliationRepository,
      affiliationService,
    );
  });

  describe('CitizenController', () => {
    it('CitizenController create : ERROR', async () => {
      citizenService.stubs.createCitizen.rejects(new Error('Error'));

      try {
        await controller.create(salarie);
      } catch (err) {
        expect(err.message).to.equal('Error');
      }
    });

    it('CitizenController create salarie : successful', async () => {
      citizenService.stubs.createCitizen.resolves({
        id: 'randomInputId',
      });

      const result = await controller.create(salarie);

      expect(result).to.deepEqual({
        id: 'randomInputId',
      });
    });

    it('CitizenController validateAffiliation : ERROR', async () => {
      const token = {token: 'montoken'};
      const citizen: any = {
        id: 'randomId',
        affiliation: {
          id: 'randomAffiliationId',
          status: AFFILIATION_STATUS.TO_AFFILIATE,
        },
      };
      citizenService.stubs.getCitizenWithAffiliationById.rejects(new Error('Error'));

      try {
        await controller.validateAffiliation(citizen.id, token);
      } catch (err) {
        expect(err.message).to.equal('Error');
      }
    });

    it('CitizenController validateAffiliation : successful', async () => {
      const token = {token: 'montoken'};
      const citizen: any = {
        id: 'randomId',
        affiliation: {
          id: 'randomAffiliationId',
          status: AFFILIATION_STATUS.TO_AFFILIATE,
        },
      };
      citizenService.stubs.getCitizenWithAffiliationById.resolves(citizen);
      affiliationService.stubs.checkAffiliation.resolves(citizen);
      affiliationRepository.stubs.updateById.resolves();

      const result = await controller.validateAffiliation(citizen.id, token);

      sinon.assert.calledOnceWithExactly(affiliationRepository.stubs.updateById, citizen.affiliation.id, {
        status: AFFILIATION_STATUS.AFFILIATED,
      });

      expect(affiliationService.stubs.sendValidatedAffiliation.called).true();
      expect(result).to.Null;
    });

    it('CitizenController validateAffiliation : successful token', async () => {
      const salarie: IUser = {
        id: '',
        clientName: 'testName-client',
        token: '',
        emailVerified: true,
        roles: ['gestionnaires'],
        [securityId]: 'testId',
      };
      const controller = new CitizenController(
        response,
        mailService,
        communityRepository,
        kcService,
        funderRepository,
        citizenService,
        subscriptionService,
        jwtService,
        salarie,
        subscriptionsRepository,
        incentivesRepository,
        affiliationRepository,
        affiliationService,
      );

      const token = {token: 'montoken'};
      const citizen: any = {
        id: 'randomId',
        affiliation: {
          id: 'randomAffiliationId',
          status: AFFILIATION_STATUS.TO_AFFILIATE,
        },
      };
      const citizenId: string = citizen.id;
      citizenService.stubs.getCitizenWithAffiliationById.resolves(citizen);
      affiliationService.stubs.checkAffiliation.resolves(citizen);
      affiliationRepository.stubs.updateById.resolves();
      const result = await controller.validateAffiliation(citizenId, token);

      sinon.assert.calledOnceWithExactly(affiliationRepository.stubs.updateById, citizen.affiliation.id, {
        status: AFFILIATION_STATUS.AFFILIATED,
      });
      expect(result).to.Null;
    });

    it('CitizenController validateAffiliation no token : error', async () => {
      const token: any = undefined;
      const citizenId: string = '';
      const citizen: any = {
        id: 'randomId',
        affiliation: {
          id: 'randomAffiliationId',
          status: AFFILIATION_STATUS.TO_AFFILIATE,
        },
      };
      try {
        citizenService.stubs.getCitizenWithAffiliationById.resolves(citizen);
        await controller.validateAffiliation(citizenId, token);
        sinon.assert.fail();
        expect(affiliationRepository.stubs.updateById.called).true();
        expect(affiliationService.stubs.checkAffiliation.called).true();
      } catch (err) {
        null;
      }
    });

    it('CitizenController disaffiliation updateById : error', async () => {
      try {
        citizenService.stubs.getCitizenWithAffiliationById.resolves(
          new Citizen({
            id: 'citizenId',
            affiliation: Object.assign({
              enterpriseEmail: 'user@example.com',
              enterpriseId: 'id',
              status: AFFILIATION_STATUS.AFFILIATED,
            }),
          }),
        );
        affiliationRepository.stubs.updateById.rejects(new Error('Error'));
        await controller.disaffiliation('citizenId');
      } catch (error) {
        expect(affiliationService.stubs.sendDisaffiliationMail.notCalled).true();
        expect(error).to.deepEqual(new Error('Error'));
      }
    });

    it('CitizenController disaffiliation : success', async () => {
      citizenService.stubs.getCitizenWithAffiliationById.resolves(
        new Citizen({
          id: 'citizenId',
          affiliation: Object.assign({
            enterpriseEmail: 'user@example.com',
            enterpriseId: 'id',
            status: AFFILIATION_STATUS.AFFILIATED,
          }),
        }),
      );
      affiliationRepository.stubs.updateById.resolves();
      affiliationService.stubs.sendDisaffiliationMail.resolves();
      await controller.disaffiliation('citizenId');
      expect(citizenService.stubs.getCitizenWithAffiliationById.called).true();
      expect(affiliationRepository.stubs.updateById.called).true();
      expect(affiliationService.stubs.sendDisaffiliationMail.called).true();
    });

    it('CitizenController rejected affiliation : success and send rejection mail', async () => {
      citizenService.stubs.getCitizenWithAffiliationById.resolves(
        new Citizen({
          id: 'citizenId',
          affiliation: Object.assign({
            enterpriseEmail: 'user@example.com',
            enterpriseId: 'id',
            status: AFFILIATION_STATUS.TO_AFFILIATE,
          }),
        }),
      );
      affiliationRepository.stubs.updateById.resolves();
      affiliationService.stubs.sendRejectedAffiliation.resolves();
      await controller.disaffiliation('citizenId');
      expect(citizenService.stubs.getCitizenWithAffiliationById.called).true();
      expect(affiliationService.stubs.sendRejectedAffiliation.called).true();
    });

    it('CitizenController updateById : ERROR', async () => {
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
      citizenService.stubs.getCitizenWithAffiliationById.rejects(new Error('Error'));

      try {
        await controller.updateById('randomInputId', newUserData);
      } catch (err) {
        expect(err.message).to.equal('Error');
      }
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
      citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizen);
      kcService.stubs.updateUserKC.resolves();
      affiliationRepository.stubs.updateById.resolves();

      await controller.updateById('randomInputId', newUserData);

      expect(kcService.stubs.updateUserKC.called).true();
    });

    it('CitizenController updateById user with affiliation data : successful', async () => {
      const newUserData: CitizenUpdate = {
        city: 'Paris',
        postcode: '75010',
        status: CITIZEN_STATUS.EMPLOYEE,
        affiliation: Object.assign({
          enterpriseId: 'enterpriseId',
          enterpriseEmail: 'enterpriseEmail@gmail.com',
          status: AFFILIATION_STATUS.TO_AFFILIATE,
        }),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      };

      kcService.stubs.updateUserKC.resolves();
      funderRepository.stubs.getEnterpriseById.resolves(enterprise);
      citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizen);
      affiliationRepository.stubs.updateById.resolves();
      affiliationService.stubs.sendAffiliationMail.resolves();

      await controller.updateById('randomInputId', newUserData);

      expect(kcService.stubs.updateUserKC.called).true();
      expect(affiliationService.stubs.sendAffiliationMail.called).true();

      funderRepository.stubs.getEnterpriseById.restore();
      affiliationService.stubs.sendAffiliationMail.restore();
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

      kcService.stubs.updateUserKC.resolves();

      citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizen);

      await controller.updateById('randomInputId', newUserData);

      expect(kcService.stubs.updateUserKC.called).true();
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
      kcService.stubs.updateUserKC.resolves();

      citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizen);
      funderRepository.stubs.getEnterpriseById.resolves(mockEnterprise);

      await controller.updateById('randomInputId', newUserData);
      expect(kcService.stubs.updateUserKC.called).true();
    });

    it('CitizenController updateById user without affiliation data : successful', async () => {
      const newUserData: CitizenUpdate = {
        city: 'Paris',
        postcode: '75010',
        status: CITIZEN_STATUS.EMPLOYEE,
        affiliation: Object.assign({
          enterpriseId: null,
          enterpriseEmail: null,
          status: AFFILIATION_STATUS.UNKNOWN,
        }),
        toJSON: () => ({id: 'random'}),
        toObject: () => ({id: 'random'}),
      };

      const mockCitizenWithoutAffiliation = new Citizen({
        id: 'randomInputId',
        identity: Object.assign({
          firstName: Object.assign({
            value: 'Gerard',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date(),
          }),
          lastName: Object.assign({
            value: 'Kenny',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date(),
          }),
          birthDate: Object.assign({
            value: '1994-02-18T00:00:00.000Z',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date(),
          }),
        }),
        personalInformation: Object.assign({
          email: Object.assign({
            value: 'test@test.com',
            certificationDate: new Date('2022-11-03'),
            source: 'moncomptemobilite.fr',
          }),
        }),
        city: 'Mulhouse',
        postcode: '75000',
        status: CITIZEN_STATUS.EMPLOYEE,
      });

      kcService.stubs.updateUserKC.resolves();
      citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizenWithoutAffiliation as Citizen);
      affiliationRepository.stubs.createAffiliation.resolves({
        id: 'affiliationId',
        citizenId: 'randomInputId',
        enterpriseEmail: null,
        enterpriseId: null,
        status: AFFILIATION_STATUS.UNKNOWN,
      } as Affiliation);

      await controller.updateById('randomInputId', newUserData);

      expect(kcService.stubs.updateUserKC.called).true();
      expect(affiliationService.stubs.sendAffiliationMail.called).false();
      expect(affiliationRepository.stubs.updateById.called).false();

      funderRepository.stubs.getEnterpriseById.restore();
      citizenService.stubs.getCitizenWithAffiliationById.restore();
      affiliationRepository.stubs.createAffiliation.restore();
    });

    it('CitoyensController generateUserRGPDExcelFile : successful', async () => {
      const workbook = new Excel.Workbook();
      citizenService.stubs.generateExcelGDPR.resolves(await workbook.xlsx.writeBuffer());
      citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizen);
      funderRepository.stubs.getEnterpriseById.resolves(mockEnterprise);
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
        const result = await controller.generateUserRGPDExcelFile('randomInputId', response);
        expect(result).to.be.instanceOf(Buffer);
      } catch (error) {
        sinon.assert.fail();
      }
    });

    it('CitoyensController generateUserRGPDExcelFile : fail', async () => {
      const workbook = new Excel.Workbook();
      citizenService.stubs.generateExcelGDPR.resolves(await workbook.xlsx.writeBuffer());
      citizenService.stubs.getCitizenWithAffiliationById.resolves(mockCitizen);
      funderRepository.stubs.getEnterpriseById.resolves(mockEnterprise);
      incentivesRepository.stubs.find.resolves([]);
      subscriptionsRepository.stubs.find.rejects([]);
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
        const result = await controller.generateUserRGPDExcelFile('randomInputId', response);
        expect(result).to.be.instanceOf(Buffer);
      } catch (error) {
        expect(error.message).equal('Error');
        expect(error.statusCode).equal(StatusCode.InternalServerError);
      }
    });

    it('CitizenController deleteCitizenAccount : successful', async () => {
      // Stub method
      citizenService.stubs.getCitizenWithAffiliationById.withArgs('randomInputId').resolves(mockCitizen);
      affiliationRepository.stubs.deleteById.resolves();
      kcService.stubs.deleteUserKc.resolves({
        id: 'randomInputId',
      });
      subscriptionsRepository.stubs.find.resolves([subscription]);
      subscriptionsRepository.stubs.updateById.resolves();
      citizenService.stubs.sendDeletionMail.resolves();
      const result = await controller.deleteCitizenAccount('randomInputId');
      // Checks
      expect(citizenService.stubs.getCitizenWithAffiliationById.called).true();
      expect(affiliationRepository.stubs.deleteById.called).true();
      expect(kcService.stubs.deleteUserKc.called).true();
      expect(citizenService.stubs.sendDeletionMail.called).true();
      expect(result).to.Null;
    });

    it('CitizenController deleteCitizenAccount : fail', async () => {
      try {
        await controller.deleteCitizenAccount('randomInputId');
      } catch (error) {
        expect(error.message).equal("Cannot read properties of undefined (reading 'affiliation')");
      }
    });
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

  it('CitizenController findConsentsById : fail', async () => {
    try {
      kcService.stubs.listConsents.rejects();

      await controller.findConsentsById('randomId');
    } catch (error) {
      expect(error.message).equal('Error');
    }
    kcService.stubs.listConsents.restore();
  });

  it('CitizenController deleteConsentById : successful', async () => {
    kcService.stubs.deleteConsent.resolves();

    await controller.deleteConsentById('randomId', 'randomClientId');

    expect(kcService.stubs.deleteConsent.onCall(1));

    kcService.stubs.deleteConsent.restore();
  });

  it('CitizenController deleteConsentById : fail', async () => {
    try {
      kcService.stubs.deleteConsent.rejects();
      await controller.deleteConsentById('randomId', 'randomClientId');
    } catch (error) {
      expect(error.message).equal('Error');
    }
  });

  it('CitizenController findById : fail', async () => {
    try {
      citizenService.stubs.getCitizenByFilter.rejects();
      await controller.findById('randomId');
    } catch (error) {
      expect(error.message).equal('Error');
    }
  });

  it('CitizenController findById : success', async () => {
    citizenService.stubs.getCitizenByFilter.resolves(mockCitizen);
    const result = await controller.findById('randomId');
    expect(result).to.deepEqual(mockCitizen);
  });

  function givenStubbedRepository() {
    funderRepository = createStubInstance(FunderRepository);
    incentivesRepository = createStubInstance(IncentiveRepository);
    subscriptionsRepository = createStubInstance(SubscriptionRepository);
    affiliationRepository = createStubInstance(AffiliationRepository);

    currentUserProfile = {
      id: 'idUser',
      clientName: 'testName-client',
      token: '',
      funderName: 'funderName',
      emailVerified: true,
      roles: ['gestionnaires'],
      [securityId]: 'testId',
    };
  }

  function givenStubbedService() {
    kcService = createStubInstance(KeycloakService);
    citizenService = createStubInstance(CitizenService);
    subscriptionService = createStubInstance(SubscriptionService);
    affiliationService = createStubInstance(AffiliationService);
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

const citizen = new Citizen({
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
});

const mockCitizen = new Citizen({
  id: 'randomInputId',
  identity: Object.assign({
    firstName: Object.assign({
      value: 'Gerard',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
    lastName: Object.assign({
      value: 'Kenny',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
    birthDate: Object.assign({
      value: '1994-02-18T00:00:00.000Z',
      source: 'moncomptemobilite.fr',
      certificationDate: new Date(),
    }),
  }),
  personalInformation: Object.assign({
    email: Object.assign({
      value: 'test@test.com',
      certificationDate: new Date('2022-11-03'),
      source: 'moncomptemobilite.fr',
    }),
  }),
  city: 'Mulhouse',
  postcode: '75000',
  status: CITIZEN_STATUS.EMPLOYEE,
  tos1: true,
  tos2: true,
  affiliation: Object.assign({
    enterpriseId: 'someFunderId',
    enterpriseEmail: 'walid.housni@adevinta.com',
    status: AFFILIATION_STATUS.AFFILIATED,
  }),
});

const mockEnterprise = new Enterprise({
  id: 'randomInputIdEntreprise',
  name: 'nameEntreprise',
  siretNumber: 50,
  mobilityBudget: 102,
  citizensCount: 100,
  enterpriseDetails: new EnterpriseDetails({
    emailDomainNames: ['test@outlook.com', 'test@outlook.fr', 'test@outlook.xxx'],
    hasManualAffiliation: true,
  }),
});

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
