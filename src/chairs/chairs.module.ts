import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chair } from './chair.entity';
import { ChairsService } from './chairs.service';
import { ChairsController } from './chairs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Chair])],
  providers: [ChairsService],
  controllers: [ChairsController],
  exports: [ChairsService],
})
export class ChairsModule {}
