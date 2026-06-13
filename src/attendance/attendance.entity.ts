import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../users/user.entity";
import { Outlet } from "../outlets/outlet.entity";

@Entity("attendance")
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ nullable: true })
  outletId: number | null;

  @ManyToOne(() => Outlet, { onDelete: "SET NULL" })
  @JoinColumn({ name: "outletId" })
  outlet: Outlet;

  @Column({ type: "date" })
  date: string; // YYYY-MM-DD for grouping

  @Column({ type: "timestamp" })
  clockIn: Date;

  @Column({ type: "timestamp", nullable: true })
  clockOut: Date;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  durationHours: number;

  @Column({ default: "PRESENT" })
  status: string; // PRESENT, COMPLETED

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
