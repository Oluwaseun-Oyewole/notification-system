import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1779461840724 implements MigrationInterface {
    name = 'Migrations1779461840724'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."outbox_events_status_enum" AS ENUM('pending', 'processed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "outbox_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "notification_id" character varying NOT NULL, "status" "public"."outbox_events_status_enum" NOT NULL DEFAULT 'pending', "payload" jsonb NOT NULL, "processed_at" TIMESTAMP WITH TIME ZONE, "error" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6689a16c00d09b8089f6237f1d2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7128b07d8c2e243b649dec4402" ON "outbox_events"  ("notification_id") `);
        await queryRunner.query(`ALTER TYPE "public"."notifications_status_enum" RENAME TO "notifications_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_status_enum" AS ENUM('pending', 'queued', 'in_progress', 'sent', 'failed')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "status" TYPE "public"."notifications_status_enum" USING "status"::"text"::"public"."notifications_status_enum"`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."notifications_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "UQ_b91b050593b8f20dd30f693b826" UNIQUE ("correlation_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "UQ_b91b050593b8f20dd30f693b826"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_status_enum_old" AS ENUM('pending', 'queued', 'sent', 'failed', 'read')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "status" TYPE "public"."notifications_status_enum_old" USING "status"::"text"::"public"."notifications_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_status_enum_old" RENAME TO "notifications_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7128b07d8c2e243b649dec4402"`);
        await queryRunner.query(`DROP TABLE "outbox_events"`);
        await queryRunner.query(`DROP TYPE "public"."outbox_events_status_enum"`);
    }

}
