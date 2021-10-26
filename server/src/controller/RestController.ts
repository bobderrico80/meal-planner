import { SomeJSONSchema } from 'ajv/dist/types/json-schema';
import { EntityTarget } from 'typeorm';
import { Context, DELETE, GET, Path, PathParam, POST, PUT, ServiceContext } from 'typescript-rest';
import { EntityService } from '../service/EntityService';
import { ValidatorService } from '../service/ValidatorService';

export abstract class RestController<T> {
  @Context
  protected context!: ServiceContext;

  constructor(
    protected readonly entityService: EntityService<T>,
    protected readonly validatorService: ValidatorService,
    protected readonly entityTarget: EntityTarget<T>,
    protected readonly schemaName: string,
    schema: SomeJSONSchema
  ) {
    this.validatorService.registerSchema(schema, schemaName);
  }

  @Path('/')
  @GET
  async getEntities() {
    return this.entityService.init(this.entityTarget, this.context).getEntities();
  }

  @Path('/')
  @POST
  async createEntity(newEntity: T): Promise<T> {
    this.validatorService.validatePayload(this.schemaName, newEntity);
    return this.entityService.init(this.entityTarget, this.context).createEntity(newEntity);
  }

  @Path('/:id')
  @GET
  async getEntity(@PathParam('id') id: string) {
    return this.entityService.init(this.entityTarget, this.context).getEntity(id);
  }

  @Path('/:id')
  @PUT
  async updateEntity(@PathParam('id') id: string, entity: T) {
    this.validatorService.validatePayload(this.schemaName, entity);
    return this.entityService.init(this.entityTarget, this.context).updateEntity(id, entity);
  }

  @Path('/:id')
  @DELETE
  async deleteEntity(@PathParam('id') id: string) {
    return this.entityService.init(this.entityTarget, this.context).deleteEntity(id);
  }
}
