import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Customer } from "../customers/customer.entity";
import { Outlet } from "../outlets/outlet.entity";
import { User } from "../users/user.entity";
import { PassItem } from "./pass-item.entity";

export enum PassDiscountType {
  PERCENTAGE = "PERCENTAGE",
  FIXED = "FIXED",
  NONE = "NONE",
}

export enum PassStatus {
  ACTIVE = "ACTIVE",
  PARTIALLY_REDEEMED = "PARTIALLY_REDEEMED",
  FULLY_REDEEMED = "FULLY_REDEEMED",
  CANCELLED = "CANCELLED",
}

export enum PassPaymentMethod {
  CASH = "CASH",
  UPI = "UPI",
  CARD = "CARD",
  BANK_TRANSFER = "BANK_TRANSFER",
  MIXED = "MIXED",
}

@Entity("passes")
export class Pass {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  passNumber: string;

  @Column()
  customerId: number;

  @ManyToOne(() => Customer, { onDelete: "CASCADE" })
  @JoinColumn({ name: "customerId" })
  customer: Customer;

  @Column()
  outletId: number;

  @ManyToOne(() => Outlet, (outlet) => outlet.passes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "outletId" })
  outlet: Outlet;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  subtotalAmount: number;

  @Column({
    type: "enum",
    enum: PassDiscountType,
    default: PassDiscountType.NONE,
  })
  discountType: PassDiscountType;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  discountValue: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  finalAmount: number;

  @Column({ nullable: true })
  qrCode: string;

  @Column()
  generatedByUserId: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "generatedByUserId" })
  generatedByUser: User;

  @Column()
  generatedByRole: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0, nullable: true })
  paidAmount: number;

  @Column({ nullable: true })
  paymentStatus: string;

  @Column({ type: "timestamp", nullable: true })
  paymentDate: Date;

  @Column({ nullable: true })
  receivedByUserId: number;

  @Column({
    type: "character varying",
    default: PassStatus.ACTIVE,
  })
  status: PassStatus;

  @OneToMany(() => PassItem, (item) => item.pass, { cascade: true })
  items: PassItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
