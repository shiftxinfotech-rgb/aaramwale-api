import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameCustomerPhoneToMobile1781300000000 implements MigrationInterface {
  name = "RenameCustomerPhoneToMobile1781300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customers" RENAME COLUMN "phone" TO "mobile"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customers" RENAME COLUMN "mobile" TO "phone"`,
    );
  }
}
