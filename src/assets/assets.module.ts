import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Asset } from "./asset.entity";
import { AssetsService } from "./assets.service";
import { AssetsController } from "./assets.controller";
import { CategoriesModule } from "../categories/categories.module";
import { OutletsModule } from "../outlets/outlets.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset]),
    CategoriesModule,
    forwardRef(() => OutletsModule),
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService, TypeOrmModule],
})
export class AssetsModule {}
