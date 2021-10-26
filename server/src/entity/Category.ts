import { Column, Entity } from 'typeorm';
import { UserOwnedEntity } from './UserOwnedEntity';

@Entity()
export class Category extends UserOwnedEntity {
  @Column({ type: 'text', unique: true })
  name!: string;
}
