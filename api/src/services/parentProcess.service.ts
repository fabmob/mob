import {BindingScope, injectable} from '@loopback/core';
import * as path from 'path';
import {ChildProcess, fork} from 'child_process';

import {EVENT_MESSAGE, IMessage, logger} from '../utils';
import EventEmitter from 'events';

@injectable({scope: BindingScope.SINGLETON})
export class ParentProcessService extends EventEmitter {
  private child: ChildProcess;

  constructor() {
    super();
    this.createChildProcess();
    this.on(EVENT_MESSAGE.UPDATE, this.sendMessageToChild);
    this.on(EVENT_MESSAGE.ACK, this.sendMessageToChild);
  }

  private createChildProcess(): void {
    try {
      this.child = fork(path.join(__dirname, 'child_processes/consume'));
      logger.info(
        `${ParentProcessService.name} - Child process started: ${this.child.pid}`,
      );

      this.child.on('error', (err: any) => {
        logger.error(
          `${ParentProcessService.name} - Child process - ${this.child.pid} - Error : ${err}`,
        );
        throw new Error('A problem occurred');
      });
      this.child.on('close', (code: number) => {
        logger.error(
          `${ParentProcessService.name} - Child process - ${this.child.pid} - Exited with code : ${code}`,
        );
        throw new Error('A problem occurred');
      });
      this.child.on('message', (msg: IMessage) => {
        logger.info(
          `${ParentProcessService.name} - Child process - ${this.child.pid} - \
          Message from child ${JSON.stringify(msg)}`,
        );
        this.emit(msg.type, msg.data);
      });
    } catch (err) {
      throw new Error('A problem occurred');
    }
  }

  private sendMessageToChild(msg: any): void {
    this.child.send(msg);
  }
}
