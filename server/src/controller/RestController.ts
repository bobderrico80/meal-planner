import { Connection, EntityTarget, Repository } from 'typeorm';
import { Context, DELETE, GET, Path, PathParam, POST, PUT, ServiceContext } from 'typescript-rest';
import { NotFoundError, UnauthorizedError } from 'typescript-rest/dist/server/model/errors';
import { User } from '../entity/User';
import { UserOwnedEntity } from '../entity/UserOwnedEntity';

export abstract class RestController<T extends UserOwnedEntity> {
  @Context
  context!: ServiceContext;

  private readonly repository: Repository<T>;

  constructor(private readonly connection: Connection, entityTarget: EntityTarget<T>) {
    this.repository = this.connection.getRepository(entityTarget);
  }

  @Path('/')
  @GET
  async getEntities() {
    return this.repository.find({ userId: this.getUserId() });
  }

  @Path('/')
  @POST
  async createEntity(request: T): Promise<T> {
    const newEntity = this.repository.create({
      ...request,
      userId: this.getUserId(),
    } as any);

    return this.repository.save(newEntity as any);
  }

  @Path('/:id')
  @GET
  async getEntity(@PathParam('id') id: string) {
    return this.findOne(id);
  }

  @Path('/:id')
  @PUT
  async updateEntity(@PathParam('id') id: string, request: T) {
    const found = await this.findOne(id);
    const updated = {
      ...found,
      ...request,
    };

    return this.repository.save(updated as any);
  }

  @Path('/:id')
  @DELETE
  async deleteEntity(@PathParam('id') id: string) {
    const found = await this.findOne(id);
    await this.repository.delete(found.id);
  }

  private async findOne(id: string) {
    const found = await this.repository.findOne({ id });

    if (!found) {
      throw new NotFoundError();
    }

    return found;
  }

  private getUserId() {
    if (!this.context.request.user) {
      throw new UnauthorizedError();
    }

    const user = this.context.request.user as User;

    return user.id;
  }
}
