import { MigrationInterface, QueryRunner } from "typeorm";

export class FixLessonRelations1766895375033 implements MigrationInterface {
    name = 'FixLessonRelations1766895375033'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop old constraints (FK_1a9... for courseId, FK_16e... for moduleId)
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "FK_1a9ff2409a84c76560ae8a92590"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "FK_16e7969589c0b789d9868782259"`);

        // 2. Drop redundant columns
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN IF EXISTS "courseId"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN IF EXISTS "moduleId"`);

        // 3. Fix column types for course_id and module_id (ensure they are UUID)
        // assuming course_id has data and is correct
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "course_id" TYPE uuid USING "course_id"::uuid`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "course_id" SET NOT NULL`);

        // module_id is nullable
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "module_id" TYPE uuid USING "module_id"::uuid`);

        // 4. Add new constraints
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_3c4e299cf8ed04093935e2e22fe" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_35fb2307535d90a6ed290af1f4a" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT "FK_35fb2307535d90a6ed290af1f4a"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT "FK_3c4e299cf8ed04093935e2e22fe"`);
        
        await queryRunner.query(`ALTER TABLE "lessons" ADD "moduleId" uuid`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "courseId" uuid`);
        
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_16e7969589c0b789d9868782259" FOREIGN KEY ("moduleId") REFERENCES "course_modules"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_1a9ff2409a84c76560ae8a92590" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
