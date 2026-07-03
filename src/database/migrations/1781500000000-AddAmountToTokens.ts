import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAmountToTokens1781500000000 implements MigrationInterface {
  name = "AddAmountToTokens1781500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD COLUMN IF NOT EXISTS "amount" numeric(10,2) NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP COLUMN IF EXISTS "amount"`,
    );
  }
}
