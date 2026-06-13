import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomersService } from "./customers.service";
import { CustomersController } from "./customers.controller";
import { Customer } from "./customer.entity";
import { OutletsModule } from "../outlets/outlets.module";

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), OutletsModule],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
