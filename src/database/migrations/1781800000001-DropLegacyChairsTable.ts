import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Drops the orphaned "chairs" table.
 *
 * This table was the original entity before the refactor to "assets".
 * The data was migrated to "assets" in RefactorToAssetsAndPasses (migration 2),
 * but the table was never dropped because synchronize:true does not drop
 * tables when an entity is removed.
 */
export class DropLegacyChairsTable1781800000001 implements MigrationInterface {
  name = "DropLegacyChairsTable1781800000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "chairs" CASCADE`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op — the chairs table has no entity, no references, and no data
    // worth restoring. Re-creating it would serve no purpose.
  }
}
