import { Connection } from 'typeorm';
import { Inject, InjectValue } from 'typescript-ioc';
import { Path, Security } from 'typescript-rest';
import { Item } from '../entity/Item';
import { ValidatorService } from '../service/ValidatorService';
import { RestController, SchemaDefinition } from './RestController';

export interface ItemRequest {
  name: string;
  unit?: string;
  categoryId: string;
}

const schemaDefinition: SchemaDefinition<ItemRequest> = {
  schemaName: 'item',
  requestBodySchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      unit: { type: 'string', nullable: true },
      categoryId: { type: 'string' },
    },
    required: ['name', 'categoryId'],
  },
};

@Path('/api/item')
@Security()
export class ItemController extends RestController<Item, ItemRequest> {
  constructor(
    @InjectValue('connection') connection: Connection,
    @Inject validatorService: ValidatorService
  ) {
    super(connection, Item, validatorService, schemaDefinition);
  }
}
