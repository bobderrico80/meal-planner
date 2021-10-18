import { Connection } from 'typeorm';
import { InjectValue } from 'typescript-ioc';
import { Path, Security } from 'typescript-rest';
import { Category } from '../entity/Category';
import { RestController } from './RestController';

@Path('/api/category')
@Security()
export class CategoryController extends RestController<Category> {
  constructor(@InjectValue('connection') connection: Connection) {
    super(connection, Category);
  }
}
