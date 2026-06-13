import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveUnusedCustomerFields1781007111111 implements MigrationInterface {
  name = "RemoveUnusedCustomerFields1781007111111";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN IF EXISTS "latitude"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN IF EXISTS "longitude"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN IF EXISTS "loyaltyPoints"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN IF EXISTS "activeMembershipId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN IF EXISTS "membershipName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN IF EXISTS "membershipExpiry"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN IF EXISTS "activePackages"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN IF EXISTS "activeGiftCards"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "latitude" decimal(10,8)`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "longitude" decimal(11,8)`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "loyaltyPoints" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "activeMembershipId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "membershipName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "membershipExpiry" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "activePackages" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD "activeGiftCards" integer NOT NULL DEFAULT 0`,
    );
  }
}
