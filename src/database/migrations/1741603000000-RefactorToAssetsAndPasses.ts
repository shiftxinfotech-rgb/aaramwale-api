import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorToAssetsAndPasses1741603000000 implements MigrationInterface {
  name = "RefactorToAssetsAndPasses1741603000000";

  // ---------------------------------------------------------------------------
  // Helper: check if a column exists on a given table
  // ---------------------------------------------------------------------------
  private async columnExists(
    queryRunner: QueryRunner,
    table: string,
    column: string,
  ): Promise<boolean> {
    const result = await queryRunner.query(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = $1 AND column_name = $2
       ) AS "exists"`,
      [table, column],
    );
    return result[0].exists;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =========================================================================
    // 1. Create categories table if not exists
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying NOT NULL,
        "description" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // 2. Insert standard category "Massage Chair" (ON CONFLICT makes it safe)
    await queryRunner.query(`
      INSERT INTO "categories" ("id", "name", "description", "isActive", "createdAt", "updatedAt")
      VALUES (1, 'Massage Chair', 'Standard rentable massage chairs', true, now(), now())
      ON CONFLICT ("id") DO NOTHING
    `);

    // Reset categories sequence
    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM "categories"), 1))
    `);

    // =========================================================================
    // 3. Create assets table if not exists
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "assets" (
        "id" SERIAL PRIMARY KEY,
        "categoryId" integer NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
        "outletId" integer NOT NULL REFERENCES "outlets"("id") ON DELETE CASCADE,
        "assetCode" character varying NOT NULL,
        "assetName" character varying NOT NULL,
        "rentPerUse" numeric(10,2) NOT NULL,
        "durationMinutes" integer NOT NULL DEFAULT 15,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // =========================================================================
    // 4. Migrate chairs → assets (only if chairs table AND required columns exist)
    // =========================================================================
    const chairsTableExists = await queryRunner.hasTable("chairs");
    if (chairsTableExists) {
      // Verify all required legacy columns still exist on "chairs"
      const hasChairNumber = await this.columnExists(queryRunner, "chairs", "chairNumber");
      const hasRentPerToken = await this.columnExists(queryRunner, "chairs", "rentPerToken");
      const hasOutletIdChairs = await this.columnExists(queryRunner, "chairs", "outletId");
      const hasIsActiveChairs = await this.columnExists(queryRunner, "chairs", "isActive");

      if (hasChairNumber && hasRentPerToken && hasOutletIdChairs && hasIsActiveChairs) {
        const assetsCount = await queryRunner.query(
          'SELECT COUNT(*) FROM "assets"',
        );
        if (parseInt(assetsCount[0].count, 10) === 0) {
          await queryRunner.query(`
            INSERT INTO "assets" ("id", "categoryId", "outletId", "assetCode", "assetName", "rentPerUse", "durationMinutes", "isActive", "createdAt", "updatedAt")
            SELECT "id", 1, "outletId", "chairNumber", 'Massage Chair ' || "chairNumber", "rentPerToken", 15, "isActive", "createdAt", "updatedAt"
            FROM "chairs"
          `);
        }
      }
    }

    // Reset assets sequence
    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('assets', 'id'), COALESCE((SELECT MAX(id) FROM "assets"), 1))
    `);

    // =========================================================================
    // 5. Create passes table if not exists
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "passes" (
        "id" SERIAL PRIMARY KEY,
        "passNumber" character varying NOT NULL UNIQUE,
        "customerId" integer NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
        "assetId" integer NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
        "outletId" integer NOT NULL REFERENCES "outlets"("id") ON DELETE CASCADE,
        "employeeId" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "amount" numeric(10,2) NOT NULL,
        "durationMinutes" integer NOT NULL,
        "status" character varying NOT NULL DEFAULT 'ACTIVE',
        "startTime" TIMESTAMP,
        "endTime" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // =========================================================================
    // 6. Ensure default customer exists
    //    "phone" was later renamed to "mobile"; check which column is present.
    // =========================================================================
    const customersCount = await queryRunner.query(
      'SELECT COUNT(*) FROM "customers"',
    );
    if (parseInt(customersCount[0].count, 10) === 0) {
      const hasPhone = await this.columnExists(queryRunner, "customers", "phone");
      const hasMobile = await this.columnExists(queryRunner, "customers", "mobile");

      if (hasPhone) {
        await queryRunner.query(`
          INSERT INTO "customers" ("id", "name", "phone", "createdAt", "updatedAt")
          VALUES (1, 'Default Customer', '0000000000', now(), now())
          ON CONFLICT ("id") DO NOTHING
        `);
      } else if (hasMobile) {
        await queryRunner.query(`
          INSERT INTO "customers" ("id", "name", "mobile", "createdAt", "updatedAt")
          VALUES (1, 'Default Customer', '0000000000', now(), now())
          ON CONFLICT ("id") DO NOTHING
        `);
      }
      // If neither column exists something is very wrong – skip silently
    }

    // Reset customers sequence
    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('customers', 'id'), COALESCE((SELECT MAX(id) FROM "customers"), 1))
    `);

    // =========================================================================
    // 7. Migrate tokens → passes (only if tokens table AND required columns exist)
    // =========================================================================
    const tokensTableExists = await queryRunner.hasTable("tokens");
    if (tokensTableExists) {
      // Verify all required legacy columns still exist on "tokens"
      const hasChairId = await this.columnExists(queryRunner, "tokens", "chairId");
      const hasUserId = await this.columnExists(queryRunner, "tokens", "userId");
      const hasAmount = await this.columnExists(queryRunner, "tokens", "amount");
      const hasOutletIdTokens = await this.columnExists(queryRunner, "tokens", "outletId");
      const hasStatus = await this.columnExists(queryRunner, "tokens", "status");

      if (hasChairId && hasUserId && hasAmount && hasOutletIdTokens && hasStatus) {
        const passesCount = await queryRunner.query(
          'SELECT COUNT(*) FROM "passes"',
        );
        if (parseInt(passesCount[0].count, 10) === 0) {
          await queryRunner.query(`
            INSERT INTO "passes" (
              "id", "passNumber", "customerId", "assetId", "outletId", "employeeId",
              "amount", "durationMinutes", "status", "startTime", "endTime", "createdAt", "updatedAt"
            )
            SELECT
              t."id",
              'AW' || to_char(t."createdAt", 'YYYYMMDD') || lpad(row_number() OVER (PARTITION BY t."createdAt"::date ORDER BY t."id")::text, 4, '0'),
              COALESCE((SELECT MIN(id) FROM "customers"), 1),
              t."chairId",
              t."outletId",
              t."userId",
              t."amount",
              15,
              t."status",
              t."createdAt",
              t."createdAt" + interval '15 minutes',
              t."createdAt",
              t."updatedAt"
            FROM "tokens" t
          `);
        }
      }
    }

    // Reset passes sequence
    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('passes', 'id'), COALESCE((SELECT MAX(id) FROM "passes"), 1))
    `);

    // =========================================================================
    // 8. Clean up legacy tables (IF EXISTS CASCADE is already safe)
    // =========================================================================
    await queryRunner.query('DROP TABLE IF EXISTS "tokens" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "chairs" CASCADE');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverting migration drops the new tables
    await queryRunner.query('DROP TABLE IF EXISTS "passes" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "assets" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "categories" CASCADE');
  }
}
