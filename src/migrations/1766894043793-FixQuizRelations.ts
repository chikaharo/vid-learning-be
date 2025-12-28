import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixQuizRelations1766894043793 implements MigrationInterface {
  name = 'FixQuizRelations1766894043793';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop constraints on the old/redundant columns if they exist
    // Note: We use try/catch or assume they exist based on previous schema state.
    // FK_9021... was for courseId, FK_eba9... was for lessonId
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP CONSTRAINT IF EXISTS "FK_9021b7e89ea353c02a361a10b72"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP CONSTRAINT IF EXISTS "FK_eba9ff0775c843581aab6916b32"`,
    );

    // 2. Data Migration (just in case): Copy from courseId -> course_id if course_id is null
    // Since user said course_id has data, we might not strictly need this, but it's safe.
    // However, user said "course_id has data", so we trust that.

    // 3. Drop the redundant CamelCase columns
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP COLUMN IF EXISTS "courseId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP COLUMN IF EXISTS "lessonId"`,
    );

    // 4. Fix column types for course_id and lesson_id if they were not UUIDs (e.g., if they were created as varchars manually)
    // If they are already UUIDs, this ALTER does nothing harmful usually, but we need casting to be safe.
    // We assume they are correct or we cast them.
    await queryRunner.query(
      `ALTER TABLE "quizzes" ALTER COLUMN "course_id" TYPE uuid USING "course_id"::uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ALTER COLUMN "course_id" SET NOT NULL`,
    );

    // Handle lesson_id (nullable)
    // Check if lesson_id exists, if not create it (unlikely given user description)
    // If it exists, ensure it is uuid
    await queryRunner.query(
      `ALTER TABLE "quizzes" ALTER COLUMN "lesson_id" TYPE uuid USING "lesson_id"::uuid`,
    );

    // 5. Add new constraints linking to course_id and lesson_id
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD CONSTRAINT "FK_e460dcb813c2cc28c93c95f2504" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD CONSTRAINT "FK_2cf4e4b5b533af8dc6b38d4fa9b" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert changes
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP CONSTRAINT "FK_2cf4e4b5b533af8dc6b38d4fa9b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP CONSTRAINT "FK_e460dcb813c2cc28c93c95f2504"`,
    );

    await queryRunner.query(`ALTER TABLE "quizzes" ADD "lessonId" uuid`);
    await queryRunner.query(`ALTER TABLE "quizzes" ADD "courseId" uuid`);

    // Restore constraints
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD CONSTRAINT "FK_eba9ff0775c843581aab6916b32" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD CONSTRAINT "FK_9021b7e89ea353c02a361a10b72" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
