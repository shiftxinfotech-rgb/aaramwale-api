import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Pass } from '../passes/pass.entity';
import { Token } from '../passes/token.entity';
import { WalkInSession } from '../walk-in-sessions/walk-in-session.entity';
import { Customer } from '../customers/customer.entity';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly dataSource: DataSource) {}

  async getDashboard(outletId?: number): Promise<DashboardResponseDto> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const passRepo = this.dataSource.getRepository(Pass);
    const walkInRepo = this.dataSource.getRepository(WalkInSession);
    const tokenRepo = this.dataSource.getRepository(Token);
    const customerRepo = this.dataSource.getRepository(Customer);

    // Today's passes
    const todayPassQuery = passRepo.createQueryBuilder('pass')
      .select('COUNT(pass.id)::int', 'count')
      .addSelect('COALESCE(SUM(pass.finalAmount), 0)::float', 'revenue')
      .where('pass.createdAt BETWEEN :start AND :end', { start: startOfDay, end: endOfDay });

    if (outletId) {
      todayPassQuery.andWhere('pass.outletId = :outletId', { outletId });
    }
    const todayPassResult = await todayPassQuery.getRawOne();

    // Today's walk-ins
    const todayWalkInQuery = walkInRepo.createQueryBuilder('session')
      .select('COUNT(session.id)::int', 'count')
      .addSelect('COALESCE(SUM(session.finalAmount), 0)::float', 'revenue')
      .where('session.createdAt BETWEEN :start AND :end', { start: startOfDay, end: endOfDay });

    if (outletId) {
      todayWalkInQuery.andWhere('session.outletId = :outletId', { outletId });
    }
    const todayWalkInResult = await todayWalkInQuery.getRawOne();

    // Today's redemptions (token quantity sum)
    const todayTokenQuery = tokenRepo.createQueryBuilder('token')
      .leftJoin('token.pass', 'pass')
      .select('COALESCE(SUM(token.redeemedQuantity), 0)::int', 'count')
      .where('token.createdAt BETWEEN :start AND :end', { start: startOfDay, end: endOfDay });

    if (outletId) {
      todayTokenQuery.andWhere('pass.outletId = :outletId', { outletId });
    }
    const todayTokenResult = await todayTokenQuery.getRawOne();

    // Active customers: customers who have at least one active pass
    const activeCustomerQuery = passRepo.createQueryBuilder('pass')
      .select('COUNT(DISTINCT pass.customerId)::int', 'count')
      .where('pass.status IN (:...statuses)', { statuses: ['ACTIVE', 'PARTIALLY_REDEEMED'] });

    if (outletId) {
      activeCustomerQuery.andWhere('pass.outletId = :outletId', { outletId });
    }
    const activeCustomerResult = await activeCustomerQuery.getRawOne();

    // Monthly revenue: passes + walk-ins for this month
    const monthlyPassQuery = passRepo.createQueryBuilder('pass')
      .select('COALESCE(SUM(pass.finalAmount), 0)::float', 'revenue')
      .where('pass.createdAt BETWEEN :start AND :end', { start: startOfMonth, end: endOfMonth });

    if (outletId) {
      monthlyPassQuery.andWhere('pass.outletId = :outletId', { outletId });
    }
    const monthlyPassResult = await monthlyPassQuery.getRawOne();

    const monthlyWalkInQuery = walkInRepo.createQueryBuilder('session')
      .select('COALESCE(SUM(session.finalAmount), 0)::float', 'revenue')
      .where('session.createdAt BETWEEN :start AND :end', { start: startOfMonth, end: endOfMonth });

    if (outletId) {
      monthlyWalkInQuery.andWhere('session.outletId = :outletId', { outletId });
    }
    const monthlyWalkInResult = await monthlyWalkInQuery.getRawOne();

    const todayPassRevenue = Number(todayPassResult.revenue ?? 0);
    const todayWalkInRevenue = Number(todayWalkInResult.revenue ?? 0);
    const todayWalkInRedemptions = Number(todayWalkInResult.count ?? 0);
    const todayTokenRedemptions = Number(todayTokenResult.count ?? 0);

    return {
      todayRevenue: todayPassRevenue + todayWalkInRevenue,
      todayPassSales: Number(todayPassResult.count ?? 0),
      todayWalkIns: todayWalkInRedemptions,
      todayRedemptions: todayTokenRedemptions + todayWalkInRedemptions,
      activeCustomers: Number(activeCustomerResult.count ?? 0),
      monthlyRevenue: Number(monthlyPassResult.revenue ?? 0) + Number(monthlyWalkInResult.revenue ?? 0),
    };
  }
}
