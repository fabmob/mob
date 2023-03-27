import {expect, sinon} from '@loopback/testlab';
import {LoggerProvider} from '../../providers';
import {Request} from '@loopback/express';
import {Logger} from '../../utils';

describe('Logger provider', () => {
  let loggerProvider: LoggerProvider;

  beforeEach(() => {
    loggerProvider = new LoggerProvider();
  });

  it('should value: OK', () => {
    const result = loggerProvider.value();
    expect(result).to.deepEqual(loggerProvider.action.bind(loggerProvider));
  });

  it('should action: OK', () => {
    const loggerStub = sinon.stub(Logger, 'error').callsFake(() => {
      return {};
    });
    const err: Error = new Error('Error');
    loggerProvider.action(err, 500, Object.assign({}) as Request);
    sinon.assert.calledOnceWithExactly(loggerStub, 'LoggerProvider', 'action', 'lb4 error', err);
    loggerStub.restore();
  });
});
