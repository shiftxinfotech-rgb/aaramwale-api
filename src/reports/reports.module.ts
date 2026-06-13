import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "../categories/category.entity";
import { Asset } from "../assets/asset.entity";
import { Outlet } from "../outlets/outlet.entity";
import { Customer } from "../customers/customer.entity";
import { WalkInSession } from "../walk-in-sessions/walk-in-session.entity";
import { ReportsService } from "./reports.service";
import { ReportsController } from "./reports.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      Asset,
      Outlet,
      Customer,
      WalkInSession,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
