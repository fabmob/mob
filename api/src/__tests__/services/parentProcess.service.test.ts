import {expect} from '@loopback/testlab';

import sinon from 'sinon';
import path from 'path';
import child_process from 'child_process';

import {ParentProcessService} from '../../services';
import {EventEmitter} from 'events';
import {EVENT_MESSAGE, IMessage} from '../../utils';

describe('ParentProcessService', () => {
  let pathStub: any = null;
  let forkStub: any = null;

  beforeEach(() => {
    const cp = <child_process.ChildProcess>new EventEmitter();
    pathStub = sinon.stub(path, 'join').returns('file.js');
    forkStub = sinon.stub(child_process, 'fork').returns(cp);
  });

  afterEach(() => {
    pathStub.restore();
    forkStub.restore();
  });

  it('ParentProcessService child process : error', async () => {
    try {
      const parentProcessService: any = new ParentProcessService();
      parentProcessService.child.emit('error', 'error');
    } catch (err) {
      expect(err.message).to.equal('A problem occurred');
    }
  });

  it('ParentProcessService child process : close', async () => {
    try {
      const parentProcessService: any = new ParentProcessService();
      parentProcessService.child.emit('close', 0);
    } catch (err) {
      expect(err.message).to.equal('A problem occurred');
    }
  });

  it('ParentProcessService child process : message', async () => {
    const message: IMessage = {type: EVENT_MESSAGE.READY};
    const parentProcessService: any = new ParentProcessService();
    sinon.spy(parentProcessService, 'emit');
    parentProcessService.child.emit('message', message);
    sinon.assert.calledWithExactly(parentProcessService.emit, EVENT_MESSAGE.READY, undefined);
  });

  it('ParentProcessService fork child process : error', async () => {
    forkStub.restore();
    forkStub = sinon.stub(child_process, 'fork').rejects();
    try {
      new ParentProcessService();
    } catch (err) {
      expect(err.message).to.equal('A problem occurred');
    }
  });

  it('ParentProcessService send message to child : success', async () => {
    forkStub.restore();
    const message: IMessage = {type: EVENT_MESSAGE.UPDATE, data: ['test']};
    const cpStub = Object.assign({
      send: sinon.stub().returns(true),
      on: sinon.stub().returnsThis(),
    });
    forkStub = sinon.stub(child_process, 'fork').returns(cpStub);
    const parentProcessService: any = new ParentProcessService();
    parentProcessService.sendMessageToChild(message);
    sinon.assert.calledWithExactly(cpStub.send, message);
  });
});
