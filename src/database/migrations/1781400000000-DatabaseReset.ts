import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * NEUTRALIZED — This migration originally truncated all tables.
 *
 * It was a development-only reset migration that wiped every row from
 * tokens, attendance, pass_items, passes, walk_in_sessions, customers,
 * assets, categories, users, and outlets, then re-seeded a Super Admin.
 *
 * It has already been recorded as executed (id=10 in the migrations table)
 * on all environments, so TypeORM will never re-run it. The body has been
 * replaced with a no-op to ensure that if a database is ever rebuilt from
 * scratch via `migration:run`, this migration does not destroy data.
 *
 * The Super Admin bootstrap logic has been moved to a dedicated, safe
 * migration: 1781800000000-BootstrapSuperAdmin.ts
 */
export class DatabaseReset1781400000000 implements MigrationInterface {
  name = "DatabaseReset1781400000000";

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // No-op — intentionally neutralized for production safety.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op — nothing to revert.
  }
}
