import { SomeJSONSchema } from 'ajv/dist/types/json-schema';
import { Inject } from 'typescript-ioc';
import { Path, Security } from 'typescript-rest';
import { Category } from '../entity/Category';
import { EntityService } from '../service/EntityService';
import { ValidatorService } from '../service/ValidatorService';
import { RestController } from './RestController';

export interface CategoryRequest {
  name: string;
}

const requestSchema: SomeJSONSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
  },
  required: ['name'],
};

@Path('/api/category')
@Security()
export class CategoryController extends RestController<Category> {
  constructor(
    @Inject entityService: EntityService<Category>,
    @Inject validatorService: ValidatorService
  ) {
    super(entityService, validatorService, Category, 'category.request', requestSchema);
  }
}
