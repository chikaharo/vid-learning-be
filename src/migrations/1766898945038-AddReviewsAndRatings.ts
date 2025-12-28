import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReviewsAndRatings1766898945038 implements MigrationInterface {
    name = 'AddReviewsAndRatings1766898945038'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "rating" integer NOT NULL, "comment" text NOT NULL, "user_id" uuid NOT NULL, "course_id" uuid NOT NULL, CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        // Columns rating and rating_count already exist on courses (likely added by sync)
        // await queryRunner.query(`ALTER TABLE "courses" ADD "rating" numeric(3,2) NOT NULL DEFAULT '0'`);
        // await queryRunner.query(`ALTER TABLE "courses" ADD "rating_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_f99062f36181ab42863facfaea3" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_f99062f36181ab42863facfaea3"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf"`);
        // await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "rating_count"`);
        // await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "rating"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
    }

}
