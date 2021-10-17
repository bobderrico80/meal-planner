import express, { Application, NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import { Server } from 'typescript-rest';
import IocServiceFactory from 'typescript-rest-ioc';
import { HttpError, NotFoundError } from 'typescript-rest/dist/server/model/errors';
import './config';

const logger = console;

export class ApiServer {
  public port: number = parseInt(process.env.PORT || '8081');

  private readonly app: Application;

  constructor() {
    this.app = express();
    this.configureMiddleware();

    Server.registerServiceFactory(IocServiceFactory);
    Server.loadServices(this.app, 'controller/*', __dirname);

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
    // TODO: setup check JWT logic here...
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
