import {expect, sinon} from '@loopback/testlab';
import UserRepresentation from 'keycloak-admin/lib/defs/userRepresentation';
import {Citizen} from '../../models';
import {CITIZEN_STATUS, GENDER} from '../../utils';

describe('Citizen model', () => {
  it('toUserRepresentation gender male', () => {
    const timestampMock = Date.now();
    const timestampFakeTimer = sinon.useFakeTimers(timestampMock);
    try {
      const citizen: Citizen = Object.assign(new Citizen(), {
        id: 'randomInputId',
        identity: {
          gender: {
            value: 1,
            source: 'moncomptemobilite.fr',
            certificationDate: new Date('2022-10-24'),
          },
          firstName: {
            value: 'firstName',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date('2022-10-24'),
          },
          lastName: {
            value: 'lastName',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date('2022-10-24'),
          },
          birthDate: {
            value: '1991-11-17',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date('2022-10-24'),
          },
        },
        personalInformation: {
          email: {
            value: 'email@gmail.com',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date('2022-10-24'),
          },
        },
        city: 'test',
        status: CITIZEN_STATUS.STUDENT,
        postcode: '31000',
        tos1: true,
        tos2: true,
        lastLoginAt: timestampMock,
      });

      const userRepresentationResult: UserRepresentation = citizen.toUserRepresentation();

      const expectedUserRepresentation: UserRepresentation = {
        username: 'email@gmail.com',
        email: 'email@gmail.com',
        firstName: 'firstName',
        lastName: 'lastName',
        attributes: {
          emailTemplate: 'citoyen',
          birthdate: '1991-11-17',
          gender: GENDER.MALE,
          'identity.gender': JSON.stringify(citizen.identity.gender),
          'identity.lastName': JSON.stringify(citizen.identity.lastName),
          'identity.firstName': JSON.stringify(citizen.identity.firstName),
          'identity.birthDate': JSON.stringify(citizen.identity.birthDate),
          'identity.birthPlace': undefined,
          'identity.birthCountry': undefined,
          'personalInformation.email': JSON.stringify(citizen.personalInformation.email),
          'personalInformation.primaryPhoneNumber': undefined,
          'personalInformation.secondaryPhoneNumber': undefined,
          'personalInformation.primaryPostalAddress': undefined,
          'personalInformation.secondaryPostalAddress': undefined,
          city: 'test',
          postcode: '31000',
          status: 'etudiant',
          terms_and_conditions: timestampMock,
          tos1: true,
          tos2: true,
          updatedAt: timestampMock,
          lastLoginAt: timestampMock,
          isInactivityNotificationSent: undefined,
        },
      };
      expect(userRepresentationResult).to.deepEqual(expectedUserRepresentation);
      timestampFakeTimer.restore();
    } catch (error) {
      timestampFakeTimer.restore();
      sinon.assert.fail();
    }
  });

  it('toUserRepresentation gender female', () => {
    const timestampMock = Date.now();
    const timestampFakeTimer = sinon.useFakeTimers(timestampMock);
    try {
      const citizen: Citizen = Object.assign(new Citizen(), {
        id: 'randomInputId',
        identity: {
          gender: {
            value: 2,
            source: 'moncomptemobilite.fr',
            certificationDate: new Date('2022-10-24'),
          },
          firstName: {
            value: 'firstName',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date('2022-10-24'),
          },
          lastName: {
            value: 'lastName',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date('2022-10-24'),
          },
          birthDate: {
            value: '1991-11-17',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date('2022-10-24'),
          },
        },
        personalInformation: {
          email: {
            value: 'email@gmail.com',
            source: 'moncomptemobilite.fr',
            certificationDate: new Date('2022-10-24'),
          },
        },
        city: 'test',
        status: CITIZEN_STATUS.STUDENT,
        postcode: '31000',
        tos1: true,
        tos2: true,
        lastLoginAt: timestampMock,
      });

      const userRepresentationResult: UserRepresentation = citizen.toUserRepresentation();

      const expectedUserRepresentation: UserRepresentation = {
        username: 'email@gmail.com',
        email: 'email@gmail.com',
        firstName: 'firstName',
        lastName: 'lastName',
        attributes: {
          emailTemplate: 'citoyen',
          birthdate: '1991-11-17',
          gender: GENDER.FEMALE,
          'identity.gender': JSON.stringify(citizen.identity.gender),
          'identity.lastName': JSON.stringify(citizen.identity.lastName),
          'identity.firstName': JSON.stringify(citizen.identity.firstName),
          'identity.birthDate': JSON.stringify(citizen.identity.birthDate),
          'identity.birthPlace': undefined,
          'identity.birthCountry': undefined,
          'personalInformation.email': JSON.stringify(citizen.personalInformation.email),
          'personalInformation.primaryPhoneNumber': undefined,
          'personalInformation.secondaryPhoneNumber': undefined,
          'personalInformation.primaryPostalAddress': undefined,
          'personalInformation.secondaryPostalAddress': undefined,
          city: 'test',
          postcode: '31000',
          status: 'etudiant',
          terms_and_conditions: timestampMock,
          tos1: true,
          tos2: true,
          updatedAt: timestampMock,
          lastLoginAt: timestampMock,
          isInactivityNotificationSent: undefined,
        },
      };
      expect(userRepresentationResult).to.deepEqual(expectedUserRepresentation);
      timestampFakeTimer.restore();
    } catch (error) {
      timestampFakeTimer.restore();
      sinon.assert.fail();
    }
  });
});
