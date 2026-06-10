import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalkInSession } from './walk-in-session.entity';
import { WalkInSessionsService } from './walk-in-sessions.service';
import { WalkInSessionsController } from './walk-in-sessions.controller';
import { Customer } from '../customers/customer.entity';
import { Asset } from '../assets/asset.entity';
import { Outlet } from '../outlets/outlet.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalkInSession, Customer, Asset, Outlet, User]),
  ],
  controllers: [WalkInSessionsController],
  providers: [WalkInSessionsService],
  exports: [WalkInSessionsService, TypeOrmModule],
})
export class WalkInSessionsModule {}
