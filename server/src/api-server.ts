import express, { Application, NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import { Strategy } from 'passport-custom';
import { Connection } from 'typeorm';
import { Inject, InjectValue } from 'typescript-ioc';
import { PassportAuthenticator, Server } from 'typescript-rest';
import IocServiceFactory from 'typescript-rest-ioc';
import {
  HttpError,
  NotFoundError,
  UnauthorizedError,
} from 'typescript-rest/dist/server/model/errors';
import './config';
import { User } from './entity/User';
import { TokenService } from './service/TokenService';

const logger = console;

export class ApiServer {
  public port: number = parseInt(process.env.PORT || '8081');

  private readonly app: Application;

  constructor(
    @Inject private readonly tokenService: TokenService,
    @InjectValue('connection') private readonly connection: Connection
  ) {
    this.app = express();
    this.configureMiddleware();

    Server.registerServiceFactory(IocServiceFactory);
    Server.loadServices(this.app, 'controller/*', __dirname);

    this.configureAuthenticator();
    this.configureErrorHandler();
  }

  public async start() {
    this.app.listen(this.port, () => {
      console.log(`meal-planner-server listening at http://localhost:${this.port}`);
    });
  }

  private configureMiddleware() {
    this.app.use(morgan('dev'));
    this.configureAuthenticator();
  }

  private configureAuthenticator() {
    const strategy = new Strategy(async (req, done) => {
      logger.debug('Authorizing user');

      try {
        const authHeader = req.get('Authorization');

        if (!authHeader) {
          logger.debug('Auth header not found');
          throw new UnauthorizedError();
        }

        const subId = await this.tokenService.verifyToken(authHeader);

        if (!subId) {
          logger.debug('Auth token could not be verified');
          throw new UnauthorizedError();
        }

        const repository = this.connection.getRepository(User);
        const user = await repository.findOne({ subId });

        if (!user) {
          logger.debug(`User with subId ${subId} could not be found`);
          throw new UnauthorizedError();
        }

        done(null, user);
      } catch (error) {
        done(error);
      }
    });

    const authenticator = new PassportAuthenticator(strategy, {
      deserializeUser: (user: string) => JSON.parse(user),
      serializeUser: (user: User) => JSON.stringify(user),
    });

    Server.registerAuthenticator(authenticator);
  }

  private configureErrorHandler() {
    // 404 error handler
    this.app.use((req, res) => {
      if (!res.headersSent) {
        throw new NotFoundError();
      }
    });

    // Global error handler
    this.app.use((error: HttpError, req: Request, res: Response, next: NextFunction) => {
      logger.error(error);
      const statusCode = error.statusCode ?? 500;

      let name = error.name;
      let message = error.message;

      if (statusCode === 500) {
        name = 'InternalServerError';
        message = 'Internal Server Error';
      }

      res.status(statusCode).json({ error: name, message });
    });
  }
}
