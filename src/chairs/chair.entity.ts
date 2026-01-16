import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Outlet } from '../outlets/outlet.entity';
import { Token } from '../tokens/token.entity';

@Entity('chairs')
export class Chair {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  outletId: number;

  @ManyToOne(() => Outlet, (outlet) => outlet.chairs)
  @JoinColumn({ name: 'outletId' })
  outlet: Outlet;

  @Column()
  chairNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  rentPerToken: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Token, (token) => token.chair)
  tokens: Token[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
