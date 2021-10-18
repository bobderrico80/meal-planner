import { Column, Entity } from 'typeorm';
import { CommonEntity } from './CommonEntity';

@Entity()
export class User extends CommonEntity {
  @Column('uuid')
  subId!: string;
}
