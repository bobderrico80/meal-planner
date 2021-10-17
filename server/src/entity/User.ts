import { Column, Entity, OneToMany } from 'typeorm';
import { CommonEntity } from './CommonEntity';
import { List } from './List';

@Entity()
export class User extends CommonEntity {
  @Column('uuid')
  subId!: string;

  @OneToMany(() => List, (list) => list.user)
  tasks!: List[];
}
