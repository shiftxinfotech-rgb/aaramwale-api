import { MigrationInterface, QueryRunner } from "typeorm";

export class SimplifyTokensTable1741602000000 implements MigrationInterface {
  name = "SimplifyTokensTable1741602000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tokens"
      DROP COLUMN IF EXISTS "tokenNumber",
      DROP COLUMN IF EXISTS "customerName",
      DROP COLUMN IF EXISTS "startTime",
      DROP COLUMN IF EXISTS "endTime"
    `);

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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tokens"
      ADD COLUMN IF NOT EXISTS "tokenNumber" character varying,
      ADD COLUMN IF NOT EXISTS "customerName" character varying,
      ADD COLUMN IF NOT EXISTS "startTime" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "endTime" TIMESTAMP
    `);

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
