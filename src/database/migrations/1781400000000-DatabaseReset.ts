import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from "bcrypt";

export class DatabaseReset1781400000000 implements MigrationInterface {
  name = "DatabaseReset1781400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Truncate all tables and reset sequence IDs
    await queryRunner.query(
      `TRUNCATE TABLE "tokens", "attendance", "pass_items", "passes", "walk_in_sessions", "customers", "assets", "categories", "users", "outlets" RESTART IDENTITY CASCADE`,
    );

    // 2. Check if the default Super Admin already exists
    const existing = await queryRunner.query(
      `SELECT * FROM "users" WHERE "email" = 'admin@aaramwala.com'`,
    );

    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash("Admin@123", 10);
      await queryRunner.query(
        `INSERT INTO "users" ("name", "email", "password", "mobile", "role", "outletId", "isActive", "createdAt", "updatedAt") 
         VALUES ('Super Admin', 'admin@aaramwala.com', $1, '9999999999', 'SUPER_ADMIN', NULL, true, now(), now())`,
        [passwordHash],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverting deletion of all records is not possible, but we can clean up the bootstrapped Super Admin
    await queryRunner.query(
      `DELETE FROM "users" WHERE "email" = 'admin@aaramwala.com'`,
    );
  }
}
