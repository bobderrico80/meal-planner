import { Connection } from 'typeorm';
import { InjectValue } from 'typescript-ioc';
import { Path, Security } from 'typescript-rest';
import { List } from '../entity/List';
import { RestController } from './RestController';

@Path('/api/list')
@Security()
export class ListController extends RestController<List> {
  constructor(@InjectValue('connection') connection: Connection) {
    super(connection, List);
  }
}
