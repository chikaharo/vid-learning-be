import { MigrationInterface, QueryRunner } from "typeorm";

export class FixQuizCourseId1768296523422 implements MigrationInterface {
    name = 'FixQuizCourseId1768296523422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Cleanup potential leftovers from failed runs
        await queryRunner.query(`ALTER TABLE "quizzes" DROP CONSTRAINT IF EXISTS "FK_e460dcb813c2cc28c93c95f2504"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP CONSTRAINT IF EXISTS "FK_2cf4e4b5b533af8dc6b38d4fa9b"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "FK_3c4e299cf8ed04093935e2e22fe"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "FK_35fb2307535d90a6ed290af1f4a"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "FK_728447781a30bc3fcfe5c2f1cdf"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "FK_f99062f36181ab42863facfaea3"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP CONSTRAINT IF EXISTS "FK_9021b7e89ea353c02a361a10b72"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP CONSTRAINT IF EXISTS "FK_eba9ff0775c843581aab6916b32"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "FK_1a9ff2409a84c76560ae8a92590"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "FK_16e7969589c0b789d9868782259"`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "rating" integer NOT NULL, "comment" text NOT NULL, "user_id" uuid NOT NULL, "course_id" uuid NOT NULL, CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN IF EXISTS "courseId"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN IF EXISTS "lessonId"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN IF EXISTS "courseId"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN IF EXISTS "moduleId"`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "order" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "rating" numeric(3,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "rating_count" integer NOT NULL DEFAULT '0'`);
        
        // Fix for quizzes.course_id
        // 1. Update NULLs to a valid course if possible
        await queryRunner.query(`UPDATE "quizzes" SET "course_id" = (SELECT "id" FROM "courses" LIMIT 1) WHERE "course_id" IS NULL`);
        // 2. Delete any remaining NULLs (no courses exist)
        await queryRunner.query(`DELETE FROM "quizzes" WHERE "course_id" IS NULL`);
        // 3. Convert to UUID if needed (handling varchar -> uuid) and set NOT NULL
        await queryRunner.query(`ALTER TABLE "quizzes" ALTER COLUMN "course_id" TYPE uuid USING "course_id"::uuid`);
        await queryRunner.query(`ALTER TABLE "quizzes" ALTER COLUMN "course_id" SET NOT NULL`);

        // Fix for quizzes.lesson_id
        // It is nullable in the new schema (ADD "lesson_id" uuid), so we can just DROP AND ADD or ALTER.
        // The original code was: drop lesson_id, add lesson_id uuid. 
        // If we want to preserve data:
        await queryRunner.query(`ALTER TABLE "quizzes" ALTER COLUMN "lesson_id" TYPE uuid USING "lesson_id"::uuid`);
        // Note: New schema says it is nullable? Line 22: ADD "lesson_id" uuid (implies nullable)
        // So we don't need SET NOT NULL.

        // Fix for lessons.course_id
        // 1. Update NULLs
        await queryRunner.query(`UPDATE "lessons" SET "course_id" = (SELECT "id" FROM "courses" LIMIT 1) WHERE "course_id" IS NULL`);
        // 2. Delete remaining
        await queryRunner.query(`DELETE FROM "lessons" WHERE "course_id" IS NULL`);
        // 3. Alter
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "course_id" TYPE uuid USING "course_id"::uuid`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "course_id" SET NOT NULL`);
        // Fix lessons.module_id
        // Ensure column exists (if not, add it as uuid). if it exists (as varchar), cast it.
        // Note: ADD COLUMN IF NOT EXISTS fails if type mismatch isn't handled? No, it just skips add.
        // But if we want to change type from varchar to uuid:
        // We just run ALTER. If column missing, ALTER fails. 
        // So: 1. ADD IF NOT EXISTS (creates if missing). 2. ALTER (fixes type).
        // BUT if ADD creates it as UUID, then ALTER is fine.
        // IF ADD sees varchar, it skips. Then ALTER changes varchar to UUID.
        await queryRunner.query(`ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "module_id" uuid`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "module_id" TYPE uuid USING "module_id"::uuid`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD CONSTRAINT "FK_e460dcb813c2cc28c93c95f2504" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD CONSTRAINT "FK_2cf4e4b5b533af8dc6b38d4fa9b" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_3c4e299cf8ed04093935e2e22fe" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_35fb2307535d90a6ed290af1f4a" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_f99062f36181ab42863facfaea3" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_f99062f36181ab42863facfaea3"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT "FK_35fb2307535d90a6ed290af1f4a"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT "FK_3c4e299cf8ed04093935e2e22fe"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP CONSTRAINT "FK_2cf4e4b5b533af8dc6b38d4fa9b"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP CONSTRAINT "FK_e460dcb813c2cc28c93c95f2504"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "module_id"`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "module_id" character varying`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "course_id"`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "course_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "lesson_id"`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD "lesson_id" character varying`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "course_id"`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD "course_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "rating_count"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "rating"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "order"`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "moduleId" uuid`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "courseId" uuid`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD "lessonId" uuid`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD "courseId" uuid`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_16e7969589c0b789d9868782259" FOREIGN KEY ("moduleId") REFERENCES "course_modules"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_1a9ff2409a84c76560ae8a92590" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD CONSTRAINT "FK_eba9ff0775c843581aab6916b32" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD CONSTRAINT "FK_9021b7e89ea353c02a361a10b72" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
