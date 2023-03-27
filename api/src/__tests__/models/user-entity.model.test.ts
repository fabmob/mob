import {expect} from '@loopback/testlab';
import {Citizen, UserAttribute, UserEntity} from '../../models';
import {CITIZEN_STATUS, GENDER} from '../../utils';

describe('User Entity model', () => {
  it('toCitizen with user attributes', () => {
    const timestampMock = Date.now();
    const udpatedAtMock = new Date();

    const inputIdentity: any = {
      gender: {
        value: 1,
        source: 'moncomptemobilite.fr',
        certificationDate: '2022-10-24T00:00:00.000Z',
      },
      firstName: {
        value: 'firstName',
        source: 'moncomptemobilite.fr',
        certificationDate: '2022-10-24T00:00:00.000Z',
      },
      lastName: {
        value: 'lastName',
        source: 'moncomptemobilite.fr',
        certificationDate: '2022-10-24T00:00:00.000Z',
      },
      birthDate: {
        value: '1991-11-17',
        source: 'moncomptemobilite.fr',
        certificationDate: '2022-10-24T00:00:00.000Z',
      },
    };
    const inputPersonalInformation: any = {
      email: {
        value: 'email@gmail.com',
        source: 'moncomptemobilite.fr',
        certificationDate: new Date('2022-10-24'),
      },
    };

    const expectedCitizen: Citizen = Object.assign(new Citizen(), {
      id: 'randomInputId',
      birthdate: '1991-11-17',
      gender: 'male',
      emailTemplate: 'citoyen',
      identity: {
        gender: {
          value: 1,
          source: 'moncomptemobilite.fr',
          certificationDate: '2022-10-24T00:00:00.000Z',
        },
        firstName: {
          value: 'firstName',
          source: 'moncomptemobilite.fr',
          certificationDate: '2022-10-24T00:00:00.000Z',
        },
        lastName: {
          value: 'lastName',
          source: 'moncomptemobilite.fr',
          certificationDate: '2022-10-24T00:00:00.000Z',
        },
        birthDate: {
          value: '1991-11-17',
          source: 'moncomptemobilite.fr',
          certificationDate: '2022-10-24T00:00:00.000Z',
        },
      },
      personalInformation: {
        email: {
          value: 'email@gmail.com',
          source: 'moncomptemobilite.fr',
          certificationDate: '2022-10-24T00:00:00.000Z',
        },
      },
      city: 'test',
      status: CITIZEN_STATUS.STUDENT,
      terms_and_conditions: timestampMock.toString(),
      postcode: '31000',
      tos1: 'true',
      tos2: 'true',
      udpatedAt: udpatedAtMock.toDateString(),
    });

    const userEntity: UserEntity = new UserEntity({
      id: 'randomInputId',
      lastName: 'lastName',
      firstName: 'firstName',
      email: 'email@gmail.com',
      username: 'email@gmail.com',
      userAttributes: [
        new UserAttribute({
          name: 'emailTemplate',
          value: 'citoyen',
        }),
        new UserAttribute({
          name: 'birthdate',
          value: '1991-11-17',
        }),
        new UserAttribute({
          name: 'gender',
          value: GENDER.MALE,
        }),
        new UserAttribute({
          name: 'identity.gender',
          value: JSON.stringify(inputIdentity.gender),
        }),
        new UserAttribute({
          name: 'identity.lastName',
          value: JSON.stringify(inputIdentity.lastName),
        }),
        new UserAttribute({
          name: 'identity.firstName',
          value: JSON.stringify(inputIdentity.firstName),
        }),
        new UserAttribute({
          name: 'identity.birthDate',
          value: JSON.stringify(inputIdentity.birthDate),
        }),
        new UserAttribute({
          name: 'personalInformation.email',
          value: JSON.stringify(inputPersonalInformation.email),
        }),
        new UserAttribute({
          name: 'notInCMSType.email',
          value: 'not a cms type',
        }),
        new UserAttribute({
          name: 'city',
          value: 'test',
        }),
        new UserAttribute({
          name: 'postcode',
          value: '31000',
        }),
        new UserAttribute({
          name: 'status',
          value: CITIZEN_STATUS.STUDENT,
        }),
        new UserAttribute({
          name: 'terms_and_conditions',
          value: timestampMock.toString(),
        }),
        new UserAttribute({
          name: 'tos1',
          value: 'true',
        }),
        new UserAttribute({
          name: 'tos2',
          value: 'true',
        }),
        new UserAttribute({
          name: 'udpatedAt',
          value: udpatedAtMock.toDateString(),
        }),
      ],
    });

    const citizenResult: Citizen = userEntity.toCitizen();

    expect(citizenResult).to.deepEqual(expectedCitizen);
  });

  it('toCitizen with no user attributes', () => {
    const userEntity: UserEntity = new UserEntity({
      id: 'randomInputId',
      lastName: 'lastName',
      firstName: 'firstName',
      email: 'email@gmail.com',
      username: 'email@gmail.com',
      userAttributes: undefined,
    });

    const citizenResult: Citizen = userEntity.toCitizen();

    expect(citizenResult).to.deepEqual(new Citizen({id: 'randomInputId'}));
  });
});
