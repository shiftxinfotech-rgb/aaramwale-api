import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Outlet } from "./outlet.entity";
import { OutletsService } from "./outlets.service";
import { OutletsController } from "./outlets.controller";
import { AssetsModule } from "../assets/assets.module";

@Module({
  imports: [TypeOrmModule.forFeature([Outlet]), forwardRef(() => AssetsModule)],
  providers: [OutletsService],
  controllers: [OutletsController],
  exports: [OutletsService, TypeOrmModule],
})
export class OutletsModule {}
