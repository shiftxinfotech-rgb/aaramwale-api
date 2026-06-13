import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Pass } from "./pass.entity";
import { Asset } from "../assets/asset.entity";
import { Category } from "../categories/category.entity";

@Entity("pass_items")
export class PassItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  passId: number;

  @ManyToOne(() => Pass, (pass) => pass.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "passId" })
  pass: Pass;

  @Column()
  categoryId: number;

  @ManyToOne(() => Category, { onDelete: "CASCADE" })
  @JoinColumn({ name: "categoryId" })
  category: Category;

  @Column()
  assetId: number;

  @ManyToOne(() => Asset, (asset) => asset.passItems, { onDelete: "CASCADE" })
  @JoinColumn({ name: "assetId" })
  asset: Asset;

  @Column()
  totalQuantity: number;

  @Column({ default: 0 })
  freeQuantity: number;

  @Column()
  paidQuantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  lineTotal: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
