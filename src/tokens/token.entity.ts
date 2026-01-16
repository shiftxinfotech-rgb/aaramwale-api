import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Outlet } from '../outlets/outlet.entity';
import { Chair } from '../chairs/chair.entity';
import { User } from '../users/user.entity';

@Entity('tokens')
export class Token {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  outletId: number;

  @ManyToOne(() => Outlet, (outlet) => outlet.tokens)
  @JoinColumn({ name: 'outletId' })
  outlet: Outlet;

  @Column()
  chairId: number;

  @ManyToOne(() => Chair, (chair) => chair.tokens)
  @JoinColumn({ name: 'chairId' })
  chair: Chair;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.tokens)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  tokenNumber: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'ACTIVE' })
  status: string; // ACTIVE, COMPLETED, CANCELLED

  @Column({ type: 'timestamp', nullable: true })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
