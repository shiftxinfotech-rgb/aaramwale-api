import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Category } from "../categories/category.entity";
import { Asset } from "../assets/asset.entity";
import { Outlet } from "../outlets/outlet.entity";
import { Customer } from "../customers/customer.entity";
import { WalkInSession } from "../walk-in-sessions/walk-in-session.entity";
import { Token } from "../passes/token.entity";
import { User } from "../users/user.entity";

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Outlet)
    private outletRepository: Repository<Outlet>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(WalkInSession)
    private walkInSessionRepository: Repository<WalkInSession>,
    private dataSource: DataSource,
  ) {}

  async getCategoryWise(fromDate?: string, toDate?: string): Promise<any[]> {
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
    });

    // Query Pass Items Revenue
    const passQuery = this.dataSource
      .createQueryBuilder("pass_items", "item")
      .select("item.categoryId", "categoryId")
      .addSelect("COUNT(item.id)::int", "totalPasses")
      .addSelect("COALESCE(SUM(item.lineTotal), 0)::float", "totalRevenue");

    // Query Walk-Ins Revenue
    const wiQuery = this.walkInSessionRepository
      .createQueryBuilder("session")
      .select("session.categoryId", "categoryId")
      .addSelect("COUNT(session.id)::int", "totalWalkIns")
      .addSelect(
        "COALESCE(SUM(session.finalAmount), 0)::float",
        "totalRevenue",
      );

    // Query pass items grouped by categoryId AND parent pass's paymentMethod
    const passPaymentQuery = this.dataSource
      .createQueryBuilder("pass_items", "item")
      .leftJoin("passes", "pass", "pass.id = item.passId")
      .select("item.categoryId", "categoryId")
      .addSelect("pass.paymentMethod", "paymentMethod")
      .addSelect("COALESCE(SUM(item.lineTotal), 0)::float", "totalRevenue");

    // Query walk-in sessions grouped by categoryId AND paymentMethod
    const wiPaymentQuery = this.walkInSessionRepository
      .createQueryBuilder("session")
      .select("session.categoryId", "categoryId")
      .addSelect("session.paymentMethod", "paymentMethod")
      .addSelect(
        "COALESCE(SUM(session.finalAmount), 0)::float",
        "totalRevenue",
      );

    if (fromDate) {
      passQuery.andWhere("item.createdAt >= :fromDate", {
        fromDate: new Date(`${fromDate}T00:00:00.000Z`),
      });
      wiQuery.andWhere("session.sessionDate >= :fromDate", { fromDate });
      passPaymentQuery.andWhere("item.createdAt >= :fromDate", {
        fromDate: new Date(`${fromDate}T00:00:00.000Z`),
      });
      wiPaymentQuery.andWhere("session.sessionDate >= :fromDate", { fromDate });
    }
    if (toDate) {
      passQuery.andWhere("item.createdAt <= :toDate", {
        toDate: new Date(`${toDate}T23:59:59.999Z`),
      });
      wiQuery.andWhere("session.sessionDate <= :toDate", { toDate });
      passPaymentQuery.andWhere("item.createdAt <= :toDate", {
        toDate: new Date(`${toDate}T23:59:59.999Z`),
      });
      wiPaymentQuery.andWhere("session.sessionDate <= :toDate", { toDate });
    }

    const passRes: Array<{
      categoryId: number;
      totalPasses: number | string;
      totalRevenue: number | string;
    }> = await passQuery.groupBy("item.categoryId").getRawMany();
    const wiRes: Array<{
      categoryId: number;
      totalWalkIns: number | string;
      totalRevenue: number | string;
    }> = await wiQuery.groupBy("session.categoryId").getRawMany();
    const passPaymentRes: Array<{
      categoryId: number;
      paymentMethod?: string;
      totalRevenue: number | string;
    }> = await passPaymentQuery
      .groupBy("item.categoryId")
      .addGroupBy("pass.paymentMethod")
      .getRawMany();
    const wiPaymentRes: Array<{
      categoryId: number;
      paymentMethod?: string;
      totalRevenue: number | string;
    }> = await wiPaymentQuery
      .groupBy("session.categoryId")
      .addGroupBy("session.paymentMethod")
      .getRawMany();

    const passMap = new Map<number, { count: number; rev: number }>();
    for (const r of passRes) {
      passMap.set(Number(r.categoryId), {
        count: Number(r.totalPasses),
        rev: Number(r.totalRevenue),
      });
    }

    const wiMap = new Map<number, { count: number; rev: number }>();
    for (const r of wiRes) {
      wiMap.set(Number(r.categoryId), {
        count: Number(r.totalWalkIns),
        rev: Number(r.totalRevenue),
      });
    }

    const categoryPaymentMap = new Map<number, Record<string, number>>();
    for (const r of passPaymentRes) {
      const cid = Number(r.categoryId);
      const pm = r.paymentMethod || "UNKNOWN";
      const rev = Number(r.totalRevenue);
      if (!categoryPaymentMap.has(cid)) {
        categoryPaymentMap.set(cid, {});
      }
      categoryPaymentMap.get(cid)![pm] =
        (categoryPaymentMap.get(cid)![pm] ?? 0) + rev;
    }
    for (const r of wiPaymentRes) {
      const cid = Number(r.categoryId);
      const pm = r.paymentMethod || "UNKNOWN";
      const rev = Number(r.totalRevenue);
      if (!categoryPaymentMap.has(cid)) {
        categoryPaymentMap.set(cid, {});
      }
      categoryPaymentMap.get(cid)![pm] =
        (categoryPaymentMap.get(cid)![pm] ?? 0) + rev;
    }

    return categories
      .map((cat) => {
        const p = passMap.get(cat.id) ?? { count: 0, rev: 0 };
        const w = wiMap.get(cat.id) ?? { count: 0, rev: 0 };

        return {
          categoryId: cat.id,
          categoryName: cat.name,
          totalPasses: p.count,
          totalWalkIns: w.count,
          totalRevenue: p.rev + w.rev,
          paymentMethods: categoryPaymentMap.get(cat.id) ?? {},
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getAssetWise(fromDate?: string, toDate?: string): Promise<any[]> {
    const assets = await this.assetRepository.find({
      where: { isActive: true },
    });

    // Query Pass Items
    const passQuery = this.dataSource
      .createQueryBuilder("pass_items", "item")
      .select("item.assetId", "assetId")
      .addSelect("COUNT(item.id)::int", "totalPasses")
      .addSelect("COALESCE(SUM(item.lineTotal), 0)::float", "totalRevenue");

    // Query Walk-Ins
    const wiQuery = this.walkInSessionRepository
      .createQueryBuilder("session")
      .select("session.assetId", "assetId")
      .addSelect("COUNT(session.id)::int", "totalWalkIns")
      .addSelect(
        "COALESCE(SUM(session.finalAmount), 0)::float",
        "totalRevenue",
      );

    // Query pass items grouped by assetId AND parent pass's paymentMethod
    const passPaymentQuery = this.dataSource
      .createQueryBuilder("pass_items", "item")
      .leftJoin("passes", "pass", "pass.id = item.passId")
      .select("item.assetId", "assetId")
      .addSelect("pass.paymentMethod", "paymentMethod")
      .addSelect("COALESCE(SUM(item.lineTotal), 0)::float", "totalRevenue");

    // Query walk-in sessions grouped by assetId AND paymentMethod
    const wiPaymentQuery = this.walkInSessionRepository
      .createQueryBuilder("session")
      .select("session.assetId", "assetId")
      .addSelect("session.paymentMethod", "paymentMethod")
      .addSelect(
        "COALESCE(SUM(session.finalAmount), 0)::float",
        "totalRevenue",
      );

    if (fromDate) {
      passQuery.andWhere("item.createdAt >= :fromDate", {
        fromDate: new Date(`${fromDate}T00:00:00.000Z`),
      });
      wiQuery.andWhere("session.sessionDate >= :fromDate", { fromDate });
      passPaymentQuery.andWhere("item.createdAt >= :fromDate", {
        fromDate: new Date(`${fromDate}T00:00:00.000Z`),
      });
      wiPaymentQuery.andWhere("session.sessionDate >= :fromDate", { fromDate });
    }
    if (toDate) {
      passQuery.andWhere("item.createdAt <= :toDate", {
        toDate: new Date(`${toDate}T23:59:59.999Z`),
      });
      wiQuery.andWhere("session.sessionDate <= :toDate", { toDate });
      passPaymentQuery.andWhere("item.createdAt <= :toDate", {
        toDate: new Date(`${toDate}T23:59:59.999Z`),
      });
      wiPaymentQuery.andWhere("session.sessionDate <= :toDate", { toDate });
    }

    const passRes: Array<{
      assetId: number;
      totalPasses: number | string;
      totalRevenue: number | string;
    }> = await passQuery.groupBy("item.assetId").getRawMany();
    const wiRes: Array<{
      assetId: number;
      totalWalkIns: number | string;
      totalRevenue: number | string;
    }> = await wiQuery.groupBy("session.assetId").getRawMany();
    const passPaymentRes: Array<{
      assetId: number;
      paymentMethod?: string;
      totalRevenue: number | string;
    }> = await passPaymentQuery
      .groupBy("item.assetId")
      .addGroupBy("pass.paymentMethod")
      .getRawMany();
    const wiPaymentRes: Array<{
      assetId: number;
      paymentMethod?: string;
      totalRevenue: number | string;
    }> = await wiPaymentQuery
      .groupBy("session.assetId")
      .addGroupBy("session.paymentMethod")
      .getRawMany();

    const passMap = new Map<number, { count: number; rev: number }>();
    for (const r of passRes) {
      passMap.set(Number(r.assetId), {
        count: Number(r.totalPasses),
        rev: Number(r.totalRevenue),
      });
    }

    const wiMap = new Map<number, { count: number; rev: number }>();
    for (const r of wiRes) {
      wiMap.set(Number(r.assetId), {
        count: Number(r.totalWalkIns),
        rev: Number(r.totalRevenue),
      });
    }

    const assetPaymentMap = new Map<number, Record<string, number>>();
    for (const r of passPaymentRes) {
      const aid = Number(r.assetId);
      const pm = r.paymentMethod || "UNKNOWN";
      const rev = Number(r.totalRevenue);
      if (!assetPaymentMap.has(aid)) {
        assetPaymentMap.set(aid, {});
      }
      assetPaymentMap.get(aid)![pm] =
        (assetPaymentMap.get(aid)![pm] ?? 0) + rev;
    }
    for (const r of wiPaymentRes) {
      const aid = Number(r.assetId);
      const pm = r.paymentMethod || "UNKNOWN";
      const rev = Number(r.totalRevenue);
      if (!assetPaymentMap.has(aid)) {
        assetPaymentMap.set(aid, {});
      }
      assetPaymentMap.get(aid)![pm] =
        (assetPaymentMap.get(aid)![pm] ?? 0) + rev;
    }

    return assets
      .map((asset) => {
        const p = passMap.get(asset.id) ?? { count: 0, rev: 0 };
        const w = wiMap.get(asset.id) ?? { count: 0, rev: 0 };

        return {
          assetId: asset.id,
          assetCode: asset.assetCode,
          assetName: asset.assetName,
          totalPasses: p.count,
          totalWalkIns: w.count,
          totalRevenue: p.rev + w.rev,
          paymentMethods: assetPaymentMap.get(asset.id) ?? {},
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getOutletWise(fromDate?: string, toDate?: string): Promise<any[]> {
    const outlets = await this.outletRepository.find({
      where: { isActive: true },
    });

    // Query Passes finalAmount
    const passQuery = this.dataSource
      .createQueryBuilder("passes", "pass")
      .select("pass.outletId", "outletId")
      .addSelect("COUNT(pass.id)::int", "totalPasses")
      .addSelect("COALESCE(SUM(pass.finalAmount), 0)::float", "totalRevenue");

    // Query Walk-Ins finalAmount
    const wiQuery = this.walkInSessionRepository
      .createQueryBuilder("session")
      .select("session.outletId", "outletId")
      .addSelect("COUNT(session.id)::int", "totalWalkIns")
      .addSelect(
        "COALESCE(SUM(session.finalAmount), 0)::float",
        "totalRevenue",
      );

    // Query passes grouped by outletId AND paymentMethod
    const passPaymentQuery = this.dataSource
      .createQueryBuilder("passes", "pass")
      .select("pass.outletId", "outletId")
      .addSelect("pass.paymentMethod", "paymentMethod")
      .addSelect("COALESCE(SUM(pass.finalAmount), 0)::float", "totalRevenue");

    // Query walk-in sessions grouped by outletId AND paymentMethod
    const wiPaymentQuery = this.walkInSessionRepository
      .createQueryBuilder("session")
      .select("session.outletId", "outletId")
      .addSelect("session.paymentMethod", "paymentMethod")
      .addSelect(
        "COALESCE(SUM(session.finalAmount), 0)::float",
        "totalRevenue",
      );

    if (fromDate) {
      passQuery.andWhere("pass.createdAt >= :fromDate", {
        fromDate: new Date(`${fromDate}T00:00:00.000Z`),
      });
      wiQuery.andWhere("session.sessionDate >= :fromDate", { fromDate });
      passPaymentQuery.andWhere("pass.createdAt >= :fromDate", {
        fromDate: new Date(`${fromDate}T00:00:00.000Z`),
      });
      wiPaymentQuery.andWhere("session.sessionDate >= :fromDate", { fromDate });
    }
    if (toDate) {
      passQuery.andWhere("pass.createdAt <= :toDate", {
        toDate: new Date(`${toDate}T23:59:59.999Z`),
      });
      wiQuery.andWhere("session.sessionDate <= :toDate", { toDate });
      passPaymentQuery.andWhere("pass.createdAt <= :toDate", {
        toDate: new Date(`${toDate}T23:59:59.999Z`),
      });
      wiPaymentQuery.andWhere("session.sessionDate <= :toDate", { toDate });
    }

    const passRes: Array<{
      outletId: number;
      totalPasses: number | string;
      totalRevenue: number | string;
    }> = await passQuery.groupBy("pass.outletId").getRawMany();
    const wiRes: Array<{
      outletId: number;
      totalWalkIns: number | string;
      totalRevenue: number | string;
    }> = await wiQuery.groupBy("session.outletId").getRawMany();
    const passPaymentRes: Array<{
      outletId: number;
      paymentMethod?: string;
      totalRevenue: number | string;
    }> = await passPaymentQuery
      .groupBy("pass.outletId")
      .addGroupBy("pass.paymentMethod")
      .getRawMany();
    const wiPaymentRes: Array<{
      outletId: number;
      paymentMethod?: string;
      totalRevenue: number | string;
    }> = await wiPaymentQuery
      .groupBy("session.outletId")
      .addGroupBy("session.paymentMethod")
      .getRawMany();

    const passMap = new Map<number, { count: number; rev: number }>();
    for (const r of passRes) {
      passMap.set(Number(r.outletId), {
        count: Number(r.totalPasses),
        rev: Number(r.totalRevenue),
      });
    }

    const wiMap = new Map<number, { count: number; rev: number }>();
    for (const r of wiRes) {
      wiMap.set(Number(r.outletId), {
        count: Number(r.totalWalkIns),
        rev: Number(r.totalRevenue),
      });
    }

    const outletPaymentMap = new Map<number, Record<string, number>>();
    for (const r of passPaymentRes) {
      const oid = Number(r.outletId);
      const pm = r.paymentMethod || "UNKNOWN";
      const rev = Number(r.totalRevenue);
      if (!outletPaymentMap.has(oid)) {
        outletPaymentMap.set(oid, {});
      }
      outletPaymentMap.get(oid)![pm] =
        (outletPaymentMap.get(oid)![pm] ?? 0) + rev;
    }
    for (const r of wiPaymentRes) {
      const oid = Number(r.outletId);
      const pm = r.paymentMethod || "UNKNOWN";
      const rev = Number(r.totalRevenue);
      if (!outletPaymentMap.has(oid)) {
        outletPaymentMap.set(oid, {});
      }
      outletPaymentMap.get(oid)![pm] =
        (outletPaymentMap.get(oid)![pm] ?? 0) + rev;
    }

    return outlets
      .map((outlet) => {
        const p = passMap.get(outlet.id) ?? { count: 0, rev: 0 };
        const w = wiMap.get(outlet.id) ?? { count: 0, rev: 0 };

        return {
          outletId: outlet.id,
          outletName: outlet.name,
          totalPasses: p.count,
          totalWalkIns: w.count,
          totalRevenue: p.rev + w.rev,
          paymentMethods: outletPaymentMap.get(outlet.id) ?? {},
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getTopCustomers(fromDate?: string, toDate?: string): Promise<any[]> {
    // Top customers CLV: Passes sold + Walk-Ins spent
    const passQuery = this.dataSource
      .createQueryBuilder("passes", "pass")
      .select("pass.customerId", "customerId")
      .addSelect("COUNT(pass.id)::int", "totalPasses")
      .addSelect("COALESCE(SUM(pass.finalAmount), 0)::float", "totalRevenue");

    const wiQuery = this.walkInSessionRepository
      .createQueryBuilder("session")
      .select("session.customerId", "customerId")
      .addSelect("COUNT(session.id)::int", "totalWalkIns")
      .addSelect(
        "COALESCE(SUM(session.finalAmount), 0)::float",
        "totalRevenue",
      );

    if (fromDate) {
      passQuery.andWhere("pass.createdAt >= :fromDate", {
        fromDate: new Date(`${fromDate}T00:00:00.000Z`),
      });
      wiQuery.andWhere("session.sessionDate >= :fromDate", { fromDate });
    }
    if (toDate) {
      passQuery.andWhere("pass.createdAt <= :toDate", {
        toDate: new Date(`${toDate}T23:59:59.999Z`),
      });
      wiQuery.andWhere("session.sessionDate <= :toDate", { toDate });
    }

    const passRes: Array<{
      customerId: number;
      totalPasses: number | string;
      totalRevenue: number | string;
    }> = await passQuery.groupBy("pass.customerId").getRawMany();
    const wiRes: Array<{
      customerId: number;
      totalWalkIns: number | string;
      totalRevenue: number | string;
    }> = await wiQuery.groupBy("session.customerId").getRawMany();

    const passMap = new Map<number, { count: number; rev: number }>();
    for (const r of passRes) {
      passMap.set(Number(r.customerId), {
        count: Number(r.totalPasses),
        rev: Number(r.totalRevenue),
      });
    }

    const wiMap = new Map<number, { count: number; rev: number }>();
    for (const r of wiRes) {
      wiMap.set(Number(r.customerId), {
        count: Number(r.totalWalkIns),
        rev: Number(r.totalRevenue),
      });
    }

    const customers = await this.customerRepository.find();

    return customers
      .map((c) => {
        const p = passMap.get(c.id) ?? { count: 0, rev: 0 };
        const w = wiMap.get(c.id) ?? { count: 0, rev: 0 };

        return {
          customerId: c.id,
          customerName: c.name,
          customerPhone: c.mobile,
          totalPasses: p.count,
          totalWalkIns: w.count,
          totalSpend: p.rev + w.rev,
        };
      })
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 10);
  }

  async getMostUsedAssets(fromDate?: string, toDate?: string): Promise<any[]> {
    // Consumption asset utilization: query sum of redeemed quantity from tokens
    const query = this.dataSource
      .getRepository(Token)
      .createQueryBuilder("token")
      .leftJoin("assets", "asset", "asset.id = token.assetId")
      .select([
        'asset.id AS "assetId"',
        'asset.assetCode AS "assetCode"',
        'asset.assetName AS "assetName"',
        'SUM(token.redeemedQuantity)::int AS "totalUsage"',
      ])
      .groupBy("asset.id")
      .addGroupBy("asset.assetCode")
      .addGroupBy("asset.assetName")
      .orderBy('"totalUsage"', "DESC")
      .limit(10);

    if (fromDate) {
      query.andWhere("token.redeemedAt >= :fromDate", {
        fromDate: new Date(`${fromDate}T00:00:00.000Z`),
      });
    }
    if (toDate) {
      query.andWhere("token.redeemedAt <= :toDate", {
        toDate: new Date(`${toDate}T23:59:59.999Z`),
      });
    }

    return query.getRawMany();
  }

  async getEmployeeWise(fromDate?: string, toDate?: string): Promise<any[]> {
    // Revenue by Employee (Admin/Employee sales): query passes and walk-ins finalAmount
    const passQuery = this.dataSource
      .createQueryBuilder("passes", "pass")
      .select("pass.generatedByUserId", "employeeId")
      .addSelect("COALESCE(SUM(pass.finalAmount), 0)::float", "revenue");

    const wiQuery = this.walkInSessionRepository
      .createQueryBuilder("session")
      .select("session.employeeId", "employeeId")
      .addSelect("COALESCE(SUM(session.finalAmount), 0)::float", "revenue");

    // Query passes grouped by generatedByUserId AND paymentMethod
    const passPaymentQuery = this.dataSource
      .createQueryBuilder("passes", "pass")
      .select("pass.generatedByUserId", "employeeId")
      .addSelect("pass.paymentMethod", "paymentMethod")
      .addSelect("COALESCE(SUM(pass.finalAmount), 0)::float", "totalRevenue");

    // Query walk-in sessions grouped by employeeId AND paymentMethod
    const wiPaymentQuery = this.walkInSessionRepository
      .createQueryBuilder("session")
      .select("session.employeeId", "employeeId")
      .addSelect("session.paymentMethod", "paymentMethod")
      .addSelect(
        "COALESCE(SUM(session.finalAmount), 0)::float",
        "totalRevenue",
      );

    if (fromDate) {
      passQuery.andWhere("pass.createdAt >= :fromDate", {
        fromDate: new Date(`${fromDate}T00:00:00.000Z`),
      });
      wiQuery.andWhere("session.sessionDate >= :fromDate", { fromDate });
      passPaymentQuery.andWhere("pass.createdAt >= :fromDate", {
        fromDate: new Date(`${fromDate}T00:00:00.000Z`),
      });
      wiPaymentQuery.andWhere("session.sessionDate >= :fromDate", { fromDate });
    }
    if (toDate) {
      passQuery.andWhere("pass.createdAt <= :toDate", {
        toDate: new Date(`${toDate}T23:59:59.999Z`),
      });
      wiQuery.andWhere("session.sessionDate <= :toDate", { toDate });
      passPaymentQuery.andWhere("pass.createdAt <= :toDate", {
        toDate: new Date(`${toDate}T23:59:59.999Z`),
      });
      wiPaymentQuery.andWhere("session.sessionDate <= :toDate", { toDate });
    }

    const passRes: Array<{ employeeId: number; revenue: number | string }> =
      await passQuery.groupBy("pass.generatedByUserId").getRawMany();
    const wiRes: Array<{ employeeId: number; revenue: number | string }> =
      await wiQuery.groupBy("session.employeeId").getRawMany();
    const passPaymentRes: Array<{
      employeeId: number;
      paymentMethod?: string;
      totalRevenue: number | string;
    }> = await passPaymentQuery
      .groupBy("pass.generatedByUserId")
      .addGroupBy("pass.paymentMethod")
      .getRawMany();
    const wiPaymentRes: Array<{
      employeeId: number;
      paymentMethod?: string;
      totalRevenue: number | string;
    }> = await wiPaymentQuery
      .groupBy("session.employeeId")
      .addGroupBy("session.paymentMethod")
      .getRawMany();

    const passMap = new Map<number, number>();
    for (const r of passRes) {
      passMap.set(Number(r.employeeId), Number(r.revenue));
    }

    const wiMap = new Map<number, number>();
    for (const r of wiRes) {
      wiMap.set(Number(r.employeeId), Number(r.revenue));
    }

    const employeePaymentMap = new Map<number, Record<string, number>>();
    for (const r of passPaymentRes) {
      const eid = Number(r.employeeId);
      const pm = r.paymentMethod || "UNKNOWN";
      const rev = Number(r.totalRevenue);
      if (!employeePaymentMap.has(eid)) {
        employeePaymentMap.set(eid, {});
      }
      employeePaymentMap.get(eid)![pm] =
        (employeePaymentMap.get(eid)![pm] ?? 0) + rev;
    }
    for (const r of wiPaymentRes) {
      const eid = Number(r.employeeId);
      const pm = r.paymentMethod || "UNKNOWN";
      const rev = Number(r.totalRevenue);
      if (!employeePaymentMap.has(eid)) {
        employeePaymentMap.set(eid, {});
      }
      employeePaymentMap.get(eid)![pm] =
        (employeePaymentMap.get(eid)![pm] ?? 0) + rev;
    }

    const employees = await this.dataSource.getRepository(User).find();

    return employees
      .map((emp) => {
        const pRev = passMap.get(emp.id) ?? 0;
        const wRev = wiMap.get(emp.id) ?? 0;

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          employeeEmail: emp.email,
          role: emp.role,
          passesRevenue: pRev,
          walkInRevenue: wRev,
          totalRevenue: pRev + wRev,
          paymentMethods: employeePaymentMap.get(emp.id) ?? {},
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getConsumptionStats(fromDate?: string, toDate?: string): Promise<any> {
    // Total sessions and free sessions consumed: query tokens
    const query = this.dataSource
      .getRepository(Token)
      .createQueryBuilder("token")
      .select("COALESCE(SUM(token.redeemedQuantity), 0)::int", "totalConsumed")
      .addSelect(
        "COALESCE(SUM(CASE WHEN token.isFreeConsumption = true THEN token.redeemedQuantity ELSE 0 END), 0)::int",
        "freeConsumed",
      );

    if (fromDate) {
      query.andWhere("token.redeemedAt >= :fromDate", {
        fromDate: new Date(`${fromDate}T00:00:00.000Z`),
      });
    }
    if (toDate) {
      query.andWhere("token.redeemedAt <= :toDate", {
        toDate: new Date(`${toDate}T23:59:59.999Z`),
      });
    }

    const res:
      | { totalConsumed?: number | string; freeConsumed?: number | string }
      | undefined = await query.getRawOne();
    return {
      totalSessionsConsumed: Number(res?.totalConsumed ?? 0),
      freeSessionsConsumed: Number(res?.freeConsumed ?? 0),
      paidSessionsConsumed:
        Number(res?.totalConsumed ?? 0) - Number(res?.freeConsumed ?? 0),
    };
  }

  async getEmployeeRedemptions(
    fromDate?: string,
    toDate?: string,
  ): Promise<any[]> {
    // Employee Redemptions: Sessions redeemed by each employee (tokens.redeemedByUserId)
    const query = this.dataSource
      .getRepository(Token)
      .createQueryBuilder("token")
      .leftJoin("users", "user", "user.id = token.redeemedByUserId")
      .select([
        'user.id AS "employeeId"',
        'user.name AS "employeeName"',
        'SUM(token.redeemedQuantity)::int AS "sessionsRedeemed"',
      ])
      .groupBy("user.id")
      .addGroupBy("user.name")
      .orderBy('"sessionsRedeemed"', "DESC");

    if (fromDate) {
      query.andWhere("token.redeemedAt >= :fromDate", {
        fromDate: new Date(`${fromDate}T00:00:00.000Z`),
      });
    }
    if (toDate) {
      query.andWhere("token.redeemedAt <= :toDate", {
        toDate: new Date(`${toDate}T23:59:59.999Z`),
      });
    }

    return query.getRawMany();
  }

  async getCustomerUsageHistory(customerId: number): Promise<any[]> {
    // Customer usage history: tokens join passes
    return this.dataSource
      .getRepository(Token)
      .createQueryBuilder("token")
      .leftJoinAndSelect("token.pass", "pass")
      .leftJoinAndSelect("token.asset", "asset")
      .leftJoin("users", "employee", "employee.id = token.redeemedByUserId")
      .select([
        'token.id AS "id"',
        'pass.passNumber AS "passNumber"',
        'asset.assetName AS "assetName"',
        'token.redeemedQuantity AS "redeemedQuantity"',
        'token.isFreeConsumption AS "isFreeConsumption"',
        'employee.name AS "employeeName"',
        'token.remarks AS "remarks"',
        'token.redeemedAt AS "redeemedAt"',
      ])
      .where("pass.customerId = :customerId", { customerId })
      .orderBy("token.redeemedAt", "DESC")
      .getRawMany();
  }
}
