import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OutletsModule } from './outlets/outlets.module';
import { CategoriesModule } from './categories/categories.module';
import { AssetsModule } from './assets/assets.module';
import { PassesModule } from './passes/passes.module';
import { ReportsModule } from './reports/reports.module';
import { CustomersModule } from './customers/customers.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AdminModule } from './admin/admin.module';
import { WalkInSessionsModule } from './walk-in-sessions/walk-in-sessions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SearchModule } from './search/search.module';
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
    CategoriesModule,
    AssetsModule,
    PassesModule,
    ReportsModule,
    CustomersModule,
    AttendanceModule,
    WalkInSessionsModule,
    DashboardModule,
    SearchModule,
  ],
})
export class AppModule { }
