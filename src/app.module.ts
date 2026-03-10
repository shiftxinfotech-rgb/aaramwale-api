import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OutletsModule } from './outlets/outlets.module';
import { ChairsModule } from './chairs/chairs.module';
import { TokensModule } from './tokens/tokens.module';
import { CustomersModule } from './customers/customers.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AdminModule } from './admin/admin.module';
import { getTypeOrmConfig } from './database/typeorm.config';

@Module({
  imports: [
    // Loads .env file
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Connects NestJS to PostgreSQL after env has been loaded
    TypeOrmModule.forRootAsync({
      useFactory: () => getTypeOrmConfig(),
    }),

    AuthModule,
    UsersModule,
    EmployeesModule,
    AdminModule,
    OutletsModule,
    ChairsModule,
    TokensModule,
    CustomersModule,
    AttendanceModule,
  ],
})
export class AppModule { }
