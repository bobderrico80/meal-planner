import { JSONSchemaType } from 'ajv';
import { Connection, EntityTarget, Repository } from 'typeorm';
import { Context, DELETE, GET, Path, PathParam, POST, PUT, ServiceContext } from 'typescript-rest';
import { NotFoundError, UnauthorizedError } from 'typescript-rest/dist/server/model/errors';
import { User } from '../entity/User';
import { UserOwnedEntity } from '../entity/UserOwnedEntity';
import { ValidatorService } from '../service/ValidatorService';

export interface SchemaDefinition<T> {
  requestBodySchema?: JSONSchemaType<T>;
  schemaName: string;
}

export abstract class RestController<T extends UserOwnedEntity, R = T> {
  @Context
  context!: ServiceContext;

  private readonly repository: Repository<T>;

  constructor(
    private readonly connection: Connection,
    entityTarget: EntityTarget<T>,
    private readonly validatorService?: ValidatorService,
    private readonly schemaDefinition?: SchemaDefinition<R>
  ) {
    this.repository = this.connection.getRepository(entityTarget);

    if (schemaDefinition) {
      this.registerSchemas(schemaDefinition);
    }
  }

  @Path('/')
  @GET
  async getEntities() {
    return this.repository.find({ where: { userId: this.getUserId() }, loadEagerRelations: false });
  }

  @Path('/')
  @POST
  async createEntity(request: R): Promise<T> {
    if (this.schemaDefinition && this.validatorService) {
      this.validatorService.validatePayload(
        `${this.schemaDefinition.schemaName}.requestBody`,
        request
      );
    }

    const newEntity = this.repository.create({
      ...request,
      userId: this.getUserId(),
    } as any);

    return this.repository.save(newEntity as any);
  }

  @Path('/:id')
  @GET
  async getEntity(@PathParam('id') id: string) {
    return this.findOne(id, true);
  }

  @Path('/:id')
  @PUT
  async updateEntity(@PathParam('id') id: string, request: R) {
    if (this.schemaDefinition && this.validatorService) {
      this.validatorService.validatePayload(
        `${this.schemaDefinition.schemaName}.requestBody`,
        request
      );
    }

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
    await this.repository.delete(found.id!);
  }

  private registerSchemas(schemaDefinition: SchemaDefinition<R>) {
    if (!this.validatorService) {
      return;
    }

    if (schemaDefinition.requestBodySchema) {
      this.validatorService.registerSchema(
        schemaDefinition.requestBodySchema,
        `${schemaDefinition.schemaName}.requestBody`
      );
    }
  }

  private async findOne(id: string, loadEagerRelations = false) {
    const found = await this.repository.findOne({ id }, { loadEagerRelations });

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
