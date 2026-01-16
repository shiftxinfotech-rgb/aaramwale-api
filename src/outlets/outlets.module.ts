import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Outlet } from './outlet.entity';
import { OutletsService } from './outlets.service';
import { OutletsController } from './outlets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Outlet])],
  providers: [OutletsService],
  controllers: [OutletsController],
  exports: [OutletsService],
})
export class OutletsModule {}
