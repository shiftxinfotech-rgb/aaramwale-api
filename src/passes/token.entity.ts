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
import { PassItem } from "./pass-item.entity";
import { Asset } from "../assets/asset.entity";
import { User } from "../users/user.entity";

@Entity("tokens")
export class Token {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  passId: number;

  @ManyToOne(() => Pass, { onDelete: "CASCADE" })
  @JoinColumn({ name: "passId" })
  pass: Pass;

  @Column()
  passItemId: number;

  @ManyToOne(() => PassItem, { onDelete: "CASCADE" })
  @JoinColumn({ name: "passItemId" })
  passItem: PassItem;

  @Column()
  assetId: number;

  @ManyToOne(() => Asset, { onDelete: "CASCADE" })
  @JoinColumn({ name: "assetId" })
  asset: Asset;

  @Column()
  redeemedQuantity: number;

  @Column({ default: false })
  isFreeConsumption: boolean;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column()
  redeemedByUserId: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "redeemedByUserId" })
  redeemedByUser: User;

  @Column({ default: "ACTIVE" })
  status: string;

  @Column({ nullable: true })
  remarks: string;

  @Column({
    type: "timestamp without time zone",
    default: () => "CURRENT_TIMESTAMP",
  })
  redeemedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
