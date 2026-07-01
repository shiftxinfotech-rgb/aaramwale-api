import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Outlet } from "../outlets/outlet.entity";

@Entity("customers")
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true, nullable: true })
  mobile: string;

  @Column({ type: "date", nullable: true })
  date: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ type: "date", nullable: true })
  birthday: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  area: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ default: 0 })
  totalAppointments: number;

  @Column({ type: "date", nullable: true })
  lastVisitDate: string;

  @Column({ nullable: true })
  outletId: number;

  @ManyToOne(() => Outlet, { nullable: true, eager: false })
  @JoinColumn({ name: "outletId" })
  outlet: Outlet;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
