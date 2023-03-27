import {BindingScope} from '@loopback/context';
import {MiddlewareSequence, RequestContext} from '@loopback/rest';
import jwt, {JwtPayload} from 'jsonwebtoken';
import {Logger} from './utils';

export class UserIdSequence extends MiddlewareSequence {
  public async handle(context: RequestContext) {
    try {
      const {request} = context;

      // extract additional info from request header
      // and bind it to request-level context
      const authHeaderValue = request.headers?.authorization;
      let userId: string | undefined = undefined;
      if (
        authHeaderValue &&
        authHeaderValue.startsWith('Bearer') &&
        authHeaderValue.split(' ').length === 2
      ) {
        const token: string = authHeaderValue.split(' ')[1];
        const decodedToken: string | JwtPayload | null = jwt.decode(token);
        userId = (decodedToken as JwtPayload)?.sub;
      }
      context.bind('userId').to(userId);
      context.bind('logger-userId').to(new Logger(userId)).inScope(BindingScope.REQUEST);
      await super.handle(context);
    } finally {
      context.unbind('userId');
      context.unbind('logger-userId');
      new Logger();
    }
  }
}
