import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Chair } from '../chairs/chair.entity';
import { Token } from '../tokens/token.entity';

@Entity('outlets')
export class Outlet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.outlet)
  users: User[];

  @OneToMany(() => Chair, (chair) => chair.outlet)
  chairs: Chair[];

  @OneToMany(() => Token, (token) => token.outlet)
  tokens: Token[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
