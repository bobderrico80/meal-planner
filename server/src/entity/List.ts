import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { Item } from './Item';
import { UserOwnedEntity } from './UserOwnedEntity';

@Entity()
export class List extends UserOwnedEntity {
  @Column({ type: 'text' })
  name!: string;

  @ManyToMany(() => Item, { cascade: true, eager: true })
  @JoinTable()
  items!: Item[];
}
