import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from "bcrypt";

/**
 * Safe, idempotent bootstrap migration.
 *
 * Creates a default Super Admin user ONLY if no SUPER_ADMIN exists yet.
 * Never deletes, truncates, or modifies existing data.
 */
export class BootstrapSuperAdmin1781800000000 implements MigrationInterface {
  name = "BootstrapSuperAdmin1781800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if ANY Super Admin already exists — not just the default email.
    const result = await queryRunner.query(
      `SELECT COUNT(*)::int AS count FROM "users" WHERE "role" = 'SUPER_ADMIN'`,
    );

    const superAdminCount = result[0]?.count ?? 0;

    if (superAdminCount === 0) {
      const passwordHash = await bcrypt.hash("Admin@123", 10);
      await queryRunner.query(
        `INSERT INTO "users" ("name", "email", "password", "mobile", "role", "outletId", "isActive", "createdAt", "updatedAt")
         VALUES ('Super Admin', 'admin@aaramwala.com', $1, '9999999999', 'SUPER_ADMIN', NULL, true, now(), now())`,
        [passwordHash],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Only remove the default bootstrapped Super Admin, never other admins.
    await queryRunner.query(
      `DELETE FROM "users" WHERE "email" = 'admin@aaramwala.com' AND "role" = 'SUPER_ADMIN'`,
    );
  }
}
