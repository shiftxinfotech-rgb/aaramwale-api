import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorPassAndTokens1781001112104 implements MigrationInterface {
    name = 'RefactorPassAndTokens1781001112104';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Rename columns in assets and pass_items
        await queryRunner.query(`ALTER TABLE "assets" RENAME COLUMN "rentPerUse" TO "unitPrice"`);
        await queryRunner.query(`ALTER TABLE "pass_items" RENAME COLUMN "quantity" TO "totalQuantity"`);
        await queryRunner.query(`ALTER TABLE "pass_items" RENAME COLUMN "billableQuantity" TO "paidQuantity"`);

        // 2. Drop legacy foreign key constraints and columns from tokens table
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_4d0e7c837a8b5b2667a9efa41c5"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_d417e5d35f2434afc4bd48cb4d2"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN IF EXISTS "chairId"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN IF EXISTS "userId"`);

        // 3. Add new columns to tokens table
        await queryRunner.query(`ALTER TABLE "tokens" ADD COLUMN "passId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD COLUMN "passItemId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD COLUMN "assetId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD COLUMN "customerId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD COLUMN "redeemedQuantity" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD COLUMN "redeemedByUserId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD COLUMN "remarks" character varying`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD COLUMN "redeemedAt" timestamp without time zone NOT NULL DEFAULT now()`);

        // 4. Create new foreign key constraints on tokens table
        await queryRunner.query(`
            ALTER TABLE "tokens" 
            ADD CONSTRAINT "FK_tokens_passes" FOREIGN KEY ("passId") REFERENCES "passes"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "tokens" 
            ADD CONSTRAINT "FK_tokens_pass_items" FOREIGN KEY ("passItemId") REFERENCES "pass_items"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "tokens" 
            ADD CONSTRAINT "FK_tokens_assets" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "tokens" 
            ADD CONSTRAINT "FK_tokens_customers" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "tokens" 
            ADD CONSTRAINT "FK_tokens_users" FOREIGN KEY ("redeemedByUserId") REFERENCES "users"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop constraints
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_tokens_users"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_tokens_customers"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_tokens_assets"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_tokens_pass_items"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_tokens_passes"`);

        // 2. Drop new columns
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN IF EXISTS "redeemedAt"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN IF EXISTS "remarks"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN IF EXISTS "redeemedByUserId"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN IF EXISTS "redeemedQuantity"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN IF EXISTS "customerId"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN IF EXISTS "assetId"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN IF EXISTS "passItemId"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN IF EXISTS "passId"`);

        // 3. Add back legacy columns
        await queryRunner.query(`ALTER TABLE "tokens" ADD COLUMN "chairId" integer`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD COLUMN "userId" integer`);

        // 4. Rename columns back in assets and pass_items
        await queryRunner.query(`ALTER TABLE "assets" RENAME COLUMN "unitPrice" TO "rentPerUse"`);
        await queryRunner.query(`ALTER TABLE "pass_items" RENAME COLUMN "totalQuantity" TO "quantity"`);
        await queryRunner.query(`ALTER TABLE "pass_items" RENAME COLUMN "paidQuantity" TO "billableQuantity"`);
    }
}

