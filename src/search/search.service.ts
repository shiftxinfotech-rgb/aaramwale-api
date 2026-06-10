import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Pass } from '../passes/pass.entity';
import { Asset } from '../assets/asset.entity';
import { WalkInSession } from '../walk-in-sessions/walk-in-session.entity';

@Injectable()
export class SearchService {
  constructor(private readonly dataSource: DataSource) {}

  async globalSearch(q: string, outletId?: number): Promise<any> {
    if (!q || q.trim().length === 0) {
      return { customers: [], passes: [], assets: [], walkInSessions: [] };
    }

    const term = `%${q.trim()}%`;

    const [customers, passes, assets, walkInSessions] = await Promise.all([
      this.searchCustomers(term, outletId),
      this.searchPasses(term, outletId),
      this.searchAssets(term, outletId),
      this.searchWalkInSessions(term, outletId),
    ]);

    return { customers, passes, assets, walkInSessions };
  }

  private async searchCustomers(term: string, outletId?: number): Promise<any[]> {
    const qb = this.dataSource.getRepository(Customer)
      .createQueryBuilder('customer')
      .select(['customer.id', 'customer.name', 'customer.phone'])
      .where('(customer.name ILIKE :term OR customer.phone ILIKE :term)', { term })
      .limit(5);

    if (outletId) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM passes p WHERE p."customerId" = customer.id AND p."outletId" = :outletId)`,
        { outletId }
      );
    }

    return qb.getMany();
  }

  private async searchPasses(term: string, outletId?: number): Promise<any[]> {
    const qb = this.dataSource.getRepository(Pass)
      .createQueryBuilder('pass')
      .leftJoin('pass.customer', 'customer')
      .select([
        'pass.id',
        'pass.passNumber',
        'pass.status',
        'pass.finalAmount',
        'customer.id',
        'customer.name',
        'customer.phone',
      ])
      .where('(pass.passNumber ILIKE :term OR customer.name ILIKE :term OR customer.phone ILIKE :term)', { term })
      .orderBy('pass.createdAt', 'DESC')
      .limit(5);

    if (outletId) {
      qb.andWhere('pass.outletId = :outletId', { outletId });
    }

    return qb.getMany();
  }

  private async searchAssets(term: string, outletId?: number): Promise<any[]> {
    const qb = this.dataSource.getRepository(Asset)
      .createQueryBuilder('asset')
      .select(['asset.id', 'asset.assetCode', 'asset.assetName', 'asset.unitPrice', 'asset.isActive'])
      .where('(asset.assetName ILIKE :term OR asset.assetCode ILIKE :term)', { term })
      .andWhere('asset.isActive = true')
      .limit(5);

    if (outletId) {
      qb.andWhere('asset.outletId = :outletId', { outletId });
    }

    return qb.getMany();
  }

  private async searchWalkInSessions(term: string, outletId?: number): Promise<any[]> {
    const qb = this.dataSource.getRepository(WalkInSession)
      .createQueryBuilder('session')
      .leftJoin('session.customer', 'customer')
      .select([
        'session.id',
        'session.sessionNumber',
        'session.sessionDate',
        'session.finalAmount',
        'customer.id',
        'customer.name',
        'customer.phone',
      ])
      .where('(session.sessionNumber ILIKE :term OR customer.name ILIKE :term OR customer.phone ILIKE :term)', { term })
      .orderBy('session.createdAt', 'DESC')
      .limit(5);

    if (outletId) {
      qb.andWhere('session.outletId = :outletId', { outletId });
    }

    return qb.getMany();
  }
}
