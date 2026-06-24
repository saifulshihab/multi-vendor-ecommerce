import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlatformSettings1782240200000 implements MigrationInterface {
  name = 'PlatformSettings1782240200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "platform_settings" ("id" integer NOT NULL DEFAULT '1', "commissionPercent" integer NOT NULL DEFAULT '10', "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_platform_settings_id" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "platform_settings"`);
  }
}
