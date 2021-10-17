import { Column, Entity, ManyToOne } from 'typeorm';
import { CommonEntity } from './CommonEntity';
import { User } from './User';

@Entity()
export class List extends CommonEntity {
  @Column({ type: 'text' })
  name!: string;

  @ManyToOne(() => User, (user) => user.tasks)
  user!: User;
}
