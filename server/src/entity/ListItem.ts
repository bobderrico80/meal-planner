import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Item } from './Item';
import { List } from './List';

@Entity()
export class ListItem {
  @PrimaryColumn({ nullable: false })
  listId!: string;

  @PrimaryColumn({ nullable: false })
  itemId!: string;

  @Column({ default: false })
  checked?: boolean;

  @Column({ default: 1 })
  quantity?: number;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @ManyToOne(() => List, { onDelete: 'CASCADE' })
  list?: List;

  @ManyToOne(() => Item, { eager: true })
  item?: Item;
}
