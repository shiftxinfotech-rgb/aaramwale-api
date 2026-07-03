import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorPassAndTokens1781001112104 implements MigrationInterface {
  name = "RefactorPassAndTokens1781001112104";

  // ── helpers ───────────────────────────────────────────────────────────
  private async columnExists(
    queryRunner: QueryRunner,
    table: string,
    column: string,
  ): Promise<boolean> {
    const result = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2) AS "exists"`,
      [table, column],
    );
    return result[0].exists;
  }

  private async renameColumnSafe(
    queryRunner: QueryRunner,
    table: string,
    from: string,
    to: string,
  ): Promise<void> {
    const srcExists = await this.columnExists(queryRunner, table, from);
    const tgtExists = await this.columnExists(queryRunner, table, to);
    if (srcExists && !tgtExists) {
      await queryRunner.query(
        `ALTER TABLE "${table}" RENAME COLUMN "${from}" TO "${to}"`,
      );
    }
  }

  // ── UP ────────────────────────────────────────────────────────────────
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Rename columns in assets and pass_items
    await this.renameColumnSafe(queryRunner, "assets", "rentPerUse", "unitPrice");
    await this.renameColumnSafe(queryRunner, "pass_items", "quantity", "totalQuantity");
    await this.renameColumnSafe(queryRunner, "pass_items", "billableQuantity", "paidQuantity");

    // 2. Drop legacy foreign key constraints and columns from tokens table
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_4d0e7c837a8b5b2667a9efa41c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_d417e5d35f2434afc4bd48cb4d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP COLUMN IF EXISTS "chairId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP COLUMN IF EXISTS "userId"`,
    );

    // 3. Add new columns to tokens table (IF NOT EXISTS)
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD COLUMN IF NOT EXISTS "passId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD COLUMN IF NOT EXISTS "passItemId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD COLUMN IF NOT EXISTS "assetId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD COLUMN IF NOT EXISTS "customerId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD COLUMN IF NOT EXISTS "redeemedQuantity" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD COLUMN IF NOT EXISTS "redeemedByUserId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD COLUMN IF NOT EXISTS "remarks" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD COLUMN IF NOT EXISTS "redeemedAt" timestamp without time zone NOT NULL DEFAULT now()`,
    );

    // 4. Create new foreign key constraints on tokens table
    //    Drop first (if exists) then add — makes re-runs safe
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_tokens_passes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_tokens_passes" FOREIGN KEY ("passId") REFERENCES "passes"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_tokens_pass_items"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_tokens_pass_items" FOREIGN KEY ("passItemId") REFERENCES "pass_items"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_tokens_assets"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_tokens_assets" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_tokens_customers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_tokens_customers" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_tokens_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_tokens_users" FOREIGN KEY ("redeemedByUserId") REFERENCES "users"("id") ON DELETE CASCADE`,
    );
  }

  // ── DOWN ──────────────────────────────────────────────────────────────
  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop constraints
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_tokens_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_tokens_customers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_tokens_assets"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_tokens_pass_items"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_tokens_passes"`,
    );

    // 2. Drop new columns
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP COLUMN IF EXISTS "redeemedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP COLUMN IF EXISTS "remarks"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP COLUMN IF EXISTS "redeemedByUserId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP COLUMN IF EXISTS "redeemedQuantity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP COLUMN IF EXISTS "customerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP COLUMN IF EXISTS "assetId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP COLUMN IF EXISTS "passItemId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP COLUMN IF EXISTS "passId"`,
    );

    // 3. Add back legacy columns (IF NOT EXISTS)
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD COLUMN IF NOT EXISTS "chairId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD COLUMN IF NOT EXISTS "userId" integer`,
    );

    // 4. Rename columns back in assets and pass_items
    await this.renameColumnSafe(queryRunner, "assets", "unitPrice", "rentPerUse");
    await this.renameColumnSafe(queryRunner, "pass_items", "totalQuantity", "quantity");
    await this.renameColumnSafe(queryRunner, "pass_items", "paidQuantity", "billableQuantity");
  }
}
