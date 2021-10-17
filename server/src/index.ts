import { ApiServer } from './api-server';
import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { Container } from 'typescript-ioc';

createConnection()
  .then(async (connection) => {
    Container.bindName('connection').to(connection);
    const server = new ApiServer();
    server.start();
  })
  .catch((error) => console.error(error));
