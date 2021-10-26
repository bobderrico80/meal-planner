import { SomeJSONSchema } from 'ajv/dist/types/json-schema';
import { Inject } from 'typescript-ioc';
import { Path, Security } from 'typescript-rest';
import { Item } from '../entity/Item';
import { EntityService } from '../service/EntityService';
import { ValidatorService } from '../service/ValidatorService';
import { RestController } from './RestController';

const requestSchema: SomeJSONSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    unit: { type: 'string' },
    categoryId: { type: 'string' },
  },
  required: ['name', 'categoryId'],
};

@Path('/api/item')
@Security()
export class ItemController extends RestController<Item> {
  constructor(
    @Inject entityService: EntityService<Item>,
    @Inject validatorService: ValidatorService
  ) {
    super(entityService, validatorService, Item, 'item.request', requestSchema);
  }
}
