import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuperAdminAndQrCode1781100000000 implements MigrationInterface {
  name = "AddSuperAdminAndQrCode1781100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add SUPER_ADMIN to the user_role_enum type
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN'`,
    );

    // Add nullable qrCode column to passes table
    await queryRunner.query(
      `ALTER TABLE "passes" ADD COLUMN IF NOT EXISTS "qrCode" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove qrCode column
    await queryRunner.query(
      `ALTER TABLE "passes" DROP COLUMN IF EXISTS "qrCode"`,
    );

    // Note: PostgreSQL does not support removing enum values natively.
    // To revert SUPER_ADMIN from the enum, a full type recreation would be required.
  }
}
