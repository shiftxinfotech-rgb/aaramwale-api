import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentFieldsToWalkIns1781700000000 implements MigrationInterface {
  name = "AddPaymentFieldsToWalkIns1781700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "walk_in_sessions" ADD COLUMN IF NOT EXISTS "paymentMethod" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "walk_in_sessions" ADD COLUMN IF NOT EXISTS "paidAmount" numeric(10,2) DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "walk_in_sessions" ADD COLUMN IF NOT EXISTS "paymentStatus" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "walk_in_sessions" ADD COLUMN IF NOT EXISTS "paymentDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "walk_in_sessions" ADD COLUMN IF NOT EXISTS "receivedByUserId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "walk_in_sessions" DROP CONSTRAINT IF EXISTS "FK_walk_in_sessions_receivedByUserId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "walk_in_sessions" ADD CONSTRAINT "FK_walk_in_sessions_receivedByUserId" FOREIGN KEY ("receivedByUserId") REFERENCES "users"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "walk_in_sessions" DROP CONSTRAINT IF EXISTS "FK_walk_in_sessions_receivedByUserId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "walk_in_sessions" DROP COLUMN IF EXISTS "receivedByUserId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "walk_in_sessions" DROP COLUMN IF EXISTS "paymentDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "walk_in_sessions" DROP COLUMN IF EXISTS "paymentStatus"`,
    );
    await queryRunner.query(
      `ALTER TABLE "walk_in_sessions" DROP COLUMN IF EXISTS "paidAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "walk_in_sessions" DROP COLUMN IF EXISTS "paymentMethod"`,
    );
  }
}
