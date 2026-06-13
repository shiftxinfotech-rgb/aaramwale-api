import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../users/user.entity";
import { Asset } from "../assets/asset.entity";
import { Pass } from "../passes/pass.entity";

@Entity("outlets")
export class Outlet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.outlet)
  users: User[];

  @OneToMany(() => Asset, (asset) => asset.outlet)
  assets: Asset[];

  @OneToMany(() => Pass, (pass) => pass.outlet)
  passes: Pass[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
