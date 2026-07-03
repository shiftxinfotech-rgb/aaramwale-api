import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameCustomerPhoneToMobile1781300000000 implements MigrationInterface {
  name = "RenameCustomerPhoneToMobile1781300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Only rename if "phone" exists and "mobile" does not
    const phoneExists = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2) AS "exists"`,
      ["customers", "phone"],
    );
    const mobileExists = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2) AS "exists"`,
      ["customers", "mobile"],
    );

    if (phoneExists[0].exists && !mobileExists[0].exists) {
      await queryRunner.query(
        `ALTER TABLE "customers" RENAME COLUMN "phone" TO "mobile"`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Only rename back if "mobile" exists and "phone" does not
    const mobileExists = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2) AS "exists"`,
      ["customers", "mobile"],
    );
    const phoneExists = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2) AS "exists"`,
      ["customers", "phone"],
    );

    if (mobileExists[0].exists && !phoneExists[0].exists) {
      await queryRunner.query(
        `ALTER TABLE "customers" RENAME COLUMN "mobile" TO "phone"`,
      );
    }
  }
}
