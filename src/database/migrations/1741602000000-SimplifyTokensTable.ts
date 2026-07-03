import { MigrationInterface, QueryRunner } from "typeorm";

export class SimplifyTokensTable1741602000000 implements MigrationInterface {
  name = "SimplifyTokensTable1741602000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable("tokens");
    if (!hasTable) return;

    // DROP COLUMNs — already guarded with IF EXISTS
    await queryRunner.query(`
      ALTER TABLE "tokens"
      DROP COLUMN IF EXISTS "tokenNumber",
      DROP COLUMN IF EXISTS "customerName",
      DROP COLUMN IF EXISTS "startTime",
      DROP COLUMN IF EXISTS "endTime"
    `);

    // UPDATE status — only if the column exists
    const statusColExists = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2) AS "exists"`,
      ["tokens", "status"],
    );
    if (statusColExists[0].exists) {
      await queryRunner.query(`
        UPDATE "tokens"
        SET "status" = 'ACTIVE'
        WHERE "status" IS NULL
      `);

      await queryRunner.query(`
        ALTER TABLE "tokens"
        ALTER COLUMN "status" SET DEFAULT 'ACTIVE'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable("tokens");
    if (!hasTable) return;

    // Re-add dropped columns
    await queryRunner.query(`
      ALTER TABLE "tokens"
      ADD COLUMN IF NOT EXISTS "tokenNumber" character varying,
      ADD COLUMN IF NOT EXISTS "customerName" character varying,
      ADD COLUMN IF NOT EXISTS "startTime" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "endTime" TIMESTAMP
    `);

    // Backfill tokenNumber — only if outletId and chairId columns still exist
    const outletIdCol = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2) AS "exists"`,
      ["tokens", "outletId"],
    );
    const chairIdCol = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2) AS "exists"`,
      ["tokens", "chairId"],
    );
    const tokenNumberCol = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2) AS "exists"`,
      ["tokens", "tokenNumber"],
    );

    if (outletIdCol[0].exists && chairIdCol[0].exists && tokenNumberCol[0].exists) {
      await queryRunner.query(`
        UPDATE "tokens"
        SET "tokenNumber" = CONCAT(
          TO_CHAR("createdAt", 'YYYYMMDD'),
          '-',
          "outletId",
          '-',
          "chairId",
          '-',
          "id"
        )
        WHERE "tokenNumber" IS NULL
      `);
    }
  }
}
