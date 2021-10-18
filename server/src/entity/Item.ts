import { Column, Entity, ManyToOne } from 'typeorm';
import { Category } from './Category';
import { UserOwnedEntity } from './UserOwnedEntity';

@Entity()
export class Item extends UserOwnedEntity {
  @Column({ type: 'text', nullable: false })
  name!: string;

  @Column({ type: 'text', default: 'each' })
  unit!: string;

  @ManyToOne(() => Category, { eager: true, nullable: false })
  category!: Category;
}
