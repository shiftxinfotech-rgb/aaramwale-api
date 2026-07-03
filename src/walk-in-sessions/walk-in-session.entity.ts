import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Customer } from "../customers/customer.entity";
import { Outlet } from "../outlets/outlet.entity";
import { Asset } from "../assets/asset.entity";
import { Category } from "../categories/category.entity";
import { User } from "../users/user.entity";

@Entity("walk_in_sessions")
export class WalkInSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  sessionNumber: string;

  @Column()
  customerId: number;

  @ManyToOne(() => Customer, { onDelete: "CASCADE" })
  @JoinColumn({ name: "customerId" })
  customer: Customer;

  @Column()
  outletId: number;

  @ManyToOne(() => Outlet, { onDelete: "CASCADE" })
  @JoinColumn({ name: "outletId" })
  outlet: Outlet;

  @Column()
  assetId: number;

  @ManyToOne(() => Asset, { onDelete: "CASCADE" })
  @JoinColumn({ name: "assetId" })
  asset: Asset;

  @Column()
  categoryId: number;

  @ManyToOne(() => Category, { onDelete: "CASCADE" })
  @JoinColumn({ name: "categoryId" })
  category: Category;

  @Column()
  quantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  subtotalAmount: number;

  @Column({ default: "NONE" })
  discountType: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  discountValue: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  finalAmount: number;

  @Column({ nullable: true })
  remarks: string;

  @Column()
  employeeId: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "employeeId" })
  employee: User;

  @Column({ type: "date" })
  sessionDate: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  paidAmount: number;

  @Column({ nullable: true })
  paymentStatus: string;

  @Column({ type: "timestamp", nullable: true })
  paymentDate: Date;

  @Column({ nullable: true })
  receivedByUserId: number;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "receivedByUserId" })
  receivedByUser: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
