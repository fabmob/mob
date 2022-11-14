import {
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';

import {KeycloakService} from '../../services';
import {ValidationError} from '../../validationError';
import {GROUPS, StatusCode} from '../../utils';
import {KeycloakGroupRepository} from '../../repositories';

describe('keycloak services', () => {
  let kc: any = null;
  const errorMessageUser = new ValidationError('cannot connect to IDP or add user', '');

  const errorMessageGroup = new ValidationError('cannot connect to IDP or add group', '');

  let keycloakGroupRepository: StubbedInstanceWithSinonAccessor<KeycloakGroupRepository>;

  beforeEach(() => {
    keycloakGroupRepository = createStubInstance(KeycloakGroupRepository);
    kc = new KeycloakService(keycloakGroupRepository);
  });

  it('deleteUserKc : successful', async () => {
    const message = 'user supprimé';
    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');

    sinon.stub(kc.keycloakAdmin.users, 'del').resolves(message);

    const result = await kc.deleteUserKc('randomId');

    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.users.del.restore();

    expect(result).equal(message);
  });

  it('deleteUserKc fail : connection fails', async () => {
    const errorMessage = 'connexion échoue';
    sinon.stub(kc.keycloakAdmin, 'auth').rejects(errorMessage);

    await kc.deleteUserKc('randomId').catch((error: any) => {
      expect(error.errors).to.equal(errorMessage);
    });

    kc.keycloakAdmin.auth.restore();
  });

  it('createUserKc Citizen: successful', async () => {
    const message = 'user créé';
    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');

    sinon.stub(kc.keycloakAdmin.users, 'create').resolves(message);

    const result = await kc.createUserKc({
      email: 'test@gmail.com',
      lastName: 'testLName',
      firstName: 'testFName',
      group: [GROUPS.citizens],
    });

    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.users.create.restore();

    expect(result).equal(message);
  });

  it('createUserKc Funder: successful', async () => {
    const message = 'user créé';
    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');

    sinon.stub(kc.keycloakAdmin.users, 'create').resolves(message);

    const result = await kc.createUserKc({
      email: 'test@gmail.com',
      lastName: 'testLName',
      firstName: 'testFName',
      funderName: 'Funder',
      group: ['collectivités'],
    });

    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.users.create.restore();

    expect(result).equal(message);
  });

  it('createUserKc fail : email not unique', async () => {
    const errorKc = new ValidationError('email.error.unique', '/email');
    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');

    sinon
      .stub(kc.keycloakAdmin.users, 'create')
      .rejects({response: {status: StatusCode.Conflict}});

    await kc
      .createUserKc({
        email: 'test@gmail.com',
        lastName: 'testLName',
        firstName: 'testFName',
        group: ['collectivités', 'financeurs'],
      })
      .catch((error: any) => {
        expect(error.message).to.equal(errorKc.message);
      });
    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.users.create.restore();
  });

  it('createUserKc fail : password does not met policies', async () => {
    const errorKc = new ValidationError('password.error.format', '/password');

    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');

    sinon.stub(kc.keycloakAdmin.users, 'create').rejects({
      response: {
        status: 400,
        data: {errorMessage: 'Password policy not met'},
      },
    });

    await kc
      .createUserKc({
        email: 'test@gmail.com',
        lastName: 'testLName',
        firstName: 'testFName',
        group: ['collectivités'],
      })
      .catch((error: any) => {
        expect(error.message).to.equal(errorKc.message);
      });

    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.users.create.restore();
  });

  it('createUserKc fail : missing properties', async () => {
    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');

    sinon.stub(kc.keycloakAdmin.users, 'create').rejects('test');

    await kc
      .createUserKc({
        email: 'test@gmail.com',
        lastName: 'testLName',
        firstName: 'testFName',
      })
      .catch((error: any) => {
        expect(error.message).to.equal(errorMessageUser.message);
      });

    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.users.create.restore();
  });

  it('createUserKc fail : connection fails', async () => {
    sinon.stub(kc.keycloakAdmin, 'auth').rejects('connexion échoue');

    await kc
      .createUserKc({
        email: 'test@gmail.com',
        lastName: 'testLName',
        firstName: 'testFName',
        group: ['collectivités'],
      })
      .catch((error: any) => {
        expect(error.message).to.equal(errorMessageUser.message);
      });

    kc.keycloakAdmin.auth.restore();
  });

  it('createGroupKc fail: no top group found', async () => {
    const errorKc = new ValidationError('collectivités.error.topgroup', '/collectivités');
    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');
    sinon.stub(kc.keycloakAdmin.groups, 'find').resolves([]);

    await kc.createGroupKc('group', 'collectivités').catch((error: any) => {
      expect(error.message).to.equal(errorKc.message);
    });

    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.groups.find.restore();
  });

  it('createGroupKc fail : funder not unique', async () => {
    const errorKc = new ValidationError(
      'collectivités.error.name.unique',
      '/collectivités',
    );
    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');
    sinon.stub(kc.keycloakAdmin.groups, 'find').resolves([{id: 'someWeirdId'}]);
    sinon
      .stub(kc.keycloakAdmin.groups, 'setOrCreateChild')
      .rejects({response: {status: StatusCode.Conflict}});

    await kc.createGroupKc('group', 'collectivités').catch((error: any) => {
      expect(error.message).to.equal(errorKc.message);
    });

    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.groups.find.restore();
    kc.keycloakAdmin.groups.setOrCreateChild.restore();
  });

  it('createGroupKc : successful', async () => {
    const messageSucces = 'funder créé';

    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');
    sinon.stub(kc.keycloakAdmin.groups, 'find').resolves([{id: 'someWeirdId'}]);
    sinon.stub(kc.keycloakAdmin.groups, 'setOrCreateChild').resolves(messageSucces);

    const result = await kc.createGroupKc('group', 'collectivités');
    expect(result).to.equal(messageSucces);

    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.groups.find.restore();
    kc.keycloakAdmin.groups.setOrCreateChild.restore();
  });

  it('createGroupKc fail : connection fails', async () => {
    sinon.stub(kc.keycloakAdmin, 'auth').rejects('connexion échoue');

    await kc.createGroupKc('group', 'collectivités').catch((error: any) => {
      expect(error.message).to.equal(errorMessageGroup.message);
    });

    kc.keycloakAdmin.auth.restore();
  });

  it('deleteGroupKc : successful', async () => {
    const message = 'groupe supprimé';
    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');

    sinon.stub(kc.keycloakAdmin.groups, 'del').resolves(message);

    const result = await kc.deleteGroupKc('randomId');

    expect(result).equal(message);

    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.groups.del.restore();
  });

  it('deleteGroupKc fail : connection fails', async () => {
    const errorMessage = 'connexion échoue';
    sinon.stub(kc.keycloakAdmin, 'auth').rejects(errorMessage);

    await kc.deleteGroupKc('randomId').catch((error: any) => {
      expect(error.errors).to.equal(errorMessage);
    });

    kc.keycloakAdmin.auth.restore();
  });

  it('sendExecuteActionsEmailUserKc fails : can not send email', async () => {
    const message = 'email non envoyé';
    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');
    sinon.stub(kc.keycloakAdmin.users, 'executeActionsEmail').rejects(message);

    await kc.sendExecuteActionsEmailUserKc('randomId').catch((error: any) => {
      expect(error.errors).to.equal(message);
    });

    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.users.executeActionsEmail.restore();
  });

  it('sendExecuteActionsEmailUserKc : Successful', async () => {
    const message = 'email envoyé';
    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');
    sinon.stub(kc.keycloakAdmin.users, 'executeActionsEmail').resolves(message);

    const result = await kc.sendExecuteActionsEmailUserKc('randomId');

    expect(result).equal(message);

    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.users.executeActionsEmail.restore();
  });

  it('updateUser fail : connection fails', async () => {
    const errorMessage = 'connexion échoue';
    sinon.stub(kc.keycloakAdmin, 'auth').rejects(errorMessage);

    await kc
      .updateUser('randomId', {
        firstName: 'firstName',
        lastName: 'lastName',
      })
      .catch((error: any) => {
        expect(error.message).to.equal('cannot connect to IDP or add user');
      });

    kc.keycloakAdmin.auth.restore();
  });

  it('updateUser succes', async () => {
    const messageSuccess = 'modification reussie';
    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');
    sinon.stub(kc.keycloakAdmin.users, 'update').resolves(messageSuccess);
    const result = await kc.updateUser('randomId', {
      firstName: 'firstName',
      lastName: 'lastName',
    });
    sinon.assert.calledWithExactly(
      kc.keycloakAdmin.users.update,
      {id: 'randomId'},
      {firstName: 'firstName', lastName: 'lastName'},
    );
    expect(result).to.equal(messageSuccess);
    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.users.update.restore();
  });

  it('sendExecuteActionsEmailUserKc fail : connection fails', async () => {
    const errorMessage = 'connexion échoue';
    sinon.stub(kc.keycloakAdmin, 'auth').rejects(errorMessage);

    await kc.sendExecuteActionsEmailUserKc('randomId').catch((error: any) => {
      expect(error.errors).to.equal(errorMessage);
    });
    kc.keycloakAdmin.auth.restore();
  });

  it('updateUserGroupsKc success :', async () => {
    const groups = [
      {id: '123', name: 'superviseurs'},
      {id: '345', name: 'gestionnaires'},
    ];
    keycloakGroupRepository.stubs.getSubGroupFunder.resolves(groups);
    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');

    sinon.stub(kc.keycloakAdmin.users, 'delFromGroup').resolves('groupe supprimé');
    sinon.stub(kc.keycloakAdmin.users, 'addToGroup').resolves('groupe ajouté');

    await kc.updateUserGroupsKc('id', ['superviseurs']);
    sinon.assert.calledWithExactly(kc.keycloakAdmin.users.delFromGroup, {
      id: 'id',
      groupId: '123',
    });
    sinon.assert.calledWithExactly(kc.keycloakAdmin.users.delFromGroup, {
      id: 'id',
      groupId: '345',
    });
    sinon.assert.calledWithExactly(kc.keycloakAdmin.users.addToGroup, {
      id: 'id',
      groupId: '123',
    });
    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.users.delFromGroup.restore();
    kc.keycloakAdmin.users.addToGroup.restore();
  });

  it('updateUserGroupsKc fail : connection fails', async () => {
    const errorMessage = 'connexion échoue';
    const groups = [
      {id: '123', name: 'superviseurs'},
      {id: '345', name: 'gestionnaires'},
    ];
    keycloakGroupRepository.stubs.getSubGroupFunder.resolves(groups);
    sinon.stub(kc.keycloakAdmin, 'auth').rejects(errorMessage);

    await kc.updateUserGroupsKc('randomId', ['superviseurs']).catch((error: any) => {
      expect(error.message).to.equal('cannot connect to IDP or add user');
    });

    kc.keycloakAdmin.auth.restore();
  });

  it('disableUserKc : successful', async () => {
    const message = 'compte désactivé';
    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');

    sinon.stub(kc.keycloakAdmin.users, 'update').resolves(message);

    const result = await kc.disableUserKc('randomId');
    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.users.update.restore();

    expect(result).equal(message);
  });

  it('disableUserKc fail : connection fails', async () => {
    const errorMessage = 'connexion échoue';
    sinon.stub(kc.keycloakAdmin, 'auth').rejects(errorMessage);

    await kc.disableUserKc('randomId').catch((error: any) => {
      expect(error.message).to.equal(errorMessageUser.message);
    });

    kc.keycloakAdmin.auth.restore();
  });

  it('listConsents : successful', async () => {
    const consentList = [
      {
        clientName: 'simulation maas client',
        theClientId: 'simulation-maas-client',
      },
      {
        clientName: 'mulhouse maas client',
        theClientId: 'mulhouse-maas-client',
      },
      {
        clientName: 'paris maas client',
        theClientId: 'paris-maas-client',
      },
    ];
    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');

    sinon.stub(kc.keycloakAdmin.users, 'listConsents').resolves(consentList);

    const result = await kc.listConsents('randomId');
    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.users.listConsents.restore();

    expect(result).equal(consentList);
  });

  it('listConsents fail: connection fails', async () => {
    const errorMessage = 'connexion échoue';
    sinon.stub(kc.keycloakAdmin, 'auth').rejects(errorMessage);

    await kc.listConsents('randomId').catch((error: any) => {
      expect(error.errors).to.equal(errorMessage);
    });

    kc.keycloakAdmin.auth.restore();
  });

  it('deleteConsent : successful', async () => {
    const message = 'Grant revoked successfully';
    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');

    sinon.stub(kc.keycloakAdmin.users, 'revokeConsent').resolves(message);
    const result = await kc.deleteConsent('randomId');

    expect(result).to.equal(message);

    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.users.revokeConsent.restore();
  });

  it('deleteConsent fail: connection fails', async () => {
    const errorMessage = 'connexion échoue';
    sinon.stub(kc.keycloakAdmin, 'auth').rejects(errorMessage);

    await kc.deleteConsent('randomId', 'simulation-maas-client').catch((error: any) => {
      expect(error.errors).to.equal(errorMessage);
    });

    kc.keycloakAdmin.auth.restore();
  });

  it('listUsers : successful', async () => {
    const MockUsers = [
      {
        username: 'bob@capgemini.com',
        emailVerified: false,
        firstName: 'bob',
        lastName: 'l’éponge',
        email: 'bob@capgemini.com',
      },
      {
        username: 'bob1@capgemini.com',
        emailVerified: false,
        firstName: 'bob1',
        lastName: 'l’éponge1',
        email: 'bob1@capgemini.com',
      },
    ];
    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');

    sinon.stub(kc.keycloakAdmin.users, 'find').resolves(MockUsers);
    const result = await kc.listUsers();

    expect(result).to.equal(MockUsers);

    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.users.find.restore();
  });

  it('listUsers fail: connection fails', async () => {
    const errorMessage = 'connexion échoue';
    sinon.stub(kc.keycloakAdmin, 'auth').rejects(errorMessage);

    await kc.listUsers().catch((error: any) => {
      expect(error.errors).to.equal(errorMessage);
    });

    kc.keycloakAdmin.auth.restore();
  });

  it('getUser : successful', async () => {
    const message = 'user renvoyé';
    sinon.stub(kc.keycloakAdmin, 'auth').resolves('connexion réussie');
    sinon.stub(kc.keycloakAdmin.users, 'findOne').resolves(message);

    const result = await kc.getUser('randomId');
    kc.keycloakAdmin.auth.restore();
    kc.keycloakAdmin.users.findOne.restore();

    expect(result).equal(message);
  });

  it('getUser fails : connection fails', async () => {
    const errorMessage = 'connexion échoue';
    sinon.stub(kc.keycloakAdmin, 'auth').rejects(errorMessage);

    await kc.getUser('randomId').catch((error: any) => {
      expect(error.message).to.equal(errorMessageUser.message);
    });

    kc.keycloakAdmin.auth.restore();
  });
});
