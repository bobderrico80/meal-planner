import { Column, ManyToOne } from 'typeorm';
import { CommonEntity } from './CommonEntity';
import { User } from './User';

export abstract class UserOwnedEntity extends CommonEntity {
  @Column({ nullable: false })
  userId!: string;

  @ManyToOne(() => User)
  user!: User;
}
