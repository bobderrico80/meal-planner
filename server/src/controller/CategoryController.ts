import { Connection } from 'typeorm';
import { Inject, InjectValue } from 'typescript-ioc';
import { Path, Security } from 'typescript-rest';
import { Category } from '../entity/Category';
import { ValidatorService } from '../service/ValidatorService';
import { RestController, SchemaDefinition } from './RestController';

export interface CategoryRequest {
  name: string;
}

const schemaDefinition: SchemaDefinition<CategoryRequest> = {
  schemaName: 'category',
  requestBodySchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
    required: ['name'],
  },
};

@Path('/api/category')
@Security()
export class CategoryController extends RestController<Category, CategoryRequest> {
  constructor(
    @InjectValue('connection') connection: Connection,
    @Inject validatorService: ValidatorService
  ) {
    super(connection, Category, validatorService, schemaDefinition);
  }
}
