import { Connection } from 'typeorm';
import { InjectValue } from 'typescript-ioc';
import { Path, Security } from 'typescript-rest';
import { Item } from '../entity/Item';
import { RestController } from './RestController';

@Path('/api/item')
@Security()
export class ItemController extends RestController<Item> {
  constructor(@InjectValue('connection') connection: Connection) {
    super(connection, Item);
  }
}
