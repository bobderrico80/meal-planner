import { Column, Entity, OneToMany } from 'typeorm';
import { Item } from './Item';
import { ListItem } from './ListItem';
import { UserOwnedEntity } from './UserOwnedEntity';

@Entity()
export class List extends UserOwnedEntity {
  @Column({ type: 'text', unique: true })
  name!: string;

  @OneToMany(() => ListItem, (listItem) => listItem.item, { onDelete: 'CASCADE' })
  items?: Item[];
}
