import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { Pass } from "../passes/pass.entity";
import { Token } from "../passes/token.entity";
import { WalkInSession } from "../walk-in-sessions/walk-in-session.entity";
import { DashboardResponseDto } from "./dto/dashboard-response.dto";

@Injectable()
export class DashboardService {
  constructor(private readonly dataSource: DataSource) {}

  async getDashboard(outletId?: number): Promise<DashboardResponseDto> {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const passRepo = this.dataSource.getRepository(Pass);
    const walkInRepo = this.dataSource.getRepository(WalkInSession);
    const tokenRepo = this.dataSource.getRepository(Token);

    // Today's passes
    const todayPassQuery = passRepo
      .createQueryBuilder("pass")
      .select("COUNT(pass.id)::int", "count")
      .addSelect("COALESCE(SUM(pass.finalAmount), 0)::float", "revenue")
      .where("pass.createdAt BETWEEN :start AND :end", {
        start: startOfDay,
        end: endOfDay,
      });

    if (outletId) {
      todayPassQuery.andWhere("pass.outletId = :outletId", { outletId });
    }
    const todayPassResult: {
      count?: number | string;
      revenue?: number | string;
    } = (await todayPassQuery.getRawOne()) || { count: 0, revenue: 0 };

    // Today's walk-ins
    const todayWalkInQuery = walkInRepo
      .createQueryBuilder("session")
      .select("COUNT(session.id)::int", "count")
      .addSelect("COALESCE(SUM(session.finalAmount), 0)::float", "revenue")
      .where("session.createdAt BETWEEN :start AND :end", {
        start: startOfDay,
        end: endOfDay,
      });

    if (outletId) {
      todayWalkInQuery.andWhere("session.outletId = :outletId", { outletId });
    }
    const todayWalkInResult: {
      count?: number | string;
      revenue?: number | string;
    } = (await todayWalkInQuery.getRawOne()) || { count: 0, revenue: 0 };

    // Today's redemptions (token quantity sum)
    const todayTokenQuery = tokenRepo
      .createQueryBuilder("token")
      .leftJoin("token.pass", "pass")
      .select("COALESCE(SUM(token.redeemedQuantity), 0)::int", "count")
      .where("token.createdAt BETWEEN :start AND :end", {
        start: startOfDay,
        end: endOfDay,
      });

    if (outletId) {
      todayTokenQuery.andWhere("pass.outletId = :outletId", { outletId });
    }
    const todayTokenResult: { count?: number | string } =
      (await todayTokenQuery.getRawOne()) || { count: 0 };

    // Active customers: customers who have at least one active pass
    const activeCustomerQuery = passRepo
      .createQueryBuilder("pass")
      .select("COUNT(DISTINCT pass.customerId)::int", "count")
      .where("pass.status IN (:...statuses)", {
        statuses: ["ACTIVE", "PARTIALLY_REDEEMED"],
      });

    if (outletId) {
      activeCustomerQuery.andWhere("pass.outletId = :outletId", { outletId });
    }
    const activeCustomerResult: { count?: number | string } =
      (await activeCustomerQuery.getRawOne()) || { count: 0 };

    // Monthly revenue: passes + walk-ins for this month
    const monthlyPassQuery = passRepo
      .createQueryBuilder("pass")
      .select("COALESCE(SUM(pass.finalAmount), 0)::float", "revenue")
      .where("pass.createdAt BETWEEN :start AND :end", {
        start: startOfMonth,
        end: endOfMonth,
      });

    if (outletId) {
      monthlyPassQuery.andWhere("pass.outletId = :outletId", { outletId });
    }
    const monthlyPassResult: { revenue?: number | string } =
      (await monthlyPassQuery.getRawOne()) || { revenue: 0 };

    const monthlyWalkInQuery = walkInRepo
      .createQueryBuilder("session")
      .select("COALESCE(SUM(session.finalAmount), 0)::float", "revenue")
      .where("session.createdAt BETWEEN :start AND :end", {
        start: startOfMonth,
        end: endOfMonth,
      });

    if (outletId) {
      monthlyWalkInQuery.andWhere("session.outletId = :outletId", { outletId });
    }
    const monthlyWalkInResult: { revenue?: number | string } =
      (await monthlyWalkInQuery.getRawOne()) || { revenue: 0 };

    const todayPassRevenue = Number(todayPassResult.revenue ?? 0);
    const todayWalkInRevenue = Number(todayWalkInResult.revenue ?? 0);
    const todayWalkInRedemptions = Number(todayWalkInResult.count ?? 0);
    const todayTokenRedemptions = Number(todayTokenResult.count ?? 0);

    const todayPassPaymentBreakdownQuery = passRepo
      .createQueryBuilder("pass")
      .select("pass.paymentMethod", "paymentMethod")
      .addSelect("COUNT(pass.id)::int", "count")
      .addSelect("COALESCE(SUM(pass.finalAmount), 0)::float", "revenue")
      .where("pass.createdAt BETWEEN :start AND :end", {
        start: startOfDay,
        end: endOfDay,
      })
      .groupBy("pass.paymentMethod");

    if (outletId) {
      todayPassPaymentBreakdownQuery.andWhere("pass.outletId = :outletId", {
        outletId,
      });
    }
    const todayPassPaymentBreakdownResult: Array<{
      paymentMethod?: string;
      count: number | string;
      revenue: number | string;
    }> = await todayPassPaymentBreakdownQuery.getRawMany();

    const todayWiPaymentBreakdownQuery = walkInRepo
      .createQueryBuilder("session")
      .select("session.paymentMethod", "paymentMethod")
      .addSelect("COUNT(session.id)::int", "count")
      .addSelect("COALESCE(SUM(session.finalAmount), 0)::float", "revenue")
      .where("session.createdAt BETWEEN :start AND :end", {
        start: startOfDay,
        end: endOfDay,
      })
      .groupBy("session.paymentMethod");

    if (outletId) {
      todayWiPaymentBreakdownQuery.andWhere("session.outletId = :outletId", {
        outletId,
      });
    }
    const todayWiPaymentBreakdownResult: Array<{
      paymentMethod?: string;
      count: number | string;
      revenue: number | string;
    }> = await todayWiPaymentBreakdownQuery.getRawMany();

    const todaySalesByPaymentMethod: Record<
      string,
      { count: number; revenue: number }
    > = {};
    for (const r of todayPassPaymentBreakdownResult) {
      const pm = r.paymentMethod || "UNKNOWN";
      if (!todaySalesByPaymentMethod[pm]) {
        todaySalesByPaymentMethod[pm] = { count: 0, revenue: 0 };
      }
      todaySalesByPaymentMethod[pm].count += Number(r.count);
      todaySalesByPaymentMethod[pm].revenue += Number(r.revenue);
    }
    for (const r of todayWiPaymentBreakdownResult) {
      const pm = r.paymentMethod || "UNKNOWN";
      if (!todaySalesByPaymentMethod[pm]) {
        todaySalesByPaymentMethod[pm] = { count: 0, revenue: 0 };
      }
      todaySalesByPaymentMethod[pm].count += Number(r.count);
      todaySalesByPaymentMethod[pm].revenue += Number(r.revenue);
    }

    return {
      todayRevenue: todayPassRevenue + todayWalkInRevenue,
      todayPassSales: Number(todayPassResult.count ?? 0),
      todayWalkIns: todayWalkInRedemptions,
      todayRedemptions: todayTokenRedemptions + todayWalkInRedemptions,
      activeCustomers: Number(activeCustomerResult.count ?? 0),
      monthlyRevenue:
        Number(monthlyPassResult.revenue ?? 0) +
        Number(monthlyWalkInResult.revenue ?? 0),
      todaySalesByPaymentMethod,
    };
  }
}
