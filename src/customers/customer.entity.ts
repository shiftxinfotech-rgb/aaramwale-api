import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  phone: string;

  @Column({ type: 'date', nullable: true })
  date: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ type: 'date', nullable: true })
  birthday: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  area: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: 0 })
  loyaltyPoints: number;

  @Column({ nullable: true })
  activeMembershipId: number;

  @Column({ nullable: true })
  membershipName: string;

  @Column({ type: 'date', nullable: true })
  membershipExpiry: string;

  @Column({ default: 0 })
  activePackages: number;

  @Column({ default: 0 })
  activeGiftCards: number;

  @Column({ default: 0 })
  totalAppointments: number;

  @Column({ type: 'date', nullable: true })
  lastVisitDate: string;

  @Column({ nullable: true })
  outletId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
