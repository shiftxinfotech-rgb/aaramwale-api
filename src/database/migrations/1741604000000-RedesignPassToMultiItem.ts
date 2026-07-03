import { MigrationInterface, QueryRunner } from "typeorm";

export class RedesignPassToMultiItem1741604000000 implements MigrationInterface {
  name = "RedesignPassToMultiItem1741604000000";

  /**
   * Helper: check if a column exists on a table.
   */
  private async columnExists(
    queryRunner: QueryRunner,
    table: string,
    column: string,
  ): Promise<boolean> {
    const result = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2) AS "exists"`,
      [table, column],
    );
    return result[0]?.exists === true;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Convert status column to character varying (idempotent — safe if already varchar)
    if (await this.columnExists(queryRunner, "passes", "status")) {
      await queryRunner.query(
        'ALTER TABLE "passes" ALTER COLUMN "status" TYPE character varying',
      );
    }

    // 1. Create pass_items table if not exists
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pass_items" (
        "id" SERIAL PRIMARY KEY,
        "passId" integer NOT NULL,
        "categoryId" integer NOT NULL,
        "assetId" integer NOT NULL,
        "quantity" integer NOT NULL,
        "freeQuantity" integer NOT NULL DEFAULT 0,
        "billableQuantity" integer NOT NULL,
        "unitPrice" numeric(10,2) NOT NULL,
        "lineTotal" numeric(10,2) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // 2. Migrate existing single-item passes into pass_items — only if legacy columns exist
    const hasAmount = await this.columnExists(queryRunner, "passes", "amount");
    const hasAssetId = await this.columnExists(queryRunner, "passes", "assetId");

    if (hasAmount && hasAssetId) {
      const passesCount = await queryRunner.query(
        'SELECT COUNT(*) FROM "passes"',
      );
      if (parseInt(passesCount[0].count, 10) > 0) {
        const itemsCount = await queryRunner.query(
          'SELECT COUNT(*) FROM "pass_items"',
        );
        if (parseInt(itemsCount[0].count, 10) === 0) {
          await queryRunner.query(`
            INSERT INTO "pass_items" ("passId", "categoryId", "assetId", "quantity", "freeQuantity", "billableQuantity", "unitPrice", "lineTotal", "createdAt", "updatedAt")
            SELECT 
              p."id",
              COALESCE(a."categoryId", 1),
              p."assetId",
              1,
              0,
              1,
              p."amount",
              p."amount",
              p."createdAt",
              p."updatedAt"
            FROM "passes" p
            LEFT JOIN "assets" a ON a."id" = p."assetId"
          `);
        }
      }
    }

    // 3. Add new columns to passes table
    await queryRunner.query(`
      ALTER TABLE "passes" 
      ADD COLUMN IF NOT EXISTS "subtotalAmount" numeric(10,2),
      ADD COLUMN IF NOT EXISTS "discountType" character varying DEFAULT 'NONE',
      ADD COLUMN IF NOT EXISTS "discountValue" numeric(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "discountAmount" numeric(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "finalAmount" numeric(10,2),
      ADD COLUMN IF NOT EXISTS "generatedByUserId" integer,
      ADD COLUMN IF NOT EXISTS "generatedByRole" character varying
    `);

    // 4. Update the newly created columns using legacy data — only if legacy columns exist
    if (hasAmount) {
      const hasEmployeeId = await this.columnExists(
        queryRunner,
        "passes",
        "employeeId",
      );
      await queryRunner.query(`
        UPDATE "passes" p
        SET 
          "subtotalAmount" = ${hasAmount ? 'p."amount"' : "0"},
          "finalAmount" = ${hasAmount ? 'p."amount"' : "0"},
          "generatedByUserId" = ${hasEmployeeId ? 'COALESCE(p."employeeId", (SELECT MIN(id) FROM "users"), 1)' : "(SELECT MIN(id) FROM \"users\")"},
          "generatedByRole" = ${hasEmployeeId ? "COALESCE((SELECT u.\"role\"::text FROM \"users\" u WHERE u.\"id\" = p.\"employeeId\"), 'EMPLOYEE')" : "'EMPLOYEE'"},
          "discountType" = 'NONE',
          "discountValue" = 0,
          "discountAmount" = 0
        WHERE "subtotalAmount" IS NULL
      `);

      // 5. Convert status values to the redesigned status set
      await queryRunner.query(`
        UPDATE "passes"
        SET "status" = CASE 
          WHEN "status" = 'COMPLETED' OR "status" = 'EXPIRED' THEN 'REDEEMED'
          WHEN "status" = 'CANCELLED' THEN 'CANCELLED'
          ELSE "status"
        END
        WHERE "status" IN ('COMPLETED', 'EXPIRED', 'CANCELLED')
      `);
    } else {
      // Legacy columns don't exist — backfill NULLs with safe defaults
      await queryRunner.query(`
        UPDATE "passes"
        SET 
          "subtotalAmount" = COALESCE("subtotalAmount", 0),
          "finalAmount" = COALESCE("finalAmount", 0),
          "generatedByUserId" = COALESCE("generatedByUserId", (SELECT MIN(id) FROM "users")),
          "generatedByRole" = COALESCE("generatedByRole", 'EMPLOYEE'),
          "discountType" = COALESCE("discountType", 'NONE'),
          "discountValue" = COALESCE("discountValue", 0),
          "discountAmount" = COALESCE("discountAmount", 0)
        WHERE "subtotalAmount" IS NULL
      `);
    }

    // 6. Set new columns to NOT NULL (safe — all rows have values now)
    await queryRunner.query(`
      ALTER TABLE "passes" 
      ALTER COLUMN "subtotalAmount" SET NOT NULL,
      ALTER COLUMN "discountType" SET NOT NULL,
      ALTER COLUMN "discountValue" SET NOT NULL,
      ALTER COLUMN "discountAmount" SET NOT NULL,
      ALTER COLUMN "finalAmount" SET NOT NULL,
      ALTER COLUMN "generatedByUserId" SET NOT NULL,
      ALTER COLUMN "generatedByRole" SET NOT NULL
    `);

    // 7. Drop legacy constraints & columns (all guarded)
    await queryRunner.query(
      'ALTER TABLE "passes" DROP CONSTRAINT IF EXISTS "FK_passes_assets"',
    );
    await queryRunner.query(
      'ALTER TABLE "passes" DROP CONSTRAINT IF EXISTS "FK_passes_users"',
    );

    await queryRunner.query(`
      ALTER TABLE "passes" 
      DROP COLUMN IF EXISTS "assetId",
      DROP COLUMN IF EXISTS "amount",
      DROP COLUMN IF EXISTS "durationMinutes",
      DROP COLUMN IF EXISTS "startTime",
      DROP COLUMN IF EXISTS "endTime",
      DROP COLUMN IF EXISTS "employeeId"
    `);

    // 8. Recreate correct foreign key constraints (drop first for idempotency)
    await queryRunner.query(
      'ALTER TABLE "passes" DROP CONSTRAINT IF EXISTS "FK_passes_users"',
    );
    await queryRunner.query(`
      ALTER TABLE "passes" 
      ADD CONSTRAINT "FK_passes_users" FOREIGN KEY ("generatedByUserId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(
      'ALTER TABLE "pass_items" DROP CONSTRAINT IF EXISTS "FK_pass_items_passes"',
    );
    await queryRunner.query(
      'ALTER TABLE "pass_items" DROP CONSTRAINT IF EXISTS "FK_pass_items_assets"',
    );
    await queryRunner.query(
      'ALTER TABLE "pass_items" DROP CONSTRAINT IF EXISTS "FK_pass_items_categories"',
    );
    await queryRunner.query(`
      ALTER TABLE "pass_items" 
      ADD CONSTRAINT "FK_pass_items_passes" FOREIGN KEY ("passId") REFERENCES "passes"("id") ON DELETE CASCADE,
      ADD CONSTRAINT "FK_pass_items_assets" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE,
      ADD CONSTRAINT "FK_pass_items_categories" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE
    `);

    // 9. Reset sequence for pass_items
    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('pass_items', 'id'), COALESCE((SELECT MAX(id) FROM "pass_items"), 1))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert alters
    await queryRunner.query('DROP TABLE IF EXISTS "pass_items" CASCADE');

    await queryRunner.query(`
      ALTER TABLE "passes" 
      ADD COLUMN IF NOT EXISTS "assetId" integer,
      ADD COLUMN IF NOT EXISTS "amount" numeric(10,2),
      ADD COLUMN IF NOT EXISTS "durationMinutes" integer,
      ADD COLUMN IF NOT EXISTS "startTime" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "endTime" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "employeeId" integer
    `);
  }
}
