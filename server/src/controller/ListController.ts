import { SomeJSONSchema } from 'ajv/dist/types/json-schema';
import { Connection, EntityManager, Repository } from 'typeorm';
import { Inject, InjectValue } from 'typescript-ioc';
import { DELETE, GET, Path, PathParam, POST, PUT, Security } from 'typescript-rest';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'typescript-rest/dist/server/model/errors';
import { Item } from '../entity/Item';
import { List } from '../entity/List';
import { ListItem } from '../entity/ListItem';
import { EntityService } from '../service/EntityService';
import { ValidatorService } from '../service/ValidatorService';
import { RestController } from './RestController';

export interface ExistingItemPrototype {
  id: string;
  quantity?: number;
}

export interface NewItemPrototype {
  name: string;
  categoryId: string;
  unit?: string;
}

export type ItemPrototype = ExistingItemPrototype & NewItemPrototype;

export interface NewListRequest {
  name: string;
  items?: ItemPrototype[];
}

export interface UpdateListItemRequest {
  quantity?: number;
  checked?: boolean;
}

const updateListItemSchema: SomeJSONSchema = {
  type: 'object',
  properties: {
    quantity: { type: 'number' },
    unit: { type: 'string' },
  },
  required: [],
};

const newListItemSchema: SomeJSONSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    quantity: { type: 'number' },
    unit: { type: 'string' },
  },
  required: [],
};

const newListSchema: SomeJSONSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
        },
        required: [],
      },
    },
  },
  required: ['name'],
};

@Path('/api/list')
@Security()
export class ListController extends RestController<List> {
  private readonly listItemRepository: Repository<ListItem>;

  constructor(
    @Inject entityService: EntityService<List>,
    @Inject validatorService: ValidatorService,
    @InjectValue('connection') private readonly connection: Connection
  ) {
    super(entityService, validatorService, List, 'list.newList', newListSchema);
    this.validatorService.registerSchema(newListItemSchema, 'list.newListItem');
    this.validatorService.registerSchema(updateListItemSchema, 'list.updateListItem');
    this.listItemRepository = connection.getRepository(ListItem);
  }

  @Path('/')
  @POST
  async createEntity(newListRequest: NewListRequest): Promise<List> {
    this.validatorService.validatePayload(this.schemaName, newListRequest);
    this.entityService.init(this.entityTarget, this.context);

    return this.connection.transaction(async (entityManager) => {
      let newList: List = new List();
      newList.name = newListRequest.name;
      newList.userId = this.entityService.getUserId();

      try {
        newList = await entityManager.save(newList);
      } catch (error: any) {
        if (error.code === '23505') {
          throw new ConflictError(error.detail);
        }

        throw error;
      }

      // If list items are not included in the request, return the new created list
      if (!newListRequest?.items?.length) {
        return newList;
      }

      // Separate item array into items that need to be created versus those that do not
      const listItemsToCreate: ListItem[] = [];
      const newItemsToCreate: Item[] = [];

      for (let itemPrototype of newListRequest.items) {
        if (itemPrototype.id) {
          listItemsToCreate.push(
            this.createNewListItem(itemPrototype.id, newList.id!, itemPrototype.quantity)
          );
        } else if (itemPrototype.name) {
          newItemsToCreate.push(this.createNewItem(itemPrototype));
        }
      }

      // Create any new items
      const createdItems = await this.saveItems(entityManager, newItemsToCreate);

      // Add new items with the list
      createdItems.forEach((item) => {
        listItemsToCreate.push(this.createNewListItem(item.id!, newList.id!, 1));
      });

      // Associate list items
      this.saveListItems(entityManager, listItemsToCreate);

      return newList;
    });
  }

  @Path(':listId/item')
  @GET
  async getItemsForList(@PathParam('listId') listId: string) {
    return this.listItemRepository.find({ where: { listId } });
  }

  @Path(':listId/item')
  @POST
  async addItemToList(@PathParam('listId') listId: string, itemPrototype: ItemPrototype) {
    this.validatorService.validatePayload('list.newListItem', itemPrototype);

    this.entityService.init(this.entityTarget, this.context);

    return this.connection.transaction(async (entityManager) => {
      // New Item Prototype, need to create the item first
      let itemId: string;

      if (itemPrototype.name) {
        let newItem = this.createNewItem(itemPrototype);
        newItem = await this.saveItems(entityManager, newItem);
        itemId = newItem.id!;
      } else {
        itemId = itemPrototype.id;
      }

      let newListItem = this.createNewListItem(itemId, listId, itemPrototype.quantity);
      newListItem = await this.saveListItems(entityManager, newListItem);

      return entityManager.find(ListItem, { where: { listId } });
    });
  }

  @Path(':listId/item/:itemId')
  @PUT
  async updateListItem(
    @PathParam('listId') listId: string,
    @PathParam('itemId') itemId: string,
    updatedListItem: UpdateListItemRequest
  ) {
    this.validatorService.validatePayload('list.updateListItem', updatedListItem);

    return this.connection.transaction(async (entityManager) => {
      const listItems = await entityManager.find(ListItem, { listId, itemId });

      if (!listItems || listItems.length === 0) {
        throw new NotFoundError();
      }

      let listItem = listItems[0];

      if (updatedListItem.quantity) {
        listItem.quantity = updatedListItem.quantity;
      }

      if (updatedListItem.checked) {
        listItem.checked = updatedListItem.checked;
      }

      listItem = await entityManager.save(listItem);

      return listItem;
    });
  }

  @Path(':listId/item/:itemId')
  @DELETE
  async deleteListItem(@PathParam('listId') listId: string, @PathParam('itemId') itemId: string) {
    this.connection.transaction(async (entityManager) => {
      const listItems = await entityManager.find(ListItem, { listId, itemId });

      if (!listItems || listItems.length === 0) {
        throw new NotFoundError();
      }

      entityManager.delete(ListItem, { listId, itemId });
    });
  }

  private createNewListItem(itemId: string, listId: string, quantity?: number) {
    const newListItem = new ListItem();
    newListItem.itemId = itemId;
    newListItem.listId = listId;
    newListItem.quantity = quantity;

    return newListItem;
  }

  private async saveItems<T>(entityManager: EntityManager, itemsToCreate: T): Promise<T> {
    try {
      const newItems = await entityManager.save(itemsToCreate);
      return newItems;
    } catch (error: any) {
      if ((error.code = '23505')) {
        throw new ConflictError(error.detail);
      }

      throw error;
    }
  }

  private async saveListItems<T>(entityManager: EntityManager, listItemsToCreate: T): Promise<T> {
    try {
      const newListItems = await entityManager.save(listItemsToCreate);
      return newListItems;
    } catch (error: any) {
      if ((error.code = '23505')) {
        throw new BadRequestError(`Constraint error while associated list item: ${error.detail}`);
      }

      throw error;
    }
  }

  private createNewItem(itemPrototype: NewItemPrototype) {
    if (!itemPrototype.categoryId) {
      throw new BadRequestError('A new item associated with this list does not have a category ID');
    }

    const newItem = new Item();
    newItem.name = itemPrototype.name;
    newItem.categoryId = itemPrototype.categoryId;
    newItem.unit = itemPrototype.unit;
    newItem.userId = this.entityService.getUserId();

    return newItem;
  }
}
