import { Connection } from 'typeorm';
import { Inject, InjectValue } from 'typescript-ioc';
import { Path, Security } from 'typescript-rest';
import { List } from '../entity/List';
import { ValidatorService } from '../service/ValidatorService';
import { RestController, SchemaDefinition } from './RestController';

export interface ListRequest {
  name: string;
  items?: { id: string }[];
}

const schemaDefinition: SchemaDefinition<ListRequest> = {
  schemaName: 'list',
  requestBodySchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        nullable: true,
      },
    },
    required: ['name'],
  },
};

@Path('/api/list')
@Security()
export class ListController extends RestController<List, ListRequest> {
  constructor(
    @InjectValue('connection') connection: Connection,
    @Inject validatorService: ValidatorService
  ) {
    super(connection, List, validatorService, schemaDefinition);
  }
}
