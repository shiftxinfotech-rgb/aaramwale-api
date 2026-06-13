import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMobileToUser1781200000000 implements MigrationInterface {
  name = "AddMobileToUser1781200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mobile" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "mobile"`,
    );
  }
}
