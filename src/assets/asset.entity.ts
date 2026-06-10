import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Outlet } from '../outlets/outlet.entity';
import { Category } from '../categories/category.entity';
import { PassItem } from '../passes/pass-item.entity';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.assets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  outletId: number;

  @ManyToOne(() => Outlet, (outlet) => outlet.assets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'outletId' })
  outlet: Outlet;

  @Column()
  assetCode: string;

  @Column()
  assetName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ default: 15 })
  durationMinutes: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => PassItem, (passItem) => passItem.asset)
  passItems: PassItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
