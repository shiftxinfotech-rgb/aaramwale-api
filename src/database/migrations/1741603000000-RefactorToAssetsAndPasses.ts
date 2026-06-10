import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorToAssetsAndPasses1741603000000 implements MigrationInterface {
  name = 'RefactorToAssetsAndPasses1741603000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create categories table if not exists
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

    // 2. Insert standard category "Massage Chair"
    await queryRunner.query(`
      INSERT INTO "categories" ("id", "name", "description", "isActive", "createdAt", "updatedAt")
      VALUES (1, 'Massage Chair', 'Standard rentable massage chairs', true, now(), now())
      ON CONFLICT ("id") DO NOTHING
    `);

    // Reset categories sequence
    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM "categories"), 1))
    `);

    // 3. Create assets table if not exists
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

    // 4. Migrate chairs to assets if chairs exist and assets is empty
    const chairsTableExists = await queryRunner.hasTable('chairs');
    if (chairsTableExists) {
      const assetsCount = await queryRunner.query('SELECT COUNT(*) FROM "assets"');
      if (parseInt(assetsCount[0].count, 10) === 0) {
        await queryRunner.query(`
          INSERT INTO "assets" ("id", "categoryId", "outletId", "assetCode", "assetName", "rentPerUse", "durationMinutes", "isActive", "createdAt", "updatedAt")
          SELECT "id", 1, "outletId", "chairNumber", 'Massage Chair ' || "chairNumber", "rentPerToken", 15, "isActive", "createdAt", "updatedAt"
          FROM "chairs"
        `);
      }
    }

    // Reset assets sequence
    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('assets', 'id'), COALESCE((SELECT MAX(id) FROM "assets"), 1))
    `);

    // 5. Create passes table if not exists
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

    // 6. Ensure default customer exists
    const customersCount = await queryRunner.query('SELECT COUNT(*) FROM "customers"');
    if (parseInt(customersCount[0].count, 10) === 0) {
      await queryRunner.query(`
        INSERT INTO "customers" ("id", "name", "phone", "createdAt", "updatedAt")
        VALUES (1, 'Default Customer', '0000000000', now(), now())
        ON CONFLICT ("id") DO NOTHING
      `);
    }

    // Reset customers sequence
    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('customers', 'id'), COALESCE((SELECT MAX(id) FROM "customers"), 1))
    `);

    // 7. Migrate tokens to passes if tokens exist and passes is empty
    const tokensTableExists = await queryRunner.hasTable('tokens');
    if (tokensTableExists) {
      const passesCount = await queryRunner.query('SELECT COUNT(*) FROM "passes"');
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

    // Reset passes sequence
    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('passes', 'id'), COALESCE((SELECT MAX(id) FROM "passes"), 1))
    `);

    // 8. Clean up legacy tables
    if (tokensTableExists) {
      await queryRunner.query('DROP TABLE IF EXISTS "tokens" CASCADE');
    }
    if (chairsTableExists) {
      await queryRunner.query('DROP TABLE IF EXISTS "chairs" CASCADE');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverting migration drops the new tables
    await queryRunner.query('DROP TABLE IF EXISTS "passes" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "assets" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "categories" CASCADE');
  }
}
