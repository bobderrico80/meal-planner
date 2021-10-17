import { List } from '../entity/List';
import { User } from '../entity/User';
import { Connection, Repository } from 'typeorm';
import { InjectValue } from 'typescript-ioc';
import { Context, GET, Path, POST, Security, ServiceContext } from 'typescript-rest';

@Path('/api/list')
@Security()
export class ListController {
  @Context
  context!: ServiceContext;

  private readonly repository: Repository<List>;

  constructor(@InjectValue('connection') private readonly connection: Connection) {
    this.repository = this.connection.getRepository(List);
  }

  @Path('/')
  @GET
  async getLists(): Promise<List[]> {
    return this.repository.find({ user: this.context.request.user });
  }

  @Path('/')
  @POST
  async createList(request: { name: string }) {
    const newList = this.repository.create({
      user: this.context.request.user,
      name: request.name,
    });

    return this.repository.save(newList);
  }
}
