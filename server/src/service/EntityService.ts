import { Connection, EntityTarget, Repository } from 'typeorm';
import { InjectValue } from 'typescript-ioc';
import { ServiceContext } from 'typescript-rest';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from 'typescript-rest/dist/server/model/errors';
import { User } from '../entity/User';
import { UserOwnedEntity } from '../entity/UserOwnedEntity';

export class EntityService<T extends UserOwnedEntity> {
  private repository?: Repository<T>;
  private userId?: string;

  constructor(@InjectValue('connection') private readonly connection: Connection) {}

  init(entityTarget: EntityTarget<T>, context: ServiceContext) {
    this.repository = this.connection.getRepository(entityTarget);

    if (!context.request.user) {
      throw new UnauthorizedError();
    }

    const user = context.request.user as User;
    this.userId = user.id;

    return this;
  }

  async getEntities() {
    return this.getRepository().find({
      where: { userId: this.getUserId() },
      loadEagerRelations: false,
    });
  }

  async createEntity(entity: T): Promise<T> {
    const newEntity = this.getRepository().create({
      ...entity,
      userId: this.getUserId(),
    } as any);

    try {
      const response = await this.getRepository().save(newEntity as any);
      return response;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictError();
      }

      throw error;
    }
  }

  async getEntity(id: string, loadEagerRelations = false) {
    return this.findOne(id, loadEagerRelations);
  }

  async updateEntity(id: string, entity: T) {
    const found = await this.findOne(id);
    const updated = {
      ...found,
      ...entity,
    };

    return this.getRepository().save(updated as any);
  }

  getUserId() {
    if (!this.userId) {
      throw new Error('Entity Service was not initialized');
    }

    return this.userId;
  }

  async deleteEntity(id: string) {
    const found = await this.findOne(id);
    await this.getRepository().delete(found.id!);
  }

  private async findOne(id: string, loadEagerRelations = false) {
    const found = await this.getRepository().findOne({ id }, { loadEagerRelations });

    if (!found) {
      throw new NotFoundError();
    }

    return found;
  }

  private getRepository() {
    if (!this.repository) {
      throw new Error('Entity Service was not initialized');
    }

    return this.repository;
  }
}
