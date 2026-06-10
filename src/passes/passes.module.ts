import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pass } from './pass.entity';
import { PassItem } from './pass-item.entity';
import { Customer } from '../customers/customer.entity';
import { PassesService } from './passes.service';
import { PassesController } from './passes.controller';
import { AssetsModule } from '../assets/assets.module';
import { Token } from './token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pass, PassItem, Customer, Token]),
    AssetsModule,
  ],
  controllers: [PassesController],
  providers: [PassesService],
  exports: [PassesService, TypeOrmModule],
})
export class PassesModule {}
