import "dotenv/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSourceOptions } from "typeorm";

export const getTypeOrmConfig = (): TypeOrmModuleOptions => ({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/migrations/*{.ts,.js}"],
  synchronize: process.env.NODE_ENV !== "production",
  migrationsRun: true,
  logging: false,
});

export const dataSourceOptions: DataSourceOptions = {
  ...(getTypeOrmConfig() as DataSourceOptions),
};
