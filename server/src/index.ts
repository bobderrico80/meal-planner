import { ApiServer } from './api-server';
import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { Container } from 'typescript-ioc';
import { TokenService } from './service/TokenService';
import { config } from './config';

createConnection()
  .then(async (connection) => {
    Container.bindName('connection').to(connection);

    const server = new ApiServer(new TokenService(config), connection);

    server.start();
  })
  .catch((error) => console.error(error));
