import { MigrationInterface, QueryRunner } from "typeorm";

export class FinalArchitecture1781006915053 implements MigrationInterface {
    name = 'FinalArchitecture1781006915053';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Alter tokens table: Drop customerId, outletId, amount
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_tokens_customers"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "FK_56dfca5de188fe69a4265d225f2"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN IF EXISTS "customerId"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN IF EXISTS "outletId"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN IF EXISTS "amount"`);

        // Add isFreeConsumption to tokens
        await queryRunner.query(`ALTER TABLE "tokens" ADD COLUMN "isFreeConsumption" boolean NOT NULL DEFAULT false`);

        // 2. Create walk_in_sessions table
        await queryRunner.query(`
            CREATE TABLE "walk_in_sessions" (
                "id" SERIAL PRIMARY KEY,
                "sessionNumber" character varying NOT NULL UNIQUE,
                "customerId" integer NOT NULL,
                "outletId" integer NOT NULL,
                "assetId" integer NOT NULL,
                "categoryId" integer NOT NULL,
                "quantity" integer NOT NULL,
                "unitPrice" numeric(10,2) NOT NULL,
                "subtotalAmount" numeric(10,2) NOT NULL,
                "discountType" character varying NOT NULL DEFAULT 'NONE',
                "discountValue" numeric(10,2) NOT NULL DEFAULT 0,
                "discountAmount" numeric(10,2) NOT NULL DEFAULT 0,
                "finalAmount" numeric(10,2) NOT NULL,
                "remarks" character varying,
                "employeeId" integer NOT NULL,
                "sessionDate" date NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_walk_in_sessions_customers" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_walk_in_sessions_outlets" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_walk_in_sessions_assets" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_walk_in_sessions_categories" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_walk_in_sessions_users" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop walk_in_sessions
        await queryRunner.query(`DROP TABLE IF EXISTS "walk_in_sessions" CASCADE`);

        // Revert tokens changes
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN IF EXISTS "isFreeConsumption"`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD COLUMN "amount" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD COLUMN "outletId" integer`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD COLUMN "customerId" integer`);

        // Add back constraints
        await queryRunner.query(`
            ALTER TABLE "tokens" 
            ADD CONSTRAINT "FK_tokens_customers" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "tokens" 
            ADD CONSTRAINT "FK_56dfca5de188fe69a4265d225f2" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE CASCADE
        `);
    }
}
